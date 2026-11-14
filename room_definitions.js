/* =========================================================
   8. ROOM CELL ENCODING
========================================================= */

function B(block, orientation = N) {
    return (
        (block & 63) |
        ((orientation & 3) << 6)
    );
}


/* =========================================================
   9. ROOM DEFINITIONS

   Each room is 9x9 blocks.

   0 = wall
   1 = floor
   B(2, direction) = diagonal corner block
========================================================= */

const ROOMS = [

    // ROOM 0
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,B(2,N),1,1,1,1,1,1,1,
        0,1,B(2,S),B(2,W),1,B(2,S),0,0,0,
        0,1,B(2,E),0,0,0,0,0,0,
        0,B(2,W),1,1,B(2,E),0,0,0,0,
        0,0,0,B(2,W),1,0,0,0,0
    ],

    // ROOM 1
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,1,1,1,1,1,1,1,1,
        0,1,B(2,S),B(2,W),1,B(2,S),0,0,0,
        0,1,B(2,E),0,0,0,0,0,0,
        0,B(2,W),1,1,B(2,E),0,0,0,0,
        0,0,0,B(2,W),1,0,0,0,0
    ],

    // ROOM 2
	[
		0,0,0,0,1,0,0,0,0,
		0,0,0,B(2,N),1,B(2,E),0,0,0,
		0,0,B(2,N),1,1,1,B(2,E),0,0,
		0,0,1,1,1,1,1,B(2,E),0,
		0,0,1,1,1,1,1,1,1,
		0,0,1,1,1,1,1,B(2,S),0,
		0,0,B(2,W),1,1,1,B(2,S),0,0,
		0,0,0,B(2,W),1,B(2,S),0,0,0,
		0,0,0,0,1,0,0,0,0
	],

    // ROOM 3
    [
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,B(2,N),1,1,1,1,1,B(2,E),0,
        0,1,B(2,S),B(2,W),1,B(2,S),B(2,W),1,0,
        0,1,B(2,E),B(2,N),1,B(2,E),0,1,0,
        0,B(2,W),1,1,1,1,0,1,1,
        0,0,0,B(2,W),1,B(2,S),0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 4
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,1,1,1,
        0,0,0,1,1,1,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,B(2,W),1,B(2,S),0,0,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 5
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,0,0,1,1,1,1,1,1,
        0,0,0,B(2,W),1,B(2,S),0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 6
    [
        0,0,0,B(2,N),1,B(2,E),0,0,0,
        0,0,0,1,1,1,1,B(2,E),0,
        0,0,0,B(2,W),1,B(2,S),B(2,W),1,0,
        0,0,0,B(2,N),1,B(2,E),0,1,0,
        0,B(2,N),1,1,1,1,0,1,1,
        0,1,B(2,S),B(2,W),1,B(2,S),0,0,0,
        0,1,B(2,E),0,0,0,0,0,0,
        0,B(2,W),1,1,B(2,E),0,0,0,0,
        0,0,0,B(2,W),1,0,0,0,0
    ],

    // ROOM 7
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,B(2,N),1,1,1,B(2,E),0,0,
        0,0,1,1,1,1,1,1,0,
        0,0,1,1,1,1,1,1,1,
        0,0,1,1,1,1,1,1,0,
        0,0,B(2,W),1,1,1,B(2,S),0,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 8 — JAMES'S ARMORY
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,1,1,1,0,0,0,
        0,1,1,1,1,1,1,1,0,
        0,1,1,1,1,1,1,1,0,
        0,1,1,1,1,1,1,1,1,
        0,1,1,1,1,1,1,1,0,
        0,1,1,1,1,1,1,1,0,
        0,0,0,1,1,1,0,0,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 9 — THE HIDDEN COMPASS
    // Water = 27.
    // Bridge extends west from (4,4).
    [
        0,0,0,0,1,0,0,0,0,
        0,27,27,27,1,1,1,1,0,
        0,1,27,27,1,1,1,1,0,
        0,1,1,27,27,1,1,1,0,
        0,1,1,27,27,1,1,1,1,
        0,1,1,27,27,1,1,1,0,
        0,1,27,27,1,1,1,1,0,
        0,27,27,27,1,1,1,1,0,
        0,0,0,0,1,0,0,0,0
    ],
	
    // ROOM 10 — ISLAND SHRINE
    // Water = 27. Bridge at (2,4). Statue at (4,4).
    [
        0,0,0,0,1,0,0,0,0,
        0,1,1,1,1,1,1,1,0,
        0,1,27,27,27,27,27,1,0,
        0,1,27,1,1,1,27,1,0,
        0,1,27,1,1,1,27,1,1,
        0,1,27,1,1,1,27,1,0,
        0,1,27,27,27,27,27,1,0,
        0,1,1,1,1,1,1,1,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 11 — THE BREATHING PATH
    // Winding walkway surrounded by pits.
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,39,39,39,1,39,39,39,0,
        0,1,1,1,1,39,1,1,1,
        0,1,39,39,39,39,1,39,0,
        0,1,1,1,1,1,1,39,0,
        0,39,39,39,1,39,39,39,0,
        0,0,0,0,1,0,0,0,0
    ],

    // ROOM 12 — THE RICOCHET VAULT
    // Shoot east from (4,2), then west from (4,4).
    // Water = 27. Closed doors at (4,3) and (4,5).
[
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    150,
    1,
    214,
    65,
    66,
    0,
    0,
    0,
    2,
    65,
    1,
    65,
    2,
    130,
    0,
    0,
    2,
    130,
    39,
    26,
    39,
    1,
    0,
    0,
    0,
    163,
    36,
    39,
    26,
    26,
    218,
    65,
    1,
    0,
    129,
    66,
    39,
    26,
    39,
    129,
    0,
    0,
    0,
    194,
    1,
    64,
    65,
    65,
    130,
    0,
    0,
    0,
    0,
    0,
    64,
    1,
    22,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0
  ],

    // ROOM 13 — CLOCKWORK CROSSING
    // Central pillar forces travel through upper or lower passage.
    // Shutters at (5,3) and (5,5) alternate after activation.
    [
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,1,1,1,1,0,0,
        0,0,0,1,1,1,1,0,0,
        0,0,0,1,1,0,1,1,1,
        0,0,0,1,1,0,1,0,0,
        0,0,0,1,1,1,1,0,0,
        0,0,0,0,1,0,0,0,0,
        0,0,0,0,1,0,0,0,0
    ],
    
	// ROOM 14 — JEFF'S HONEST DOOR
	[
0,
  0,
  0,
  0,
  1,
  0,
  69,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  5,
  1,
  133,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  197,
  0,
  0,
  0,
  150,
  214,
  0,
  1,
  1,
  1,
  214,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  86,
  22,
  0,
  1,
  1,
  1,
  1,
  131,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  22,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0
	],
    
    // ROOM 15 — CALVIN'S ISLAND
    // Water = 27.
    // Island at (2,4), connected by land at (3,4).
// Matching entries for room 15

[
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  27,
  27,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  27,
  27,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  1,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  27,
  27,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  27,
  27,
  27,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0
]

];

/* =========================================================
   SPECIAL ROOM DEFINITION HELPERS
========================================================= */

function roomAnimation(max, tickInterval = 200, mode = "once") {
    return {
        min: 0,
        max,
        counter: 0,
        direction: 1,
        running: false,
        mode,
        tickInterval
    };
}

function animatedRoomCell(
    x, y, pattern, offset = 0, rotation = N
) {
    return {
        x,
        y,
        rotation,
        pattern,
        offset,
        sampling: "clamp"
    };
}

function roomSwitch(x, y, actions) {
    return {
        x,
        y,
        activation: ["step", "arrow"],
        enabled: true,
        once: true,
        actions
    };
}

function roomObject(x, y, value, rotation = N) {
    return { x, y, value, rotation };
}

/* =========================================================
   ROOM EXTENSIONS

   Coordinates are local, 0–8.
   All four rooms use authored population only.
========================================================= */

const ROOM_EXTENSIONS = {
    8: {
        name: "James's Armory",
        population: "defined",

        triggers: [
            {
                id: "james_reveal_armor",
                activation: [],
                enabled: true,
                once: true,

                actions: [
                    {
                        type: "depositObject",
                        x: 2,
                        y: 4,
                        value: OBJECT.ARMOR
                    }
                ]
            }
        ],

        objects: [
            {
                x: 2,
                y: 2,
                value: OBJECT.STATUE_KNIGHT
            },
            {
                x: 2,
                y: 6,
                value: OBJECT.STATUE_KNIGHT
            },
            {
                x: 6,
                y: 2,
                value: OBJECT.STATUE_KNIGHT
            },
            {
                x: 6,
                y: 6,
                value: OBJECT.STATUE_KNIGHT
            }
        ],

        monsters: [
            {
                x: 3,
                y: 3,
                value: OBJECT.JAMES_DUBAY,
                name: "James Dubay",
                behavior: "friendlyStanding",
                characterID: "james"
            }
        ]
    },
    
    9: {
        name: "The Hidden Compass",
        population: "defined",

        animation: roomAnimation(2, 300),

        animatedCells: [
            animatedRoomCell(4, 4, [27, 1],  0),
            animatedRoomCell(3, 4, [27, 1], -1)
        ],

        triggers: [
            {
                id: "hidden_compass_reveal",
                x: 1,
                y: 3,
                activation: ["arrow"],
                enabled: true,
                once: true,

                actions: [
                    {
                        type: "startAnimation",
                        direction: 1
                    },
                    {
                        type: "depositObject",
                        x: 1,
                        y: 4,
                        value: OBJECT.COMPASS
                    }
                ]
            }
        ],

        objects: [
            {
                x: 1,
                y: 3,
                value: OBJECT.STATUE_PRIESTESS
            }
        ]
    },

    10: {
        name: "Island Shrine",

        animation: roomAnimation(9, 100),

        animatedCells: [
            animatedRoomCell(
                2, 4,
                [27, 14, 15, 16, 17, 18, 19, 20, 21, 1],
                0, N
            )
        ],

        triggers: [
            {
                id: "island_shrine_bridge",
                x: 4,
                y: 4,
                activation: ["arrow"],
                enabled: true,
                once: true,

                actions: [
                    {
                        type: "startAnimation",
                        direction: 1
                    },
                    {
                        type: "depositObject",
                        x: 4,
                        y: 3,
                        value: OBJECT.SNAKE_CHARMER
                    }
                ]
            }
        ],

        objects: [
            {
                x: 4,
                y: 4,
                value: OBJECT.STATUE_PRIESTESS
            },
            {
                x: 3,
                y: 3,
                value: OBJECT.PALM_TREE
            }
        ],
        
        monsters: [
			{
				x: 4,
				y: 5,
				value: OBJECT.GHOST,
				name: "Marvin",
				behavior: "friendlyStanding",
				characterID: "wisp"
			}
		]
    },

    11: {
        name: "The Breathing Path",
        population: "defined",

        animation: roomAnimation(24, 180, "pingPong"),

        animatedCells: [
            // Each section opens, pauses, then closes.
            // Negative offsets stagger the pattern along the path.

            animatedRoomCell(
                3, 4,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                0
            ),
            animatedRoomCell(
                2, 4,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -1
            ),
            animatedRoomCell(
                1, 5,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -2
            ),
            animatedRoomCell(
                2, 6,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -3
            ),
            animatedRoomCell(
                3, 6,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -4
            ),
            animatedRoomCell(
                5, 6,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -5
            ),
            animatedRoomCell(
                6, 5,
                [26,25,24,23,1,1,1,1,1,23,24,25,26,26,26],
                -6
            )
        ],

        triggers: [
            {
                id: "breathing_path_west",
                ...roomSwitch(4, 4, [
                    {
                        type: "startAnimation",
                        direction: 1
                    }
                ])
            },
            {
                id: "breathing_path_east",
                ...roomSwitch(7, 4, [
                    {
                        type: "startAnimation",
                        direction: 1
                    }
                ])
            }
        ],

        objects: [
            { x: 4, y: 3, value: OBJECT.SKULL_1 },
            { x: 7, y: 4, value: OBJECT.SKULL_HORNS }
        ]
    },
    
    12: {
        name: "The Ricochet Vault",
        population: "defined",

		animation: roomAnimation(25, 100),
		
		animatedCells: [
			animatedRoomCell(
				4, 3,
				[26, 52, 53, 54, 55, 56, 57, 58, 59, 1],
				0, E
			),
			animatedRoomCell(
				4, 4,
				[26, 52, 53, 54, 55, 56, 57, 58, 59, 1],
				-8, E
			),
			
			animatedRoomCell(
				4, 5,
				[26, 52, 53, 54, 55, 56, 57, 58, 59, 1],
				-16, E
			)
		],

        triggers: [
            {
                id: "ricochet_north_door",
                x: 6,
                y: 1,
                activation: ["arrow"],
                enabled: true,
                once: true,

                actions: [
					{
						type: "startAnimation",
						direction: 1
					}
                ]
            },

            {
                id: "ricochet_south_door",
                x: 2,
                y: 6,
                activation: ["arrow"],
                enabled: true,
                once: true,

                actions: [
                    {
                        type: "changeTile",
                        x: 4,
                        y: 3,
                        rotation: N,
                        blockID: 1
                    },
                    {
                        type: "changeTile",
                        x: 4,
                        y: 4,
                        rotation: N,
                        blockID: 1
                    },
                    {
                        type: "changeTile",
                        x: 5,
                        y: 4,
                        rotation: N,
                        blockID: 1
                    },
                    {
                        type: "changeTile",
                        x: 6,
                        y: 4,
                        rotation: N,
                        blockID: 1
                    }
                ]
            }
        ],

        objects: [
            {
                x: 6,
                y: 1,
                value: OBJECT.STATUE_PRIESTESS
            },
            {
                x: 2,
                y: 6,
                value: OBJECT.STATUE_BEAST
            }
        ]
    },

    /* -----------------------------------------------------
       13 — CLOCKWORK CROSSING
    ----------------------------------------------------- */

    13: {
        name: "Clockwork Crossing",
        population: "defined",

        animation: roomAnimation(10, 200, "pingPong"),

        animatedCells: [
            animatedRoomCell(
                5, 3,
                [1, 1, 1, 10, 11, 12, 13, 13, 13, 13, 13]
            ),

            animatedRoomCell(
                5, 5,
                [13, 13, 13, 12, 11, 10, 1, 1, 1, 1, 1]
            )
        ],

        triggers: [
            {
                ...roomSwitch(4, 4, [
                    {
                        type: "startAnimation",
                        direction: 1
                    }
                ]),

                id: "clockwork_crossing_start"
            }
        ],

        objects: [
            { x: 3, y: 2, value: OBJECT.STATUE_KNIGHT },
            { x: 3, y: 6, value: OBJECT.STATUE_KNIGHT },
            { x: 6, y: 2, value: OBJECT.SKULL_1 },
            { x: 6, y: 6, value: OBJECT.SKULL_2 }
        ],

        monsters: [{
            x: 3,
            y: 4,
            value: OBJECT.SNAKE,
            name: "Seth",
            behavior: "friendlyStanding",
            characterID: "mira"
        }]
    },
    
    14: {
		name: "Jeff's Honest Door",
		population: "defined",
	
		triggers: [
	
			// Jeff's correct riddle answer opens the chest passage.
			{
				id: "jeff_open_door",
				activation: [],
				enabled: true,
				once: true,
	
				actions: [
					{
						type: "changeTile",
						x: 3,
						y: 4,
						rotation: N,
						blockID: 1
					}
				]
			},
	
			// Approaching the chest releases snakes.
			{
				id: "jeff_release_snakes",
				x: 2,
				y: 4,
				activation: ["step"],
				enabled: true,
				once: true,
	
				actions: [
					{
						type: "depositMonster",
						x: 1,
						y: 4,
						value: OBJECT.SNAKE
					},
					{
						type: "depositMonster",
						x: 3,
						y: 4,
						value: OBJECT.SNAKE
					},
					{
						type: "addKnowledge",
						scope: "global",
						key: "jeff_trap_sprung"
					}
				]
			},
	
			// Jeff's follow-up dialogue reveals the sword
			// and opens its approach square.
			{
				id: "jeff_reveal_sword",
				activation: [],
				enabled: true,
				once: true,
	
				actions: [
					{
						type: "depositObject",
						x: 6,
						y: 1,
						value: OBJECT.SWORD
					},
					{
						type: "changeTile",
						x: 6,
						y: 2,
						rotation: N,
						blockID: 1
					}
				]
			},
	
			// Approaching the sword releases two bears.
			{
				id: "jeff_release_bears",
				x: 6,
				y: 2,
				activation: ["step"],
				enabled: true,
				once: true,
	
				actions: [
					{
						type: "depositMonster",
						x: 1,
						y: 4,
						value: OBJECT.BEAR
					},
					{
						type: "depositMonster",
						x: 3,
						y: 4,
						value: OBJECT.BEAR
					},
					{
						type: "addKnowledge",
						scope: "global",
						key: "jeff_bear_trap_sprung"
					}
				]
			}
		],
	
		objects: [
			{
				x: 1,
				y: 4,
				value: OBJECT.CHEST
			}
		],
	
		monsters: [
			{
				x: 5,
				y: 3,
				value: OBJECT.JEFF_CHOINSKI,
				name: "Jeff",
				behavior: "friendlyStanding",
				characterID: "jeff"
			}
		]
	},
    
    15: {
        name: "Calvin's Island",
        population: "defined",

        objects: [
            {
                x: 6,
                y: 2,
                value: OBJECT.STATUE_PRIESTESS
            },
            {
                x: 6,
                y: 6,
                value: OBJECT.STATUE_PRIESTESS
            }
            ,
            {
                x: 1,
                y: 2,
                value: OBJECT.PALM_TREE
            }
            ,
            {
                x: 1,
                y: 6,
                value: OBJECT.PALM_TREE
            }
        ],

        monsters: [
            {
                x: 2,
                y: 4,
                value: OBJECT.CALVIN,
                name: "Calvin",
                behavior: "friendlyStanding",
                characterID: "calvin"
            }
        ]
    }
};