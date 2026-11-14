    /* =====================================================
       PRESET CHARACTERS
    ===================================================== */

	const PRESETS = [
		{
			id: "mira",
			name: "Mira",
			role: "Priestess",
			voice: "gentle",
			abilities: ["heal"],
	
			groups: ["shrine"],
			knowledge: ["knows_shrine_history"],
	
			story:
				"I keep the shrine and shelter travelers. " +
				"Bor once came here wounded; I cared for him.",
	
			needs: {
				safety: .25,
				hunger: .15,
				belonging: .5,
				autonomy: .4,
				esteem: .2,
				curiosity: .65,
				care: .95,
				fairness: .8
			},
	
			goals: [
				{
					name: "Restore the fountain",
					motive: "compassion",
					weight: 1.1,
					unless: "fountainRestored"
				},
				{
					name: "Protect the hidden refuge",
					motive: "selfPreservation",
					weight: .8
				},
				{
					name: "Guide the traveler",
					motive: "discovery",
					weight: .65
				}
			],
	
			facts: [
				{
					topic: "fountain",
					text:
						"The northern channel is blocked. " +
						"Bor guards the gate leading there."
				},
				{
					topic: "gate",
					text:
						"Bor fears his master, but he remembers " +
						"kindness. Ask what he needs."
				},
				{
					topic: "priestess",
					text:
						"The shrine is a refuge, not a treasury."
				},
				{
					topic: "refuge",
					tags: ["secret", "tunnel"],
					text:
						"Behind the broken statue is a tunnel " +
						"to our refuge.",
					minTrust: .7
				},
				{
					topic: "fountain",
					subject: "the fountain",
					relation: "location",
					object: "in the shrine"
				},
				{
					topic: "fountain",
					subject: "the fountain",
					relation: "reason",
					object: "the northern channel is blocked"
				},
				{
					topic: "gate",
					subject: "the gate",
					relation: "location",
					object: "north of the shrine"
				},
				{
					topic: "gate",
					subject: "the gate",
					relation: "reason",
					object: "Bor fears punishment from his master"
				}
			],
	
			dialogue: [
				{
					id: "broken_jar",
					prompt: "Ask about the broken jar",
	
					requiresGlobal: [
						"shrine_jar_broken"
					],
	
					requiresPersonal: [
						"knows_shrine_history"
					],
	
					excludesPersonal: [
						"discussed_broken_jar"
					],
	
					response:
						"That vessel belonged to our first priestess.",
	
					addsPersonal: [
						"discussed_broken_jar"
					]
				},
	
				{
					id: "make_amends",
					prompt: "I will restore the fountain.",
	
					requiresPersonal: [
						"discussed_broken_jar"
					],
	
					excludesGlobal: [
						"fountain_quest_accepted"
					],
	
					response:
						"Then restore the water, " +
						"and we shall forgive it.",
	
					addsPersonal: [
						"player_promised_to_restore_fountain"
					],
	
					addsGlobal: [
						"fountain_quest_accepted"
					]
				},
	
				{
					id: "accept_key",
					prompt: "Accept the shrine key",
	
					requiresGlobal: [
						"fountain_quest_accepted"
					],
	
					excludesGlobal: [
						"player_accepted_shrine_key"
					],
	
					action: "give_shrine_key",
	
					response:
						"Take this key. Use it with care.",
	
					addsGlobal: [
						"player_accepted_shrine_key"
					]
				},
	
				{
					id: "activate_waterworks",
					prompt: "Please activate the waterworks.",
	
					action: "fire_room_trigger",
					triggerID: "waterworks_start",
	
					response:
						"Of course. The crossing should open now."
				}
			]
		},
	
		{
			id: "bor",
			name: "Bor",
			role: "Ogre gatekeeper",
			voice: "ogre",
			abilities: ["acceptFood", "openGate"],
	
			story:
				"Bor keeps gate. Master says nobody passes. " +
				"Master never brings supper.",
	
			needs: {
				safety: .85,
				hunger: .9,
				belonging: .35,
				autonomy: .55,
				esteem: .65,
				curiosity: .2,
				care: .3,
				fairness: .65
			},
	
			goals: [
				{
					name: "Keep the master satisfied",
					motive: "selfPreservation",
					weight: 1.1,
					unless: "gateOpen"
				},
				{
					name: "Find supper",
					motive: "nourishment",
					weight: 1,
					unless: "borFed"
				},
				{
					name: "Repay the priestess",
					motive: "duty",
					weight: .8,
					unless: "gateOpen"
				}
			],
	
			facts: [
				{
					topic: "gate",
					text:
						"Master says keep gate shut. " +
						"Master gets angry."
				},
				{
					topic: "food",
					text: "Bor hungry. Bread smells good."
				},
				{
					topic: "priestess",
					text: "Priestess helped Bor. Bor remembers."
				},
				{
					topic: "gate",
					subject: "the gate",
					relation: "location",
					object: "beside the northern channel"
				},
				{
					topic: "gate",
					subject: "the gate",
					relation: "reason",
					object: "my master ordered me to guard it"
				},
				{
					topic: "food",
					subject: "bread",
					relation: "location",
					object: "among the traveler supplies"
				}
			]
		},
	
        {
            id: "wisp",
            name: "Wisp",
            role: "Mournful traveler",
            voice: "wistful",
            abilities: [],

            story:
                "I was a traveler once, much like you. " +
                "Then came the snakes. Now I wander without " +
                "footsteps, wishing I had carried my charmer.",

            needs: {
                safety: .8,
                hunger: 0,
                belonging: .95,
                autonomy: .4,
                esteem: .3,
                curiosity: .5,
                care: .9,
                fairness: .7
            },

            goals: [
                {
                    name: "Spare another traveler my fate",
                    motive: "compassion",
                    weight: 1.4
                },
                {
                    name: "Find someone who understands",
                    motive: "connection",
                    weight: 1
                }
            ],

            facts: [
                {
                    topic: "snakes",
                    text:
                        "I heard them before I saw them. " +
                        "A hundred little whispers in the dark. " +
                        "I never reached the next room."
                },
                {
                    topic: "charmer",
                    text:
                        "A snake charmer keeps the creatures " +
                        "from attacking. They simply wander. " +
                        "Mine was of little use left behind."
                },
                {
                    topic: "jeff",
                    text:
                        "There is a trickster named Jeff in " +
                        "another dungeon. Listen carefully to " +
                        "his promises. The danger hides in " +
                        "what he leaves unsaid."
                }
            ],

            dialogue: [
                {
                    id: "wisp_ask_fate",
                    prompt: "What happened to you?",

                    response:
                        "Snakes, traveler. I thought I could " +
                        "slip past them. Now there is nothing " +
                        "left of me for their fangs to find. " +
                        "Oh, how I hate snakes.",

                    addsPersonal: ["wisp_fate_heard"]
                },
                {
                    id: "wisp_hate_snakes",
                    prompt: "I hate snakes too.",

                    requiresPersonal: ["wisp_fate_heard"],
                    excludesPersonal: ["wisp_charmer_offered"],

                    action: "fire_room_trigger",
                    triggerID: "island_shrine_bridge",

                    response:
                        "Then take my snake charmer. " +
                        "Keep it with you, and the snakes " +
                        "will wander without harming you. " +
                        "Perhaps your journey can end " +
                        "somewhere kinder than mine.",

                    addsPersonal: ["wisp_charmer_offered"]
                },
                {
                    id: "wisp_defend_snakes",
                    prompt: "Snakes are only being snakes.",

                    requiresPersonal: ["wisp_fate_heard"],

                    response:
                        "Perhaps. But it is easier to forgive " +
                        "their nature when you still have " +
                        "a heartbeat."
                },
                {
                    id: "wisp_warn_jeff",
                    prompt: "Are there other dangers I should know?",

                    response:
                        "In another dungeon you may meet Jeff. " +
                        "He offers treasure with a smile. " +
                        "Mind his exact words, traveler. " +
                        "A promise can be true and still " +
                        "lead you into a trap."
                },
                {
                    id: "wisp_charmer_reminder",
                    prompt: "How does the snake charmer work?",

                    requiresPersonal: ["wisp_charmer_offered"],

                    response:
                        "Simply carry it. The snakes will " +
                        "lose interest in you and wander. " +
                        "It holds no sway over other creatures. " +
                        "Do take care."
                }
            ]
        },
		
		{
            id: "calvin",
            name: "Calvin",
            role: "Island riddle keeper",
            voice: "gentle",
            abilities: [],

            groups: ["island"],
            knowledge: ["knows_hidden_compass"],

            story:
                "I keep watch from this island. " +
                "A compass lies hidden in another flooded room. " +
                "I share its secret with those who solve my riddle.",

            needs: {
                safety: .5,
                hunger: .2,
                belonging: .5,
                autonomy: .6,
                esteem: .6,
                curiosity: .9,
                care: .6,
                fairness: .9
            },

            goals: [
                {
                    name: "Test the traveler's wit",
                    motive: "discovery",
                    weight: 1
                },
                {
                    name: "Guide a worthy traveler",
                    motive: "compassion",
                    weight: .8
                }
            ],

            facts: [
                {
                    topic: "island",
                    text:
                        "This island is a quiet place to think."
                },
                {
                    topic: "compass",
                    text:
                        "Solve my riddle and I will tell you " +
                        "how to uncover the hidden compass."
                }
            ],

            dialogue: [
                {
                    id: "calvin_riddle",
                    prompt: "Ask Calvin for his riddle",

                    excludesPersonal: ["calvin_riddle_solved"],

                    response:
                        "I have a head and a tail, " +
                        "but no body. What am I?",

                    addsPersonal: ["calvin_riddle_heard"]
                },
                {
                    id: "calvin_answer_coin",
                    prompt: "A coin.",

                    requiresPersonal: ["calvin_riddle_heard"],
                    excludesPersonal: ["calvin_riddle_solved"],

                    response:
                        "Correct! In another flooded room, a statue " +
                        "stands beyond the water. Send an arrow west " +
                        "across its pool and let the wall return it " +
                        "toward the statue. Strike the statue and " +
                        "a bridge and compass will appear.",

                    addsPersonal: ["calvin_riddle_solved"],
                    addsGlobal: ["player_knows_compass_secret"]
                },
                {
                    id: "calvin_answer_snake",
                    prompt: "A snake.",

                    requiresPersonal: ["calvin_riddle_heard"],
                    excludesPersonal: ["calvin_riddle_solved"],

                    response:
                        "A snake has a body. Try again."
                },
                {
                    id: "calvin_answer_arrow",
                    prompt: "An arrow.",

                    requiresPersonal: ["calvin_riddle_heard"],
                    excludesPersonal: ["calvin_riddle_solved"],

                    response:
                        "A good thought, but an arrow has a shaft. " +
                        "Think of something you might spend."
                },
                {
                    id: "calvin_repeat_clue",
                    prompt: "Remind me how to find the compass.",

                    requiresPersonal: ["calvin_riddle_solved"],

                    response:
                        "Find the statue in the flooded room. " +
                        "Shoot west across the pool so the wall " +
                        "returns your arrow toward it. " +
                        "The statue reveals the crossing and compass."
                }
            ]
        },

        {
            id: "jeff",
            name: "Jeff",
            role: "Deceitful treasure guide",
            voice: "tricky",
            abilities: [],

            groups: ["treasure_trap"],
            knowledge: ["knows_jeff_trap"],

			story:
				"I watch over a treasure behind a closed door. " +
				"Travelers who enjoy a clever riddle are welcome " +
				"to try their luck. Answer correctly, and " +
				"I will open the way.",

            needs: {
                safety: .8,
                hunger: .2,
                belonging: .2,
                autonomy: .9,
                esteem: .9,
                curiosity: .7,
                care: .05,
                fairness: .05
            },

            goals: [
                {
                    name: "Lure the traveler into the trap",
                    motive: "independence",
                    weight: 1.2
                },
                {
                    name: "Keep myself out of danger",
                    motive: "selfPreservation",
                    weight: 1
                }
            ],

            facts: [
                {
                    topic: "treasure",
                    text:
                        "A splendid treasure waits behind that door. " +
                        "Answer my riddle and it could be yours."
                },
                {
                    topic: "gate",
                    text:
                        "You have my word: opening that door " +
                        "will release no snakes."
                }
            ],

            dialogue: [
                {
                    id: "jeff_riddle",
                    prompt: "Ask Jeff about the treasure",

                    excludesPersonal: ["jeff_riddle_solved"],

                    response:
                        "A fine treasure waits beyond this door. " +
                        "Answer my riddle and I will open it. " +
                        "Opening the door will release no snakes. " +
                        "Now: the more you take, the more you " +
                        "leave behind. What are they?",

                    addsPersonal: ["jeff_riddle_heard"]
                },
                {
                    id: "jeff_answer_footsteps",
                    prompt: "Footsteps.",

                    requiresPersonal: ["jeff_riddle_heard"],
                    excludesPersonal: ["jeff_riddle_solved"],

                    action: "fire_room_trigger",
                    triggerID: "jeff_open_door",

                    response:
                        "Footsteps! Excellent. Take a few more. " +
                        "Your reward is just ahead.",

                    addsPersonal: ["jeff_riddle_solved"]
                },
                {
                    id: "jeff_answer_gold",
                    prompt: "Gold.",

                    requiresPersonal: ["jeff_riddle_heard"],
                    excludesPersonal: ["jeff_riddle_solved"],

                    response:
                        "If taking gold left more behind, " +
                        "I would be a very wealthy man. Try again."
                },
                {
                    id: "jeff_answer_secrets",
                    prompt: "Secrets.",

                    requiresPersonal: ["jeff_riddle_heard"],
                    excludesPersonal: ["jeff_riddle_solved"],

                    response:
                        "Keep guessing. The answer is closer " +
                        "to your boots."
                },
                {
                    id: "jeff_trap_reaction",
                    prompt: "You tricked me! There were snakes!",

                    requiresGlobal: ["jeff_trap_sprung"],
                    excludesPersonal: ["jeff_confronted"],

                    response:
                        "I said opening the door wouldn't release " +
                        "them. I never said anything about " +
                        "walking through it.",

                    addsPersonal: ["jeff_confronted"]
                },
				{
					id: "jeff_offer_sword",
					prompt: "Speak to Jeff about the snakes",
				
					requiresGlobal: ["jeff_trap_sprung"],
					excludesPersonal: ["jeff_sword_revealed"],
				
					action: "fire_room_trigger",
					triggerID: "jeff_reveal_sword",
				
					response:
						"You have faced the snakes! " +
						"You are truly deserving of a memorable weapon. " +
						"There—claim your sword.",
				
					addsPersonal: ["jeff_sword_revealed"]
				}
            ]
        },
        
        {
            id: "james",
            name: "James Dubay",
            role: "Keeper of the hidden armor",
            voice: "gentle",
            abilities: [],

            groups: ["armory"],
            knowledge: ["knows_hidden_armor"],

            story:
                "I guard a hidden suit of armor. " +
                "I will reveal it to a traveler who intends " +
                "to protect others rather than threaten them.",

            needs: {
                safety: .7,
                hunger: .2,
                belonging: .6,
                autonomy: .6,
                esteem: .5,
                curiosity: .4,
                care: .9,
                fairness: .9
            },

            goals: [
                {
                    name: "Keep the armor from cruel hands",
                    motive: "duty",
                    weight: 1.2
                },
                {
                    name: "Help a worthy traveler",
                    motive: "compassion",
                    weight: 1
                }
            ],

            facts: [
                {
                    topic: "armor",
                    text:
                        "Armor can save your life. " +
                        "But I must know who you intend to protect."
                },
                {
                    topic: "duty",
                    text:
                        "Strength means little without the will " +
                        "to stand beside someone who needs you."
                }
            ],

            dialogue: [
				{
					id: "james_ask_armor",
					prompt: "Ask James about the armor",
					aliases: ["Tell me about armor"],
				
					excludesPersonal: ["james_armor_revealed"],
				
					response:
						"Steel can protect a traveler—or give " +
						"a bully courage. Why should I trust " +
						"you with it?",
				
					addsPersonal: ["james_asked_intentions"]
				},
                {
                    id: "james_answer_power",
                    prompt: "So nothing can stand in my way.",

                    requiresPersonal: ["james_asked_intentions"],
                    excludesPersonal: ["james_armor_revealed"],

                    response:
                        "Then you need restraint before " +
                        "you need armor."
                },
                {
                    id: "james_answer_reward",
                    prompt: "Because I deserve a reward.",

                    requiresPersonal: ["james_asked_intentions"],
                    excludesPersonal: ["james_armor_revealed"],

                    response:
                        "That tells me what you want, " +
                        "not what you will do."
                },
                {
                    id: "james_answer_protect",
                    prompt:
                        "To survive the dangers ahead—and " +
                        "help others get through them.",

                    requiresPersonal: ["james_asked_intentions"],
                    excludesPersonal: ["james_armor_revealed"],

                    action: "fire_room_trigger",
                    triggerID: "james_reveal_armor",

                    response:
                        "Then let it give you the courage " +
                        "to stand beside someone. " +
                        "The armor is yours.",

                    addsPersonal: ["james_armor_revealed"]
                },
                {
                    id: "james_after_reward",
                    prompt: "Thank James for his help",

                    requiresPersonal: ["james_armor_revealed"],

                    response:
                        "Wear it well. Remember why " +
                        "you asked for it."
                }
            ]
        }
	];

    /* =====================================================
       VOICE FRAGMENTS
    ===================================================== */

    const VOICES = {
        gentle: {
            greet: [
                "Peace to you.",
                "Welcome, traveler."
            ],
            thanks: [
                "You are welcome.",
                "May your journey be easier."
            ],
            refuse: [
                "I cannot do that yet.",
                "I must be cautious."
            ],
            help: [
                "Let me help you.",
                "You need not face this alone."
            ],
            unknown: [
                "I do not know.",
                "That is beyond my knowledge."
            ]
        },

        ogre: {
            greet: [
                "Bor listening.",
                "You talk. Bor listens."
            ],
            thanks: [
                "Good.",
                "Bor remembers."
            ],
            refuse: [
                "Bor says no.",
                "Not yet."
            ],
            help: [
                "Bor helps.",
                "You helped Bor. Bor helps you."
            ],
            unknown: [
                "Bor does not know.",
                "Bor never heard that."
            ]
        },

        wistful: {
            greet: [
                "Someone remembers I am here.",
                "A living voice… welcome."
            ],
            thanks: [
                "A kindness still reaches me.",
                "I shall remember."
            ],
            refuse: [
                "That path is closed to me.",
                "Not yet, traveler."
            ],
            help: [
                "Follow what remains of my memory.",
                "Perhaps I can still help."
            ],
            unknown: [
                "That memory has faded.",
                "I cannot recall."
            ]
        },
        
        tricky: {
            greet: [
                "Just the traveler I was hoping to meet.",
                "Come closer. I have a wonderful opportunity."
            ],
            thanks: [
                "Always a pleasure.",
                "You have made my day."
            ],
            refuse: [
                "Let us not rush things.",
                "First, a little test of wit."
            ],
            help: [
                "Trust me. Your reward is just ahead.",
                "I am opening doors for you."
            ],
            unknown: [
                "Some mysteries are best left alone.",
                "Now, why would you ask me that?"
            ]
        }
    };
    
        /* =====================================================
       NEEDS AND MOTIVES
    ===================================================== */

    const NEEDS = [
        "safety",
        "hunger",
        "belonging",
        "autonomy",
        "esteem",
        "curiosity",
        "care",
        "fairness"
    ];

    const LAYERS = {
        selfPreservation: {
            safety: 1.5,
            autonomy: .3
        },

        nourishment: {
            hunger: 2
        },

        connection: {
            belonging: 1.3,
            care: .3
        },

        independence: {
            autonomy: 1.2,
            esteem: .5
        },

        discovery: {
            curiosity: 1.5,
            safety: -.4
        },

        compassion: {
            care: 1.5,
            fairness: .5
        },

        duty: {
            fairness: .9,
            esteem: .7,
            safety: .3
        }
    };
    
    const TOPICS = {
    food: [
        "food", "bread", "meal", "hungry", "supper"
    ],

    gate: [
        "gate", "door", "pass", "through", "unlock"
    ],

    fountain: [
        "fountain", "water", "channel", "spring"
    ],

    priestess: ["priestess", "mira"],
    injury: ["injured", "wounded", "heal"],
    horse: ["horse", "mare"],
    island: ["island", "calvin"],
    compass: ["compass", "needle", "direction"],
    treasure: ["treasure", "chest", "reward", "jeff"],
    armor: ["armor", "armour", "steel", "protection", "james"],
    duty: ["duty", "protect", "responsibility"],
    snakes: ["snake", "snakes", "fang", "fangs", "bite"],
    charmer: ["charmer", "flute"],
    jeff: ["jeff", "trickster"]
};

globalThis.CharacterDefinitions = {
    PRESETS,
    VOICES,
    NEEDS,
    LAYERS,
    TOPICS
};