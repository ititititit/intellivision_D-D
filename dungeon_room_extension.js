"use strict";

/* =========================================================
   DUNGEON ROOM EXTENSIONS

   No timer is installed.
   Call RoomExtensions.updateRoomAnimations(deltaTime)
   from the game loop.

   deltaTime and tickInterval are milliseconds.

   Designer format (all extension fields are optional):

   {
       animation: {
           min: 0,
           max: 8,
           counter: 0,
           direction: 1,
           running: false,
           mode: "once",
           tickInterval: 200
       },

       animatedCells: [{
           x: 4,
           y: 4,
           rotation: 0,
           pattern: [1, 7, 8, 9, 10],
           offset: 0,
           sampling: "clamp"
       }],

       triggers: [{
           x: 4,
           y: 3,
           activation: ["step", "arrow"],
           once: true,
           actions: [{
               type: "startAnimation",
               direction: 1
           }]
       }],

       objects: [{
           x: 2,
           y: 2,
           value: 123
       }]
   }

   Pattern entries are UNENCODED block/sprite IDs.
   Supply current game IDs from the designer.
   Old editor IDs are not assumed.

   sampling:
       "clamp" = hold at the first or last pattern entry
       "wrap"  = repeat the pattern

   Pattern index = counter - min + offset.

   TODO DESIGN:
       Editor A() conversion.
       Endpoint hold conventions.
       Cross-room trigger targets.
       Arrow consumption.
       Spawn occupancy rules.

   Repeated pattern entries can represent holds.
========================================================= */

const RoomExtensions = (() => {

    const rooms = new Set();

    let adapters = {};

    /* =====================================================
       CONFIGURE GAME CONNECTIONS

       Supply only the adapters needed by your room data.

       encodeBlock(blockID, rotation)
       writeTile(x, y, encodedValue)
       addKnowledge(action, context, room)
       changeObject(target, room, context)
       depositObject(target, room, context)
       depositMonster(target, room, context)

       Missing adapters throw an explicit error when used.
    ===================================================== */

    function configureRoomExtensions(options) {
        adapters = {
            ...adapters,
            ...options
        };
    }

    function requireAdapter(name, ...args) {
        if (typeof adapters[name] !== "function") {
            throw new Error(
                "Room extensions TODO: configure adapter " + name
            );
        }

        return adapters[name](...args);
    }

    /* =====================================================
       VALIDATE INTEGER
    ===================================================== */

    function integer(value, name) {
        if (!Number.isSafeInteger(value)) {
            throw new Error(
                name + " must be a safe integer"
            );
        }

        return value;
    }

    /* =====================================================
       TRANSFORM ROOM-LOCAL POSITION

       Applies clockwise room rotation, then adds the room's
       top-left dungeon tile position.

       Local coordinates range from 0 through 8.
    ===================================================== */

    function transform(room, x, y, rotation = 0) {
        integer(x, "x");
        integer(y, "y");

        if (
            x < 0 ||
            y < 0 ||
            x >= 9 ||
            y >= 9
        ) {
            throw new Error(
                "Room-local position must be inside 9x9 room"
            );
        }

        const turn = room.orientation;

        for (let i = 0; i < turn; i++) {
            [x, y] = [8 - y, x];
        }

        return {
            x: room.originX + x,
            y: room.originY + y,
            rotation: ((rotation + turn) % 4 + 4) % 4
        };
    }

    /* =====================================================
       WRITE FRAME INTO NUMERIC DUNGEON GRID
    ===================================================== */

    function writeFrame(room, cell, blockID) {
        integer(blockID, "blockID");

        const position = transform(
            room,
            cell.x,
            cell.y,
            cell.rotation ?? 0
        );

        // TODO GAME:
        // Connect encodeBlock to B(), or the current equivalent.

        const value = requireAdapter(
            "encodeBlock",
            blockID,
            position.rotation
        );

        // TODO GAME:
        // Connect writeTile to the actual numeric dungeon grid.

        requireAdapter(
            "writeTile",
            position.x,
            position.y,
            value
        );
    }

    /* =====================================================
       APPLY CURRENT ROOM ANIMATION FRAME
    ===================================================== */

    function applyRoomAnimation(room) {
        if (!room.animation || !room.animatedCells)
            return;

        for (const cell of room.animatedCells) {
            const pattern = cell.pattern;

            let index =
                room.animation.counter -
                room.animation.min +
                (cell.offset ?? 0);

            if (cell.sampling === "wrap") {
                index =
                    ((index % pattern.length) + pattern.length) %
                    pattern.length;
            } else {
                index = Math.max(
                    0,
                    Math.min(pattern.length - 1, index)
                );
            }

            writeFrame(room, cell, pattern[index]);
        }
    }

    /* =====================================================
       INITIALIZE ROOM EXTENSIONS

       Call AFTER static room tiles have been copied into
       the dungeon grid.

       room:
           Generated room record containing orientation.

       definition:
           Designer-built extension data.

       originX / originY:
           Top-left dungeon TILE coordinates.

       Definition data is cloned so repeated room templates
       have independent runtime state.

       Reinitialization requires removeRoomExtensions(room)
       first.
    ===================================================== */

    function initializeRoomExtensions(
        room,
        definition = {},
        originX,
        originY
    ) {
        if (rooms.has(room))
            throw new Error("Room already initialized");

        integer(originX, "originX");
        integer(originY, "originY");
        integer(room.orientation, "orientation");

        const data = structuredClone(definition);
		// Named triggers must be unique across the active dungeon.
		// Unnamed triggers can still work through step and arrow.
		const triggerIDs = new Set();
		
		for (const trigger of data.triggers ?? []) {
			if (trigger.id === undefined)
				continue;
		
			if (
				typeof trigger.id !== "string" ||
				!trigger.id.trim() ||
				trigger.id !== trigger.id.trim()
			) {
				throw new Error(
					"Trigger ID must be a nonempty string without outer spaces."
				);
			}
		
			if (triggerIDs.has(trigger.id)) {
				throw new Error(
					"Duplicate trigger ID: " + trigger.id
				);
			}
		
			for (const existingRoom of rooms) {
				if (
					(existingRoom.triggers ?? []).some(
						existing => existing.id === trigger.id
					)
				) {
					throw new Error(
						"Duplicate trigger ID: " + trigger.id
					);
				}
			}
		
			triggerIDs.add(trigger.id);
		}


        if (
            data.animatedCells?.length &&
            !data.animation
        ) {
            throw new Error(
                "Animated cells require a room animation controller"
            );
        }

        if (data.animation) {
            const animation = data.animation;

            animation.min ??= 0;
            animation.counter ??= animation.min;
            animation.direction ??= 1;
            animation.running ??= false;
            animation.mode ??= "once";
            animation.tickInterval ??= 200;

            for (const key of ["min", "max", "counter"]) {
                integer(animation[key], key);
            }

            if (
                animation.min > animation.max ||
                animation.counter < animation.min ||
                animation.counter > animation.max ||
                ![1, -1].includes(animation.direction) ||
                !["once", "pingPong"].includes(animation.mode) ||
                typeof animation.running !== "boolean" ||
                !Number.isFinite(animation.tickInterval) ||
                animation.tickInterval <= 0
            ) {
                throw new Error(
                    "Invalid room animation controller"
                );
            }

            animation.elapsed = 0;
        }

        for (const cell of data.animatedCells ?? []) {
            if (
                !Array.isArray(cell.pattern) ||
                !cell.pattern.length
            ) {
                throw new Error(
                    "Animated cell requires a nonempty pattern"
                );
            }

            cell.pattern.forEach(id => {
                integer(id, "pattern ID");
            });

            integer(cell.offset ?? 0, "offset");

            // Explicit policy required until the designer
            // settles its default.

            if (!["wrap", "clamp"].includes(cell.sampling)) {
                throw new Error(
                    "Animated cell sampling must be wrap or clamp"
                );
            }
        }

        room.originX = originX;
        room.originY = originY;

        room.orientation =
            ((room.orientation % 4) + 4) % 4;

        for (const key of [
            "animation",
            "animatedCells",
            "triggers",
            "objects",
            "monsters"
        ]) {
            if (data[key] !== undefined)
                room[key] = data[key];
        }

        for (const trigger of room.triggers ?? []) {
            trigger.fired = false;
        }

        rooms.add(room);

        applyRoomAnimation(room);

        for (const object of room.objects ?? []) {
            requireAdapter(
                "depositObject",
                {
                    ...object,
                    ...transform(
                        room,
                        object.x,
                        object.y,
                        object.rotation ?? 0
                    )
                },
                room
            );
        }

        // Create predefined monsters and characters.
        for (const monster of room.monsters ?? []) {

            requireAdapter(
                "depositMonster",
                {
                    ...monster,
                    ...transform(
                        room,
                        monster.x,
                        monster.y,
                        monster.rotation ?? 0
                    )
                },
                room
            );
        }

        return room;
    }

    /* =====================================================
       START / RESUME ROOM ANIMATION

       direction:
           +1 = count up
           -1 = count down

       Omitting direction preserves the current direction.
    ===================================================== */

    function startRoomAnimation(
        room,
        direction = room.animation?.direction ?? 1
    ) {
        if (!room.animation)
            return false;

        if (![1, -1].includes(direction)) {
            throw new Error(
                "Direction must be +1 or -1"
            );
        }

        room.animation.direction = direction;
        room.animation.running = true;

        return true;
    }

    /* =====================================================
       STOP ROOM ANIMATION

       Preserves the current counter and elapsed tick time.
    ===================================================== */

    function stopRoomAnimation(room) {
        if (!room.animation)
            return false;

        room.animation.running = false;

        return true;
    }

    /* =====================================================
       UPDATE ROOM ANIMATIONS

       mode:
           "once"     = stop at the endpoint
           "pingPong" = reverse at each endpoint
    ===================================================== */

    function updateRoomAnimations(deltaTime) {
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime < 0
        ) {
            throw new Error(
                "deltaTime must be nonnegative milliseconds"
            );
        }

        for (const room of rooms) {
            const animation = room.animation;

            if (!animation?.running)
                continue;

            if (animation.min === animation.max) {
                animation.running = false;
                continue;
            }

            animation.elapsed += deltaTime;

            while (
                animation.running &&
                animation.elapsed >= animation.tickInterval
            ) {
                animation.elapsed -= animation.tickInterval;

                animation.counter = Math.max(
                    animation.min,
                    Math.min(
                        animation.max,
                        animation.counter + animation.direction
                    )
                );

                applyRoomAnimation(room);

                const atEnd = animation.direction > 0
                    ? animation.counter === animation.max
                    : animation.counter === animation.min;

                if (atEnd) {
                    if (animation.mode === "pingPong") {
                        animation.direction *= -1;
                    } else {
                        animation.running = false;
                        animation.elapsed = 0;
                    }
                }
            }
        }
    }

	/* =====================================================
	   FIND NAMED TRIGGER
	
	   Returns its owning room and trigger, or null.
	===================================================== */
	
	function findTrigger(id) {
		if (
			typeof id !== "string" ||
			!id.trim()
		) {
			throw new Error(
				"Expected a nonempty trigger ID."
			);
		}
	
		for (const room of rooms) {
			const trigger = (room.triggers ?? [])
				.find(entry => entry.id === id);
	
			if (trigger) {
				return { room, trigger };
			}
		}
	
		return null;
	}
	
	/* =====================================================
	   FIRE NAMED TRIGGER
	
	   Actions operate on the target trigger's owning room.
	
	   Returns false when disabled, already fired once,
	   or currently executing.
	
	   Unknown names throw to expose configuration mistakes.
	===================================================== */
	
	function fireTrigger(id, context = {}) {
		const target = findTrigger(id);
	
		if (!target) {
			throw new Error(
				"Unknown room trigger: " + id
			);
		}
	
		return activateRoomTrigger(
			target.room,
			target.trigger,
			context
		);
	}

    /* =====================================================
       EXECUTE ONE TRIGGER ACTION

       Actions execute in their defined order.

       Tile changes to animated cells can be overwritten by
       the next animation tick. Stop the animation first
       when appropriate.
    ===================================================== */

    function executeRoomTriggerAction(
        room,
        action,
        context = {}
    ) {
        switch (action.type) {

            case "startAnimation":
                return startRoomAnimation(
                    room,
                    action.direction
                );

            case "stopAnimation":
                return stopRoomAnimation(room);

            case "changeTile":
                return writeFrame(
                    room,
                    action,
                    action.blockID
                );

            case "addKnowledge":
                // TODO GAME:
                // Connect destination and identifiers to
                // the knowledge functions in character.js.

                return requireAdapter(
                    "addKnowledge",
                    action,
                    context,
                    room
                );

            case "changeObject":
            case "depositObject":
            case "depositMonster": {
                const target = {
                    ...action,
                    ...transform(
                        room,
                        action.x,
                        action.y,
                        action.rotation ?? 0
                    )
                };

                // TODO GAME:
                // Object representation, monster initialization,
                // and occupied-square policy belong in adapters.

                return requireAdapter(
                    action.type,
                    target,
                    room,
                    context
                );
            }

			case "fireTrigger":
				return fireTrigger(
					action.id,
					context
				);

            default:
                throw new Error(
                    "Unknown room trigger action: " + action.type
                );
        }
    }

    /* =====================================================
       ACTIVATE TRIGGER

       once:
           true  = activate once
           false = allow repeated activation

       enabled:
           false = ignore trigger

       Failed adapters throw. Earlier actions are not rolled
       back. Do not automatically retry a partially run list.
    ===================================================== */

    function activateRoomTrigger(
        room,
        trigger,
        context = {}
    ) {
        if (
            trigger.enabled === false ||
            (trigger.once && trigger.fired)
        ) {
            return false;
        }

        // Prevent recursive activation of the same trigger.

        if (trigger.executing)
            return false;

        trigger.executing = true;

        try {
            for (const action of trigger.actions ?? []) {
                executeRoomTriggerAction(
                    room,
                    action,
                    context
                );
            }

            trigger.fired = true;

            return true;

        } finally {
            trigger.executing = false;
        }
    }

    /* =====================================================
       CHECK TRIGGERS AT A DUNGEON TILE

       Integration calls this on tile ENTRY or arrow HIT,
       rather than every update while an entity remains there.
    ===================================================== */

    function checkRoomTriggers(
        activation,
        x,
        y,
        context = {}
    ) {
        let count = 0;

        for (const room of rooms) {
            for (const trigger of room.triggers ?? []) {
                const accepts = Array.isArray(trigger.activation)
                    ? trigger.activation.includes(activation)
                    : trigger.activation === activation;

                if (!accepts)
                    continue;

                const position = transform(
                    room,
                    trigger.x,
                    trigger.y
                );

                if (
                    position.x === x &&
                    position.y === y &&
                    activateRoomTrigger(room, trigger, context)
                ) {
                    count++;
                }
            }
        }

        return count;
    }

    /* =====================================================
       PLAYER ENTERS A TILE

       Coordinates are dungeon tile coordinates.
       Caller supplies previous tile coordinates.
    ===================================================== */

    function onRoomPlayerStep(
        x,
        y,
        previousX,
        previousY,
        context = {}
    ) {
        if (x === previousX && y === previousY)
            return 0;

        return checkRoomTriggers(
            "step",
            x,
            y,
            context
        );
    }

    /* =====================================================
       ARROW HITS A TRIGGER TILE

       TODO GAME:
       Caller owns hit deduplication and whether an arrow
       is consumed when it hits a trigger.
    ===================================================== */

    function onRoomArrowHit(x, y, context = {}) {
        return checkRoomTriggers(
            "arrow",
            x,
            y,
            context
        );
    }

    /* =====================================================
       REMOVE / CLEAR REGISTERED ROOMS

       These unregister updates and trigger checks.
       They do not restore tiles or remove spawned entities.
       Clear before initializing a newly generated dungeon.
    ===================================================== */

    function removeRoomExtensions(room) {
        rooms.delete(room);
    }

    function clearRoomExtensions() {
        rooms.clear();
    }

    /* =====================================================
       PUBLIC FUNCTIONS
    ===================================================== */

    return {
        configureRoomExtensions,
        initializeRoomExtensions,
        updateRoomAnimations,
        applyRoomAnimation,
        startRoomAnimation,
        stopRoomAnimation,
        activateRoomTrigger,
        executeRoomTriggerAction,
        onRoomPlayerStep,
        onRoomArrowHit,
        removeRoomExtensions,
        clearRoomExtensions,
        findTrigger,
		fireTrigger
    };

})();

RoomExtensions.configureRoomExtensions({
    addKnowledge(action) {
        return CharacterModel.knowledge.add(
            action.scope ?? "global",
            action.id,
            action.key
        );
    }
});


/* Optional Node.js export for standalone testing. */

if (typeof module !== "undefined" && module.exports) {
    module.exports = RoomExtensions;
}