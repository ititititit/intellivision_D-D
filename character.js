/* =========================================================
   character.js

   Includes:
       Needs and motives
       Character knowledge and memory
       Global, group and personal mnemonic knowledge
       Conditional dialogue options
       Dialogue selection effects
       Game-action handlers

   Browser:
       const { Character, PRESETS } = CharacterModel;

   Knowledge:
       CharacterModel.knowledge

   Arrays in requires fields mean ALL must be present.
   Arrays in excludes fields mean NONE may be present.
========================================================= */

(function(root) {
    "use strict";

	const definitions = root.CharacterDefinitions;
	
	if (!definitions) {
		throw new Error(
			"Load character_definitions.js before character.js."
		);
	}
	
	const {
		NEEDS,
		LAYERS,
		TOPICS,
		VOICES,
		PRESETS
	} = definitions;

    const clamp = n => Math.max(0, Math.min(1, n));

    /* =====================================================
       MNEMONIC KNOWLEDGE
    ===================================================== */

    function mnemonicList(value) {
        const list = value == null
            ? []
            : Array.isArray(value)
                ? value
                : [value];

        if (
            list.some(item =>
                typeof item !== "string" || !item.trim()
            )
        ) {
            throw new Error(
                "Expected a mnemonic or an array of mnemonic strings."
            );
        }

        return [...new Set(list)];
    }

    class KnowledgeStore {
        constructor(saved = {}) {
            this.global = new Set(
                mnemonicList(saved.global)
            );

            this.groups = new Map(
                Object.entries(saved.groups || {}).map(
                    ([id, list]) => [
                        id,
                        new Set(mnemonicList(list))
                    ]
                )
            );

            this.characters = new Map(
                Object.entries(saved.characters || {}).map(
                    ([id, list]) => [
                        id,
                        new Set(mnemonicList(list))
                    ]
                )
            );
        }

        bucket(scope, id) {
            if (scope === "global") {
                return this.global;
            }

            if (!["group", "personal"].includes(scope)) {
                throw new Error("Unknown knowledge scope.");
            }

            if (typeof id !== "string" || !id) {
                throw new Error("Knowledge bucket needs an ID.");
            }

            const map = scope === "group"
                ? this.groups
                : this.characters;

            if (!map.has(id)) {
                map.set(id, new Set());
            }

            return map.get(id);
        }

        add(scope, id, mnemonics, replace = []) {
            const additions = mnemonicList(mnemonics);
            const removals = mnemonicList(replace);

            const bucket = this.bucket(scope, id);

            removals.forEach(item => bucket.delete(item));
            additions.forEach(item => bucket.add(item));

            return this;
        }

        remove(scope, id, mnemonics) {
            const list = mnemonicList(mnemonics);
            const bucket = this.bucket(scope, id);

            list.forEach(item => bucket.delete(item));

            return this;
        }

        has(scope, id, mnemonic) {
            return this.bucket(scope, id).has(mnemonic);
        }

        knownBy(character) {
            return new Set([
                ...this.global,

                ...this.bucket(
                    "personal",
                    character.config.id
                ),

                ...(character.config.groups || []).flatMap(
                    id => [...this.bucket("group", id)]
                )
            ]);
        }

        save() {
            return {
                global: [...this.global],

                groups: Object.fromEntries(
                    [...this.groups].map(
                        ([id, set]) => [id, [...set]]
                    )
                ),

                characters: Object.fromEntries(
                    [...this.characters].map(
                        ([id, set]) => [id, [...set]]
                    )
                )
            };
        }

        static restore(saved) {
            return new KnowledgeStore(saved);
        }
    }

    // Default store shared by all characters.
    const knowledge = new KnowledgeStore();

    /*
       Add knowledge to one character or an array of characters.

       replace is an optional mnemonic or array to remove
       from those same personal buckets.

       Example:
           player_knowledge_add(
               ["mira", "bor"],
               "gate_open",
               "gate_closed"
           );

       No automatic spreading between characters occurs.
    */
    function player_knowledge_add(
        ids,
        mnemonics,
        replace = [],
        store = knowledge
    ) {
        const targets = mnemonicList(ids);
        const additions = mnemonicList(mnemonics);
        const removals = mnemonicList(replace);

        targets.forEach(id =>
            store.add(
                "personal",
                id,
                additions,
                removals
            )
        );
    }

    const tokenize = text =>
        String(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s']/g, " ")
            .split(/\s+/)
            .filter(Boolean);

    const contains = (tokens, words) =>
        words.some(word => tokens.includes(word));

    /* =====================================================
       LANGUAGE PARSER
    ===================================================== */

    function parse(text, context = {}, facts = []) {
        const clean = String(text)
            .replace(/[’]/g, "'")
            .slice(0, 500);

        const tokens = tokenize(clean);
        const has = words => contains(tokens, words);

        const teaching = clean.match(
            /^remember\s*:\s*([^=]+)=(.+)$/i
        );

        const negated = has([
            "not", "never", "don't",
            "won't", "cannot", "can't"
        ]);

        const threatened =
            /\b(?:i will|i'll|let me|going to)\s+(?:kill|hurt|attack|smash)\s+you\b/i
                .test(clean) &&
            !negated;

        const offered =
            /\b(?:offer|give|bring|brought)\b|\bi have\b/i
                .test(clean) &&
            has(["food", "bread", "meal"]);

        const requesting =
            /\b(?:open|unlock)\b|let me (?:pass|through)/i
                .test(clean);

        const question =
            /\?|^(who|what|where|why|how|when|are|can|do|is)\b/i
                .test(clean);

        const intent =
            teaching ? "teach" :
            threatened ? "threat" :
            has(["idiot", "stupid", "fool"]) ? "insult" :
            has(["bye", "goodbye", "farewell"]) ? "leave" :
            has(["thanks", "thank"]) ? "thanks" :
            offered && !negated ? "offer" :
            requesting && !negated && !question ? "request" :
            has(["heal"]) && !negated ? "request" :
            question ? "question" :
            has(["hello", "hi", "greetings"]) ? "greet" :
            "statement";

		const topics = TOPICS;

        const explicit =
            Object.keys(topics).find(
                key => has(topics[key])
            ) ||
            facts.find(fact =>
                tokenize(
                    [
                        fact.topic,
                        ...(fact.tags || [])
                    ].join(" ")
                ).some(word => tokens.includes(word))
            )?.topic;

        const followUp = Boolean(
            !explicit &&
            (
                /^(why|where|how|who|what about)(?:[ ?!]|$)/i
                    .test(clean) ||
                has(["it", "that", "there"])
            )
        );

        const topic =
            explicit ||
            (requesting ? "gate" : null) ||
            (followUp ? context.topic : null);

        const relation =
            /^where\b/i.test(clean) ? "location" :
            /^why\b/i.test(clean) ? "reason" :
            /^(who|what)\b/i.test(clean) ? "identity" :
            null;

        return {
            text: clean,
            tokens,
            intent,
            topic,
            relation,
            negated,
            followUp,

            teaching: teaching
                ? {
                    topic: teaching[1].trim(),
                    text: teaching[2].trim()
                }
                : null
        };
    }



    /* =====================================================
       CHARACTER
    ===================================================== */

    class Character {
        constructor(config, store = knowledge) {
            this.config = JSON.parse(JSON.stringify(config));
            this.needs = { ...config.needs };

            this.knowledge = store;

            // Only seed personal knowledge for a new bucket.
            if (!store.characters.has(config.id)) {
                store.add(
                    "personal",
                    config.id,
                    config.knowledge || []
                );
            }

            for (const group of config.groups || []) {
                store.bucket("group", group);
            }

            this.trust = .5;
            this.warmth = .5;

            this.memory = [];
            this.rumors = [];
            this.flags = {};

            this.context = {
                topic: null,
                lastReason: null
            };

            this.turn = 0;
            this.last = null;
        }

        /* =================================================
           KNOWLEDGE CONDITIONS

           Supported fields:

               requiresGlobal
               excludesGlobal

               requiresPersonal
               excludesPersonal

               requiresKnowledge
               excludesKnowledge

               requiresGroup
               excludesGroup

           Knowledge combines global, personal and groups.

           Group conditions:
               requiresGroup: {
                   shrine: ["knows_ritual"]
               }

           Also supports minTrust.
        ================================================= */

        conditionsMet(entry = {}) {
            const scopes = {
                Global: this.knowledge.global,

                Personal: this.knowledge.bucket(
                    "personal",
                    this.config.id
                ),

                Knowledge: this.knowledge.knownBy(this)
            };

            for (const [suffix, set] of Object.entries(scopes)) {
                const required = mnemonicList(
                    entry["requires" + suffix]
                );

                const excluded = mnemonicList(
                    entry["excludes" + suffix]
                );

                if (!required.every(item => set.has(item))) {
                    return false;
                }

                if (excluded.some(item => set.has(item))) {
                    return false;
                }
            }

            for (const prefix of ["requires", "excludes"]) {
                const groups = entry[prefix + "Group"] || {};

                for (const [id, values] of Object.entries(groups)) {
                    if (!(this.config.groups || []).includes(id)) {
                        return false;
                    }

                    const bucket = this.knowledge.bucket(
                        "group",
                        id
                    );

                    const list = mnemonicList(values);

                    if (
                        prefix === "requires" &&
                        !list.every(item => bucket.has(item))
                    ) {
                        return false;
                    }

                    if (
                        prefix === "excludes" &&
                        list.some(item => bucket.has(item))
                    ) {
                        return false;
                    }
                }
            }

            return this.trust >= (entry.minTrust || 0);
        }

        /* =================================================
           AVAILABLE DIALOGUE BUTTONS

           Recalculate after game events or selections.
        ================================================= */

        availableOptions() {
            return (this.config.dialogue || [])
                .filter(option => this.conditionsMet(option))
                .map(option => ({
                    id: option.id,
                    prompt: option.prompt
                }));
        }

        /* =================================================
           SELECT DIALOGUE OPTION

           actions is an object of game handlers.

           Handler contract:
               synchronous
               returns true or { ok: true } on success
               leaves game unchanged on failure

           Knowledge effects happen only after success.
        ================================================= */

        selectOption(id, world = {}, actions = {}) {
            const option = (this.config.dialogue || [])
                .find(entry => entry.id === id);

            const fail = message => ({
                ok: false,
                text: message,
                action: null,
                options: this.availableOptions()
            });

            // Recheck conditions so stale buttons cannot run.
            if (!option || !this.conditionsMet(option)) {
                return fail("That option is not available.");
            }

            /*
               Validate every knowledge effect before
               invoking an external game action.
            */
            const effects = [];

            for (const verb of ["removes", "adds"]) {
                for (
                    const [suffix, scope] of [
                        ["Global", "global"],
                        ["Personal", "personal"]
                    ]
                ) {
                    effects.push({
                        verb,
                        scope,
                        id: this.config.id,

                        values: mnemonicList(
                            option[verb + suffix]
                        )
                    });
                }

                const groupEffects =
                    option[verb + "Group"] || {};

                for (
                    const [group, values] of
                    Object.entries(groupEffects)
                ) {
                    if (
                        !(this.config.groups || [])
                            .includes(group)
                    ) {
                        throw new Error(
                            "Character is not a member of " + group
                        );
                    }

                    effects.push({
                        verb,
                        scope: "group",
                        id: group,
                        values: mnemonicList(values)
                    });
                }
            }

            if (option.action) {
                const handler =
                    Object.hasOwn(actions, option.action) &&
                    actions[option.action];

                if (typeof handler !== "function") {
                    return fail(
                        "No game handler is registered for " +
                        option.action +
                        "."
                    );
                }

                const result = handler({
                    character: this,
                    world,
                    option
                });

                if (
                    result !== true &&
                    result?.ok !== true
                ) {
                    return fail(
                        result?.message ||
                        "That action could not be completed."
                    );
                }
            }

            /*
               Removals are processed before additions.
               This lets an option replace old knowledge.
            */
            for (const effect of effects) {
                if (effect.verb === "adds") {
                    this.knowledge.add(
                        effect.scope,
                        effect.id,
                        effect.values
                    );
                } else {
                    this.knowledge.remove(
                        effect.scope,
                        effect.id,
                        effect.values
                    );
                }
            }

            this.turn++;

            const reply = option.response || "";

            const result = {
                ok: true,
                text: reply,
                action: option.action || null,

                decision: "dialogue",
                selectedGoal: option.goal || null,

                reason:
                    "Selected conditional dialogue: " + id,

                parsed: {
                    text: option.prompt,
                    intent: "selection",
                    topic: option.topic || null
                },

                ...this.evaluate(world),

                options: this.availableOptions()
            };

            this.last = result;

            if (option.topic) {
                this.context.topic = option.topic;
            }

            this.memory.push({
                turn: this.turn,
                input: option.prompt,
                reply,
                reason: result.reason,
                action: result.action
            });

            this.memory = this.memory.slice(-30);

            return result;
        }

        /* =================================================
           MOTIVES AND GOALS
        ================================================= */

        evaluate(world = {}) {
            const motives = {};

            for (const [name, weights] of Object.entries(LAYERS)) {
                let sum = -1;

                for (const [need, weight] of Object.entries(weights)) {
                    sum += (this.needs[need] || 0) * weight;
                }

                if (name === "selfPreservation") {
                    sum += world.danger ? .8 : 0;
                }

                motives[name] = 1 / (1 + Math.exp(-sum));
            }

            const goals = this.config.goals.map(goal => {
                const complete = Boolean(
                    goal.unless && world[goal.unless]
                );

                return {
                    ...goal,
                    complete,

                    score: complete
                        ? 0
                        : (motives[goal.motive] || 0) * goal.weight
                };
            });

            goals.sort((a, b) => b.score - a.score);

            return { motives, goals };
        }

        /* =================================================
           VOICE AND RESPONSE GENERATION
        ================================================= */

        phrase(kind) {
            const voice =
                VOICES[this.config.voice] || VOICES.gentle;

            const list = voice[kind];

            return list[(this.turn - 1) % list.length];
        }

        realize(plan) {
            return [
                plan.style ? this.phrase(plan.style) : "",
                plan.content,

                plan.reasonText
                    ? "Because " + plan.reasonText + "."
                    : ""
            ].filter(Boolean).join(" ");
        }

        /* =================================================
           RECALL TEXT OR STRUCTURED FACTS

           Legacy facts may also use knowledge conditions.
        ================================================= */

        recall(parsed) {
            const facts = (this.config.facts || [])
                .filter(fact =>
                    this.conditionsMet({
                        ...fact,
                        minTrust: 0
                    })
                )
                .filter(fact =>
                    fact.topic === parsed.topic ||
                    tokenize(
                        [
                            fact.topic,
                            ...(fact.tags || [])
                        ].join(" ")
                    ).some(
                        word => parsed.tokens.includes(word)
                    )
                );

            const available = facts.filter(fact =>
                this.trust >= (fact.minTrust || 0)
            );

            const fact =
                available.find(
                    item => item.relation === parsed.relation
                ) ||
                available.find(item => !item.relation) ||
                available[0];

            if (!fact) {
                return {
                    hidden: facts.length > 0
                };
            }

            let content = fact.text;

            if (!content) {
                if (fact.relation === "location") {
                    content =
                        fact.subject + " is " +
                        fact.object + ".";
                } else if (fact.relation === "reason") {
                    content =
                        "The reason concerns " +
                        fact.subject + ": " +
                        fact.object + ".";
                } else {
                    content =
                        fact.subject + " " +
                        fact.relation + " " +
                        fact.object + ".";
                }

                content =
                    content[0].toUpperCase() +
                    content.slice(1);
            }

            return { fact, content };
        }

        /* =================================================
           HEAR TYPED PLAYER TEXT

           Exact dialogue prompts and aliases are routed
           through selectOption(), including its conditions.
        ================================================= */

        hear(text, world = {}, actions = {}) {
            const normalized =
                String(text).trim().toLowerCase();

            const option = (this.config.dialogue || [])
                .find(entry =>
                    [
                        entry.prompt,
                        ...(entry.aliases || [])
                    ].some(value =>
                        String(value).trim().toLowerCase() ===
                        normalized
                    )
                );

            if (option) {
                return this.selectOption(
                    option.id,
                    world,
                    actions
                );
            }

            const parsed = parse(
                text,
                this.context,
                this.config.facts
            );

            this.turn++;

            for (const key of NEEDS) {
                this.needs[key] = clamp(
                    this.needs[key] +
                    (
                        (this.config.needs[key] || 0) -
                        this.needs[key]
                    ) * .03
                );
            }

            if (parsed.intent === "threat") {
                this.needs.safety = clamp(this.needs.safety + .2);
                this.trust = clamp(this.trust - .25);
            }

            if (parsed.intent === "insult") {
                this.needs.esteem = clamp(this.needs.esteem + .15);
                this.warmth = clamp(this.warmth - .15);
            }

            if (parsed.intent === "thanks") {
                this.trust = clamp(this.trust + .02);
                this.warmth = clamp(this.warmth + .05);
            }

            if (
                this.config.abilities?.includes("openGate") &&
                !parsed.negated &&
                /\b(priestess|mira)\b.*\b(needs?|help|water)\b/i
                    .test(parsed.text)
            ) {
                this.flags.knowsShrineNeed = true;
            }

            const network = this.evaluate(world);
            const candidates = [];

            const propose = (
                id,
                motive,
                base,
                content,
                extra = {}
            ) => {
                const goal = network.goals.find(item =>
                    item.motive === motive &&
                    !item.complete
                );

                candidates.push({
                    id,
                    motive,

                    score:
                        base +
                        (
                            goal?.score ||
                            network.motives[motive] ||
                            0
                        ),

                    goal: goal?.name || motive,
                    content,

                    ...extra
                });
            };

            /* ---------------------------------------------
               SOCIAL RESPONSES
            --------------------------------------------- */

            if (world.danger || parsed.intent === "threat") {
                propose(
                    "withdraw", "selfPreservation", 20,
                    "We can speak when it is safe.",
                    {
                        style: "refuse",
                        reasonText: "there is danger here"
                    }
                );
            }

            else if (parsed.intent === "insult") {
                propose(
                    "boundary", "independence", 15,
                    "Speak respectfully before asking for help.",
                    {
                        style: "refuse"
                    }
                );
            }

            else if (parsed.intent === "leave") {
                propose(
                    "leave", "connection", 15,
                    "Farewell, traveler."
                );
            }

            else if (parsed.intent === "teach") {
                propose(
                    "remember", "discovery", 15,
                    "I will remember this as your account, " +
                    "not as verified knowledge."
                );
            }

            else if (parsed.intent === "greet") {
                propose(
                    "greet", "connection", 15,
                    "I am " + this.config.name + ".",
                    {
                        style: "greet"
                    }
                );
            }

            else if (parsed.intent === "thanks") {
                propose(
                    "thanks", "connection", 15, "",
                    {
                        style: "thanks"
                    }
                );
            }

            else if (
                /who are you|yourself|background|your name/i
                    .test(parsed.text)
            ) {
                propose(
                    "identity", "connection", 10,
                    this.config.story
                );
            }

            /* ---------------------------------------------
               KNOWLEDGE AND GAME DECISIONS
            --------------------------------------------- */

            else {
                if (
                    parsed.followUp &&
                    parsed.relation === "reason" &&
                    this.context.lastReason
                ) {
                    propose(
                        "explain", "discovery", 12,
                        "Because " +
                        this.context.lastReason +
                        "."
                    );
                }

                const recalled = this.recall(parsed);

                if (recalled.content) {
                    propose(
                        "inform", "discovery", 1.5,
                        recalled.content,
                        {
                            fact: recalled.fact
                        }
                    );
                } else if (recalled.hidden) {
                    propose(
                        "protectSecret", "selfPreservation", 5,
                        "I protect that knowledge until " +
                        "I know you better.",
                        {
                            style: "refuse",
                            reasonText:
                                "other people depend on my discretion"
                        }
                    );
                }

                const rumor = this.rumors.find(entry =>
                    entry.topic === parsed.topic ||
                    tokenize(entry.topic).some(
                        word => parsed.tokens.includes(word)
                    )
                );

                if (
                    rumor &&
                    !recalled.content &&
                    !recalled.hidden
                ) {
                    propose(
                        "recallRumor", "discovery", 3,
                        "You told me: " + rumor.text
                    );
                }

                const abilities =
                    this.config.abilities || [];

                /* -----------------------------------------
                   FOOD
                ----------------------------------------- */

                if (
                    abilities.includes("acceptFood") &&
                    parsed.intent === "offer" &&
                    parsed.topic === "food"
                ) {
                    if (world.borFed) {
                        propose(
                            "full", "nourishment", 8,
                            "Keep your food. I have eaten."
                        );
                    } else if (!(world.food > 0)) {
                        propose(
                            "noFood", "nourishment", 8,
                            "You have no bread to offer.",
                            {
                                style: "refuse"
                            }
                        );
                    } else if (
                        network.motives.nourishment > .45
                    ) {
                        propose(
                            "eat", "nourishment", 6,
                            "I accept your bread.",
                            {
                                style: "help",
                                action: "feedBor",
                                reasonText: "I need a meal"
                            }
                        );
                    } else {
                        propose(
                            "notHungry", "nourishment", 8,
                            "Keep the bread. I am not hungry.",
                            {
                                style: "refuse"
                            }
                        );
                    }
                }

                /* -----------------------------------------
                   GATE DECISION
                ----------------------------------------- */

                const gateRequest =
                    parsed.topic === "gate" &&
                    !parsed.negated &&
                    (
                        parsed.intent === "request" ||
                        /\b(can|will|would|could) you\b.*(?:open|let|unlock)/i
                            .test(parsed.text)
                    );

                if (
                    abilities.includes("openGate") &&
                    parsed.topic === "gate"
                ) {
                    if (world.gateOpen) {
                        propose(
                            "gateOpen", "duty", 7,
                            "The gate is open. You may pass."
                        );
                    } else if (gateRequest) {
                        propose(
                            "guard", "selfPreservation", 2.1,
                            "The gate stays closed.",
                            {
                                style: "refuse",
                                reasonText:
                                    "my master will punish me"
                            }
                        );

                        if (this.flags.knowsShrineNeed) {
                            propose(
                                "cooperate",
                                "duty",

                                1.4 +
                                network.motives.compassion * .5 +
                                (world.borFed ? .65 : 0) +
                                this.trust * .4,

                                "I will open the gate. " +
                                "Go help the priestess.",

                                {
                                    style: "help",
                                    action: "openGate",
                                    reasonText:
                                        "she once helped me, and " +
                                        "kindness deserves kindness"
                                }
                            );
                        }
                    }
                }

                if (
                    abilities.includes("openGate") &&
                    this.flags.knowsShrineNeed &&
                    (
                        parsed.topic === "priestess" ||
                        parsed.topic === "fountain"
                    )
                ) {
                    propose(
                        "acknowledgeAppeal", "duty", 4,
                        "She helped me when I was wounded. " +
                        "We should talk about the gate.",
                        {
                            reasonText:
                                "I remember her kindness"
                        }
                    );
                }

                /* -----------------------------------------
                   HEALING
                ----------------------------------------- */

                if (
                    abilities.includes("heal") &&
                    parsed.topic === "injury" &&
                    !parsed.negated
                ) {
                    if (world.health >= 10) {
                        propose(
                            "well", "compassion", 8,
                            "You are already well."
                        );
                    } else if (this.flags.healed) {
                        propose(
                            "rest", "selfPreservation", 8,
                            "My strength needs time to return.",
                            {
                                style: "refuse"
                            }
                        );
                    } else if (
                        this.trust >= .35 &&
                        network.motives.compassion > .55
                    ) {
                        propose(
                            "heal", "compassion", 5,
                            "Let me tend your wounds.",
                            {
                                style: "help",
                                action: "heal",
                                reasonText:
                                    "your suffering matters to me"
                            }
                        );
                    } else {
                        propose(
                            "declineHealing", "selfPreservation", 8,
                            "I cannot offer a blessing now.",
                            {
                                style: "refuse"
                            }
                        );
                    }
                }

                if (
                    abilities.includes("heal") &&
                    parsed.topic === "fountain" &&
                    world.fountainRestored
                ) {
                    propose(
                        "celebrate", "compassion", 8,
                        "The fountain flows again. Our shrine lives.",
                        {
                            style: "thanks"
                        }
                    );
                }

                /* -----------------------------------------
                   FALLBACK
                ----------------------------------------- */

                const publicTopics = this.config.facts
                    .filter(fact => !fact.minTrust)
                    .map(fact => fact.topic)
                    .filter(
                        (topic, index, array) =>
                            array.indexOf(topic) === index
                    )
                    .slice(0, 3);

                propose(
                    "clarify", "connection", -2,
                    "Ask me about " +
                    publicTopics.join(", ") +
                    ".",
                    {
                        style: "unknown"
                    }
                );
            }

            /* ---------------------------------------------
               CHOOSE RESPONSE
            --------------------------------------------- */

            candidates.sort((a, b) => b.score - a.score);

            const plan = candidates[0];
            let action = plan.action || null;

            /* ---------------------------------------------
               ORIGINAL TEST-GAME EFFECTS

               Conditional dialogue actions use the supplied
               handlers in selectOption().

               These older actions remain for compatibility.
            --------------------------------------------- */

            if (
                action === "feedBor" &&
                world.food > 0 &&
                !world.borFed
            ) {
                world.food--;
                world.borFed = true;

                this.needs.hunger = .1;
                this.trust = clamp(this.trust + .2);
            } else if (
                action === "openGate" &&
                !world.gateOpen
            ) {
                world.gateOpen = true;
            } else if (
                action === "heal" &&
                Number.isFinite(world.health) &&
                world.health < 10 &&
                !this.flags.healed
            ) {
                world.health = Math.min(
                    10,
                    world.health + 4
                );

                this.flags.healed = true;
            } else if (action) {
                action = null;
                plan.content =
                    "That action is no longer possible.";
                plan.style = "refuse";
            }

            /* ---------------------------------------------
               MEMORY AND CONTEXT
            --------------------------------------------- */

            if (plan.id === "remember") {
                this.rumors.push(parsed.teaching);
                this.rumors = this.rumors.slice(-20);
            }

            if (parsed.topic) {
                this.context.topic = parsed.topic;
            }

            if (plan.reasonText) {
                this.context.lastReason = plan.reasonText;
            } else if (!parsed.followUp) {
                this.context.lastReason = null;
            }

            const reply = this.realize(plan);

            const result = {
                text: reply,

                reason:
                    plan.id + " selected for " + plan.goal,

                action,
                parsed,

                selectedGoal: plan.goal,
                decision: plan.id,

                candidates: candidates.map(entry => ({
                    id: entry.id,
                    goal: entry.goal,
                    score: entry.score
                })),

                ...this.evaluate(world)
            };

            this.last = result;

            this.memory.push({
                turn: this.turn,
                input: parsed.text,
                reply,
                reason: result.reason,
                action
            });

            this.memory = this.memory.slice(-30);

            return result;
        }

        /* =================================================
           SAVE AND RESTORE

           Save the shared KnowledgeStore separately once.
        ================================================= */

        save() {
            return {
                personalKnowledge: [
                    ...this.knowledge.bucket(
                        "personal",
                        this.config.id
                    )
                ],

                config: this.config,
                needs: this.needs,
                trust: this.trust,
                warmth: this.warmth,
                memory: this.memory,
                rumors: this.rumors,
                flags: this.flags,
                context: this.context,
                turn: this.turn,
                last: this.last
            };
        }

        static restore(saved, store = knowledge) {
            // Also permits savedCharacters.map(Character.restore).
            if (!(store instanceof KnowledgeStore)) {
                store = knowledge;
            }

            const result = Object.assign(
                new Character(saved.config, store),
                saved
            );

            result.knowledge = store;

            if (saved.personalKnowledge) {
                store.characters.set(
                    saved.config.id,
                    new Set(
                        mnemonicList(saved.personalKnowledge)
                    )
                );
            }

            return result;
        }
    }

	/* =========================================================
	   CHARACTER DIALOGUE POPUP
	
	   Usage:
		   CharacterModel.showCharacterDialogue(character, {
			   world,
			   actions,
			   onOpen,
			   onClose,
			   onResponse
		   });
	
	   Returns:
		   {
			   close(),
			   refresh()
		   }
	
	   The game controls pausing through onOpen/onClose.
	========================================================= */
	
	let activeCharacterDialogue = null;
	
	function showCharacterDialogue(character, options = {}) {
		if (typeof document === "undefined") {
			throw new Error(
				"Dialogue popup requires a browser."
			);
		}
	
		if (
			!character ||
			typeof character.hear !== "function" ||
			typeof character.availableOptions !== "function"
		) {
			throw new Error(
				"Expected a Character instance."
			);
		}
	
		// Only one character popup at a time.
		if (activeCharacterDialogue) {
			activeCharacterDialogue.close();
		}
	
		const world = options.world || {};
		const actions = options.actions || {};
		const previousFocus = document.activeElement;
	
		/* -----------------------------------------------------
		   CREATE POPUP
		----------------------------------------------------- */
	
		const dialog = document.createElement("dialog");
	
		dialog.className = "character-dialogue-popup";
	
		dialog.setAttribute(
			"aria-label",
			"Conversation with " + character.config.name
		);
	
		const style = document.createElement("style");
	
		style.textContent = `
	.character-dialogue-popup {
		box-sizing: border-box;
		width: min(560px, 94vw);
		max-height: 90vh;
		padding: 20px;
		border: 2px solid #b99a68;
		border-radius: 10px;
		background: #19252b;
		color: #eee7d7;
		font: 16px/1.5 Arial, sans-serif;
		color-scheme: dark;
		overflow: auto;
		box-shadow: 0 16px 70px #000a;
	}
	
	.character-dialogue-popup::backdrop {
		background: #000a;
	}
	
	.character-dialogue-popup * {
		box-sizing: border-box;
	}
	
	.character-dialogue-popup h2 {
		margin: 0;
		font: 26px Georgia, serif;
		color: #f0d599;
	}
	
	.character-dialogue-popup p {
		margin: 8px 0;
	}
	
	.character-dialogue-popup .cd-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	
	.character-dialogue-popup .cd-role {
		color: #aec3bc;
		font-size: 13px;
	}
	
	.character-dialogue-popup .cd-log {
		height: 240px;
		max-height: 35vh;
		overflow: auto;
		background: #101a20;
		border-radius: 6px;
		margin: 14px 0;
		padding: 10px;
	}
	
	.character-dialogue-popup .cd-line {
		padding: 9px 11px;
		margin: 7px 18px 7px 0;
		background: #2d4237;
		border-radius: 6px;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	
	.character-dialogue-popup .cd-player {
		margin: 7px 0 7px 18px;
		background: #293e4c;
	}
	
	.character-dialogue-popup .cd-buttons {
		display: flex;
		gap: 7px;
		flex-wrap: wrap;
		margin: 8px 0 14px;
	}
	
	.character-dialogue-popup button {
		font: 14px Arial, sans-serif;
		padding: 9px 12px;
		background: #2d424a;
		color: #f5efdf;
		border: 1px solid #82968c;
		border-radius: 5px;
		cursor: pointer;
	}
	
	.character-dialogue-popup button:hover {
		background: #425d62;
	}
	
	.character-dialogue-popup button:focus-visible,
	.character-dialogue-popup input:focus-visible {
		outline: 2px solid #f0d599;
		outline-offset: 2px;
	}
	
	.character-dialogue-popup .cd-choice {
		border-color: #dfbd75;
	}
	
	.character-dialogue-popup form {
		display: flex;
		gap: 8px;
		margin: 10px 0;
	}
	
	.character-dialogue-popup input {
		min-width: 0;
		flex: 1;
		padding: 10px;
		background: #101a20;
		color: #fff;
		border: 1px solid #82968c;
		border-radius: 5px;
		font: 16px Arial, sans-serif;
	}
	
	.character-dialogue-popup .cd-status {
		color: #edc98a;
		font-size: 13px;
		min-height: 20px;
	}
	
	.character-dialogue-popup .cd-label {
		font-size: 13px;
		color: #b9cabb;
	}
	`;
	
		/* -----------------------------------------------------
		   ELEMENT HELPERS
		----------------------------------------------------- */
	
		function make(tag, text, className) {
			const node = document.createElement(tag);
	
			if (text !== undefined) {
				node.textContent = text;
			}
	
			if (className) {
				node.className = className;
			}
	
			return node;
		}
	
		function button(text, handler, className) {
			const node = make(
				"button",
				text,
				className
			);
	
			node.type = "button";
			node.addEventListener("click", handler);
	
			return node;
		}
	
		/* -----------------------------------------------------
		   HEADER
		----------------------------------------------------- */
	
		const header = make(
			"div",
			undefined,
			"cd-header"
		);
	
		const title = make(
			"h2",
			character.config.name
		);
	
		const exit = button(
			"Close",
			() => close()
		);
	
		header.append(title, exit);
	
		const role = make(
			"div",
			character.config.role || "",
			"cd-role"
		);
	
		/* -----------------------------------------------------
		   CONVERSATION AND BUTTON AREAS
		----------------------------------------------------- */
	
		const log = make(
			"div",
			undefined,
			"cd-log"
		);
	
		log.setAttribute("role", "log");
		log.setAttribute("aria-label", "Conversation");
	
		const general = make(
			"div",
			undefined,
			"cd-buttons"
		);
	
		const choices = make(
			"div",
			undefined,
			"cd-buttons"
		);
	
		const choiceLabel = make(
			"div",
			"Your choices",
			"cd-label"
		);
	
		/* -----------------------------------------------------
		   TEXT INPUT
		----------------------------------------------------- */
	
		const form = make("form");
		const input = make("input");
	
		input.type = "text";
		input.maxLength = 500;
		input.placeholder = "Say something…";
	
		input.setAttribute(
			"aria-label",
			"Your message"
		);
	
		const submit = make("button", "Speak");
		submit.type = "submit";
	
		form.append(input, submit);
	
		const status = make(
			"p",
			"",
			"cd-status"
		);
	
		status.setAttribute("role", "status");
	
		dialog.append(
			style,
			header,
			role,
			log,
			make("div", "Things to say", "cd-label"),
			general,
			choiceLabel,
			choices,
			form,
			status
		);
	
		let closed = false;
		let opened = false;
	
		const controller = {
			close,
			refresh
		};
	
		/* -----------------------------------------------------
		   CLOSE POPUP
		----------------------------------------------------- */
	
		function close() {
			if (closed)
				return;
	
			closed = true;
	
			if (dialog.open) {
				dialog.close();
			}
	
			dialog.remove();
	
			if (activeCharacterDialogue === controller) {
				activeCharacterDialogue = null;
			}
	
			if (previousFocus?.isConnected) {
				previousFocus.focus();
			}
	
			if (opened) {
				options.onClose?.(character);
			}
		}
	
		/* -----------------------------------------------------
		   REFRESH CONVERSATION AND AVAILABLE OPTIONS
		----------------------------------------------------- */
	
		function refresh() {
			if (closed)
				return;
	
			const focused = document.activeElement;
	
			const generalIndex =
				Array.from(general.children).indexOf(focused);
	
			const focusedOption =
				focused?.dataset?.optionId;
	
			log.replaceChildren();
	
			for (const memory of character.memory || []) {
				log.append(
					make(
						"div",
						"You: " + memory.input,
						"cd-line cd-player"
					),
	
					make(
						"div",
						character.config.name +
						": " +
						memory.reply,
						"cd-line"
					)
				);
			}
	
			if (!log.children.length) {
				log.append(
					make(
						"p",
						"Choose something to say, or type below."
					)
				);
			}
	
			log.scrollTop = log.scrollHeight;
	
			const prompts = [
				"Hello",
				"Who are you?"
			];
	
			if (
				Array.isArray(
					character.config.conversationPrompts
				)
			) {
				for (
					const entry of
					character.config.conversationPrompts
				) {
					if (typeof entry === "string") {
						prompts.push(entry);
					}
	
					else if (
						entry &&
						character.conditionsMet(entry)
					) {
						prompts.push(entry.prompt);
					}
				}
			}
	
			else {
				for (
					const fact of
					character.config.facts || []
				) {
					if (
						fact.topic &&
						character.conditionsMet(fact)
					) {
						prompts.push(
							"Tell me about " + fact.topic
						);
					}
				}
	
				const abilities =
					character.config.abilities || [];
	
				if (abilities.includes("heal")) {
					prompts.push(
						"Please heal my wounds"
					);
				}
	
				if (abilities.includes("acceptFood")) {
					prompts.push(
						"Are you hungry?",
						"I offer you food"
					);
				}
	
				if (abilities.includes("openGate")) {
					prompts.push(
						"Please open the gate"
					);
				}
			}
	
			if (character.context?.topic) {
				prompts.push(
					"Why?",
					"Where is it?"
				);
			}
	
			// Conditional options must not leak into general buttons.
			const conditionalText = new Set(
				(character.config.dialogue || [])
					.flatMap(option => [
						option.prompt,
						...(option.aliases || [])
					])
					.map(text =>
						String(text).trim().toLowerCase()
					)
			);
	
			const seen = new Set();
	
			general.replaceChildren(
				...prompts
					.filter(prompt => {
						if (
							typeof prompt !== "string" ||
							!prompt.trim()
						) {
							return false;
						}
	
						const key =
							prompt.trim().toLowerCase();
	
						if (
							seen.has(key) ||
							conditionalText.has(key)
						) {
							return false;
						}
	
						seen.add(key);
						return true;
					})
					.map(prompt =>
						button(
							prompt,
							() => communicate(
								() => character.hear(
									prompt,
									world,
									actions
								)
							)
						)
					)
			);
	
			general.append(
				button("Goodbye", close)
			);
	
			const available =
				character.availableOptions();
	
			choiceLabel.hidden = !available.length;
	
			choices.replaceChildren(
				...available.map(option => {
					const node = button(
						option.prompt,
	
						() => communicate(
							() => character.selectOption(
								option.id,
								world,
								actions
							)
						),
	
						"cd-choice"
					);
	
					node.dataset.optionId = option.id;
	
					return node;
				})
			);
	
			/*
			   Restore keyboard focus when a selected choice
			   disappears and the buttons are rebuilt.
			*/
			if (focusedOption) {
				const replacement =
					Array.from(choices.children).find(
						node =>
							node.dataset.optionId ===
							focusedOption
					);
	
				(replacement || input).focus();
			}
	
			else if (generalIndex >= 0) {
				(
					general.children[generalIndex] ||
					input
				).focus();
			}
		}
	
		/* -----------------------------------------------------
		   RUN A CONVERSATION ACTION
		----------------------------------------------------- */
	
		function communicate(operation) {
			try {
				const result = operation();
	
				status.textContent =
					result.ok === false
						? result.text
						: "";
	
				input.value = "";
	
				refresh();
	
				options.onResponse?.(
					result,
					character
				);
			} catch (error) {
				status.textContent =
					error.message || String(error);
			}
		}
	
		form.addEventListener("submit", event => {
			event.preventDefault();
	
			const text = input.value.trim();
	
			if (text) {
				communicate(
					() => character.hear(
						text,
						world,
						actions
					)
				);
			}
		});
	
		/*
		   Keep ordinary bubbling game keyboard handlers from
		   receiving dialogue input.
	
		   Capture-phase game handlers must also check whether
		   the game is paused.
		*/
		for (
			const type of
			["keydown", "keyup", "keypress"]
		) {
			dialog.addEventListener(
				type,
				event => event.stopPropagation()
			);
		}
	
		// Escape closes the popup.
		dialog.addEventListener("cancel", event => {
			event.preventDefault();
			close();
		});
	
		dialog.addEventListener("close", close);
	
		/* -----------------------------------------------------
		   DISPLAY POPUP
		----------------------------------------------------- */
	
		document.body.append(dialog);
	
		try {
			dialog.showModal();
	
			activeCharacterDialogue = controller;
			opened = true;
	
			options.onOpen?.(character);
	
			refresh();
			input.focus();
		} catch (error) {
			close();
			throw error;
		}
	
		return controller;
	}

    /* =====================================================
       EXPORT
    ===================================================== */

    const api = {
        Character,
        KnowledgeStore,
        knowledge,
        player_knowledge_add,
        showCharacterDialogue,
        PRESETS,
        NEEDS,
        LAYERS,
        parse
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        root.CharacterModel = api;
    }

})(globalThis);