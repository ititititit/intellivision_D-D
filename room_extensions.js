/* =========================================================
   ROOM EXTENSIONS

   Coordinates are local, 0–8.
   All four rooms use authored population only.
========================================================= */

const ROOM_EXTENSIONS = {

    /* -----------------------------------------------------
       10 — WATERWORKS
    ----------------------------------------------------- */

    10: {
        name: "Waterworks",
        population: "defined",

        animation: roomAnimation(3, 300),

        animatedCells: [
            animatedRoomCell(5, 4, [27, 1],  0),
            animatedRoomCell(6, 4, [27, 1], -1),
            animatedRoomCell(7, 4, [27, 1], -2)
        ],

		triggers: [
			{
				...roomSwitch(4, 4, [
					{
						type: "startAnimation",
						direction: 1
					},
		
					{
						type: "depositObject",
						x: 3,
						y: 5,
						value: OBJECT.QUIVER
					},
		
					{
						type: "fireTrigger",
						id: "forgotten_bridge_extend"
					}
				]),
		
				id: "waterworks_start"
			}
		],

        objects: [
            { x: 2, y: 1, value: OBJECT.STATUE_PRIESTESS },
            { x: 6, y: 1, value: OBJECT.STATUE_PRIESTESS },
            { x: 1, y: 5, value: OBJECT.SKULL_1 },
            { x: 6, y: 7, value: OBJECT.SKULL_2 }
        ],

        monsters: [{
            x: 3,
            y: 4,
            value: OBJECT.SNAKE,
            name: "Simon",
            behavior: "friendlyStanding",
            characterID: "mira"
        }]
    },

    /* -----------------------------------------------------
       11 — FORGOTTEN BRIDGE
    ----------------------------------------------------- */

    11: {
        name: "Forgotten Bridge",
        population: "defined",

        animation: roomAnimation(5, 250),

        animatedCells: [
            animatedRoomCell(3, 4, [39, 1],  0),
            animatedRoomCell(4, 4, [39, 1], -1),
            animatedRoomCell(5, 4, [39, 1], -2),
            animatedRoomCell(6, 4, [39, 1], -3),
            animatedRoomCell(7, 4, [39, 1], -4)
        ],

        triggers: [
            {
                ...roomSwitch(2, 4, [
                    {
                        type: "startAnimation",
                        direction: 1
                    }
                ]),

                id: "forgotten_bridge_extend"
            }
        ],

        objects: [
            { x: 2, y: 1, value: OBJECT.STATUE_KNIGHT },
            { x: 6, y: 1, value: OBJECT.STATUE_KNIGHT },
            { x: 1, y: 6, value: OBJECT.SKULL_2 },
            { x: 6, y: 7, value: OBJECT.SKULL_HORNS }
        ],

        monsters: [{
            x: 1,
            y: 4,
            value: OBJECT.SNAKE,
            name: "Basil",
            behavior: "friendlyStanding",
            characterID: "mira"
        }]
    },

    /* -----------------------------------------------------
       12 — SERPENT VAULT
    ----------------------------------------------------- */

    12: {
        name: "Serpent Vault",
        population: "defined",

        animation: roomAnimation(4, 250),

        animatedCells: [
            animatedRoomCell(
                4, 3,
                [13, 12, 11, 10, 1],
                0, E
            ),

            animatedRoomCell(
                4, 5,
                [13, 12, 11, 10, 1],
                0, E
            )
        ],

        triggers: [
            {
                ...roomSwitch(5, 4, [
                    {
                        type: "depositMonster",
                        x: 2,
                        y: 3,
                        value: OBJECT.SNAKE
                    },
                    {
                        type: "depositMonster",
                        x: 2,
                        y: 5,
                        value: OBJECT.SNAKE
                    },
                    {
                        type: "startAnimation",
                        direction: 1
                    }
                ]),

                id: "serpent_vault_release"
            }
        ],

        objects: [
            { x: 3, y: 3, value: OBJECT.SKULL_1 },
            { x: 3, y: 5, value: OBJECT.SKULL_HORNS },
            { x: 7, y: 4, value: OBJECT.STATUE_BEAST }
        ],

        monsters: [{
            x: 6,
            y: 4,
            value: OBJECT.SNAKE,
            name: "Silas",
            behavior: "friendlyStanding",
            characterID: "mira"
        }]
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
    }
};