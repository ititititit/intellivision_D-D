
"use strict";

/* =========================================================
   DUNGEON INPUT

   Handles keyboard input and translates keys into
   player movement.

   Dependencies:
       dungeon_player.js

   Public functions:
       handleGameKey(event)
       initializeInput()
========================================================= */


/* =========================================================
   HANDLE GAME KEY

       Q   W   E
       A   S   D
       Z   X   C

   Q = Northwest     W = North      E = Northeast
   A = West          S = Use        D = East
   Z = Southwest     X = South      C = Southeast

   Arrow keys also support cardinal movement.
========================================================= */

function handleGameKey(event) {

   if (characterDialogueOpen)
        return;

    if (isGameOver()) {
        event.preventDefault();
        return;
    }

    let dx = 0;
    let dy = 0;

	// -------------------------------------
	// OVERWORLD INPUT
	// -------------------------------------
	if (event.key.toLowerCase() === "h") {
		showHelp();
		return;
	}
	
	if (gameMode === GAME_MODE.OVERWORLD) {
	
		let dx = 0;
		let dy = 0;
	
		switch (event.key.toLowerCase()) {
			// -------------------------------------
			// PLAYER MOVEMENT
			// -------------------------------------
	
			case "q":
				dx = -1;
				dy = -1;
				break;
	
			case "w":
				dy = -1;
				break;
	
			case "e":
				dx = 1;
				dy = -1;
				break;
	
			case "a":
				dx = -1;
				break;
	
			case "d":
				dx = 1;
				break;
	
			case "z":
				dx = -1;
				dy = 1;
				break;
	
			case "x":
				dy = 1;
				break;
	
			case "c":
				dx = 1;
				dy = 1;
				break;
	
			default:
				return;
		}
	
		event.preventDefault();
	
		if (event.repeat)
			return;
	
		moveOverworldPlayer(dx, dy);
	
		return;
	}

    switch (event.key.toLowerCase()) {


        // -------------------------------------
        // FIRE ARROWS
        // -------------------------------------

        case "arrowup":
        case "arrowright":
        case "arrowdown":
        case "arrowleft": {

            event.preventDefault();

            if (event.repeat)
                return;

            // Must have bow equipped
            if (player.mode !== PLAYER_MODE.BOW)
                return;

            // Must have arrows available
            if (player.inventory.arrow <= 0)
                return;

            const direction = {
                arrowup: 0,
                arrowright: 2,
                arrowdown: 4,
                arrowleft: 6
            }[event.key.toLowerCase()];

            // Create projectile
            const created = createProjectile(
                "FIRE_ARROW",
                player.x,
                player.y,
                direction
            );

            // Consume arrow only if created
			if (created) {
				player.inventory.arrow--;
				drawGame();
			}

            return;
        }

        // -------------------------------------
        // PLAYER MOVEMENT
        // -------------------------------------

        case "q":
            dx = -1;
            dy = -1;
            break;

        case "w":
            dy = -1;
            break;

        case "e":
            dx = 1;
            dy = -1;
            break;

        case "a":
            dx = -1;
            break;

        case "s":
            event.preventDefault();
            // Reserved for using current tile
            return;

        case "d":
            dx = 1;
            break;

        case "z":
            dx = -1;
            dy = 1;
            break;

        case "x":
            dy = 1;
            break;

        case "c":
            dx = 1;
            dy = 1;
            break;

        default:
            return;
    }

	event.preventDefault();
	
	if (dx === 0 && dy === 0)
    return;
	
	if (dx !== 0) {
		const facing = dx < 0 ? 1 : 0;
	
		if (facing !== player.facing) {
			player.facing = facing;
		}
	}
	
	requestPlayerMovement(dx, dy);
}

/* =========================================================
   INITIALIZE INPUT

   Registers the keyboard event handler.

   Called once from initializeGame().
========================================================= */

function initializeInput() {

    document.addEventListener(
        "keydown",
        handleGameKey
    );

    canvas.addEventListener(
        "click",
        handleGameClick
    );
}

/* =========================================================
   CHARACTER DIALOGUE STATE
========================================================= */

let characterDialogueOpen = false;


/* =========================================================
   CLICK A CHARACTER
========================================================= */

function handleGameClick(event) {

    if (
        gameMode !== GAME_MODE.DUNGEON ||
        isGameOver() ||
        characterDialogueOpen ||
        movementLocked
    ) {
        return;
    }

    const bounds = canvas.getBoundingClientRect();

    if (!bounds.width || !bounds.height)
        return;

    // Convert CSS coordinates to canvas pixels.
    const pixelX =
        (event.clientX - bounds.left) *
        canvas.width / bounds.width;

    const pixelY =
        (event.clientY - bounds.top) *
        canvas.height / bounds.height;

    // Exclude the inventory area beneath the map.
    if (
        pixelX < 0 ||
        pixelY < 0 ||
        pixelX >= VIEW_W * DISPLAY_BLOCK_PIXELS ||
        pixelY >= VIEW_H * DISPLAY_BLOCK_PIXELS
    ) {
        return;
    }

    const worldX =
        pixelX / DISPLAY_BLOCK_PIXELS +
        cameraX + cameraOffsetX;

    const worldY =
        pixelY / DISPLAY_BLOCK_PIXELS +
        cameraY + cameraOffsetY;

    // Search backwards so later-drawn objects get priority.
    for (let i = DUNGEON_OBJECTS.length - 1; i >= 0; i--) {

        const monster = DUNGEON_OBJECTS[i];

        if (
            !monster.character ||
            monster.state === "dead" ||
            !isDungeonTileVisible(monster[0], monster[1])
        ) {
            continue;
        }

        const x = monster[0] + (monster.offset_x ?? 0);
        const y = monster[1] + (monster.offset_y ?? 0);

        if (
            worldX < x ||
            worldX >= x + 1 ||
            worldY < y ||
            worldY >= y + 1
        ) {
            continue;
        }

		CharacterModel.showCharacterDialogue(
			monster.character,
			{
				actions: {
					fire_room_trigger({ character, option }) {
						const fired = RoomExtensions.fireTrigger(
							option.triggerID,
							{
								source: "dialogue",
								character,
								monster
							}
						);
		
						if (!fired) {
							return {
								ok: false,
								message:
									"That mechanism is unavailable or " +
									"has already been activated."
							};
						}
		
						return true;
					}
				},
		
				onOpen() {
					characterDialogueOpen = true;
				},
		
				onClose() {
					characterDialogueOpen = false;
					drawGame();
				}
			}
		);

        return;
    }
}