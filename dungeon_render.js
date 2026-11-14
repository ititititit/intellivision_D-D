"use strict";

/* =========================================================
   DUNGEON RENDERING

   Terrain artwork uses the shared SPRITES array and palette.
   Each game square displays at 16x16.
   Room block IDs and collision rules are unchanged.

   Supports both 8x8 and 16x16 sprite arrays.
   Coordinates are in world blocks unless specified.
========================================================= */


/* =========================================================
   1. CANVAS AND DISPLAY CONSTANTS
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const RENDER_STEPS = 8;
const INVENTORY_HEIGHT = 28;

const DISPLAY_BLOCK_PIXELS = 16;

const MAP_PIXEL_WIDTH = VIEW_W * DISPLAY_BLOCK_PIXELS;
const MAP_PIXEL_HEIGHT = VIEW_H * DISPLAY_BLOCK_PIXELS;

let renderOffsetX = 0;
let renderOffsetY = 0;

let cameraOffsetX = 0;
let cameraOffsetY = 0;

canvas.width = MAP_PIXEL_WIDTH;
canvas.height = MAP_PIXEL_HEIGHT + INVENTORY_HEIGHT;

ctx.imageSmoothingEnabled = false;


/* =========================================================
   2. RENDERING UTILITIES
========================================================= */

function renderPixel(value) {
    return Math.round(value * DISPLAY_BLOCK_PIXELS);
}


/* =========================================================
   3. TERRAIN BLOCK RENDERING

   Uses the shared sprite renderer and SPRITE_CACHE.
   Artwork is drawn directly without added shading.
========================================================= */

function drawBlock(value, bx, by) {

    const { block, orientation } = decodeBlock(value);

    drawRotatedSprite(
        BLOCK_SPRITES[block],
        bx,
        by,
        orientation
    );
}

/* =========================================================
   4. SPRITE RENDERING

   Supports:
       8x8 and 16x16 sprites
       Custom palettes
       Horizontal and vertical reflection
       90-degree rotation

   Rotation:
       0 = north
       1 = east
       2 = south
       3 = west
========================================================= */

const SPRITE_CACHE = new Map();


function drawRotatedSprite(
    spriteID,
    bx,
    by,
    rotation = 0,
    palette = null,
    reflectX = false,
    reflectY = false
) {

    const sprite = SPRITES[spriteID];

    if (!sprite)
        return;

    const spritePixels = Math.sqrt(sprite.length);

    if (!Number.isInteger(spritePixels))
        return;

    rotation = ((rotation % 4) + 4) % 4;

    // -------------------------------------
    // CACHE KEY
    // -------------------------------------

    const key = JSON.stringify([
        spriteID,
        rotation,
        reflectX,
        reflectY,
        palette
    ]);

    let image = SPRITE_CACHE.get(key);

    // -------------------------------------
    // CREATE CACHED SPRITE
    // -------------------------------------

    if (!image) {

        const offscreen = document.createElement("canvas");

        offscreen.width = spritePixels;
        offscreen.height = spritePixels;

        const offctx = offscreen.getContext("2d");

        const last = spritePixels - 1;

        for (let y = 0; y < spritePixels; y++) {
            for (let x = 0; x < spritePixels; x++) {

                const color = sprite[y * spritePixels + x];

                if (color === 0)
                    continue;

                const sx = reflectX ? last - x : x;
                const sy = reflectY ? last - y : y;

                let dx = sx;
                let dy = sy;

                switch (rotation) {

                    case 1:
                        dx = last - sy;
                        dy = sx;
                        break;

                    case 2:
                        dx = last - sx;
                        dy = last - sy;
                        break;

                    case 3:
                        dx = sy;
                        dy = last - sx;
                        break;
                }

				const fill =
					palette?.[color] ?? SPRITE_COLORS[color];
				
				if (fill == null)
					continue;
				
				offctx.fillStyle = fill;
				offctx.fillRect(dx, dy, 1, 1);
            }
        }

        image = offscreen;

        SPRITE_CACHE.set(key, image);
    }

    // -------------------------------------
    // DRAW ONE GAME SQUARE
    // -------------------------------------

    ctx.drawImage(
        image,
        renderPixel(bx),
        renderPixel(by),
        DISPLAY_BLOCK_PIXELS,
        DISPLAY_BLOCK_PIXELS
    );
}


/* =========================================================
   DRAW SPRITE

   Simplified wrapper for unrotated sprites.
========================================================= */

function drawSprite(
    spriteID,
    bx,
    by,
    palette = null,
    reflectX = false
) {

    drawRotatedSprite(
        spriteID,
        bx,
        by,
        0,
        palette,
        reflectX
    );
}


/* =========================================================
   5. DUNGEON TERRAIN
========================================================= */

function drawDungeon() {

    const viewX = cameraX + cameraOffsetX;
    const viewY = cameraY + cameraOffsetY;

    const startX = Math.max(0, Math.floor(viewX));
    const startY = Math.max(0, Math.floor(viewY));

    const endX = Math.min(
        WORLD_W,
        Math.ceil(viewX + VIEW_W)
    );

    const endY = Math.min(
        WORLD_H,
        Math.ceil(viewY + VIEW_H)
    );

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {

            const bx = x - viewX;
            const by = y - viewY;

            if (!isDungeonTileVisible(x, y)) {

                ctx.fillStyle = SPRITE_COLORS[16];

                ctx.fillRect(
                    renderPixel(bx),
                    renderPixel(by),
                    DISPLAY_BLOCK_PIXELS,
                    DISPLAY_BLOCK_PIXELS
                );

                continue;
            }

            drawBlock(
                getWorldBlock(x, y),
                bx,
                by
            );
        }
    }
}


/* =========================================================
   6. DUNGEON OBJECTS AND PROJECTILES
========================================================= */

function drawDungeonObjects() {

    const viewX = cameraX + cameraOffsetX;
    const viewY = cameraY + cameraOffsetY;

    for (const obj of DUNGEON_OBJECTS) {

        if (!obj)
            continue;

        // -------------------------------------
        // OBJECT TYPE AND POSITION
        // -------------------------------------

        const isProjectile = obj.projectileType !== undefined;

        const x = obj[0];
        const y = obj[1];
        const type = obj[2];

        if (!Number.isFinite(x) || !Number.isFinite(y))
            continue;

        // -------------------------------------
        // VISIBILITY
        // -------------------------------------

        if (!isProjectile) {

            const isMonster = isMonsterObject(obj);

            const visibleInDark =
                isMonster &&
                MONSTER_BEHAVIOR[type]?.visibleInDark === true;

            if (
                !isDungeonTileVisible(x, y) &&
                !visibleInDark
            ) {
                continue;
            }
        }

        // -------------------------------------
        // MOVEMENT INTERPOLATION
        // -------------------------------------

        const offsetX =
            typeof obj.offset_x === "number"
                ? obj.offset_x
                : 0;

        const offsetY =
            typeof obj.offset_y === "number"
                ? obj.offset_y
                : 0;

        const screenX = x + offsetX - viewX;
        const screenY = y + offsetY - viewY;

        // -------------------------------------
        // VIEWPORT CLIPPING
        // -------------------------------------

        if (
            screenX <= -1 ||
            screenY <= -1 ||
            screenX >= VIEW_W ||
            screenY >= VIEW_H
        ) {
            continue;
        }

        // -------------------------------------
        // PROJECTILES
        // -------------------------------------

        if (isProjectile) {

            if (obj.projectileType === "FIRE_ARROW") {

                drawRotatedSprite(
                    SPRITE.FIRE_ARROW_SPRITE,
                    screenX,
                    screenY,
                    obj.direction / 2
                );
            }

            continue;
        }

        // -------------------------------------
        // ORDINARY OBJECTS AND MONSTERS
        // -------------------------------------

        const def = OBJECT_DEFS[type];

        if (!def)
            continue;

        const spriteID =
            def[1] !== -1 && animationFrame
                ? def[1]
                : def[0];

        drawSprite(
            spriteID,
            screenX,
            screenY,
            null,
            obj.direction === 1
        );
    }
}


/* =========================================================
   7. PLAYER
========================================================= */

function drawPlayer() {

    const screenX =
        player.x + renderOffsetX -
        cameraX - cameraOffsetX;

    const screenY =
        player.y + renderOffsetY -
        cameraY - cameraOffsetY;

    if (
        screenX <= -1 ||
        screenY <= -1 ||
        screenX >= VIEW_W ||
        screenY >= VIEW_H
    ) {
        return;
    }

    const frames = PLAYER_ANIMATIONS[player.mode];

    drawSprite(
        frames[animationFrame & 1],
        screenX,
        screenY,
        null,
        player.facing === 1
    );
}

/* =========================================================
   8. OVERWORLD

   Forest neighbor bits:
       North = 1
       East  = 2
       South = 4
       West  = 8

   Each entry contains:
       [sprite ID, clockwise rotation]
========================================================= */

const FOREST_TILE_LOOKUP = [
    [SPRITE.FOREST_ISOLATED,  0], //  0: none
    [SPRITE.FOREST_END,       0], //  1: N
    [SPRITE.FOREST_END,       1], //  2: E
    [SPRITE.FOREST_CORNER,    0], //  3: N E
    [SPRITE.FOREST_END,       2], //  4: S
    [SPRITE.FOREST_STRAIGHT,  0], //  5: N S
    [SPRITE.FOREST_CORNER,    1], //  6: E S
    [SPRITE.FOREST_THREE_WAY, 1], //  7: N E S
    [SPRITE.FOREST_END,       3], //  8: W
    [SPRITE.FOREST_CORNER,    3], //  9: N W
    [SPRITE.FOREST_STRAIGHT,  1], // 10: E W
    [SPRITE.FOREST_THREE_WAY, 0], // 11: N E W
    [SPRITE.FOREST_CORNER,    2], // 12: S W
    [SPRITE.FOREST_THREE_WAY, 3], // 13: N S W
    [SPRITE.FOREST_THREE_WAY, 2], // 14: E S W
    [SPRITE.FOREST_INTERIOR,  0]  // 15: N E S W
];


function cell(x, y) {
    return OVERWORLD_MAP[y][x];
}


function isOverworldForest(x, y) {
    return OVERWORLD_MAP[y]?.[x]?.type === TYPE.FOREST;
}


function drawOverworldForest(x, y) {

    const mask =
        (isOverworldForest(x, y - 1) ? 1 : 0) |
        (isOverworldForest(x + 1, y) ? 2 : 0) |
        (isOverworldForest(x, y + 1) ? 4 : 0) |
        (isOverworldForest(x - 1, y) ? 8 : 0);

    const [spriteID, rotation] = FOREST_TILE_LOOKUP[mask];

    drawRotatedSprite(
        spriteID,
        x,
        y,
        rotation
    );
}


function drawOverworld() {

    if (OVERWORLD_MAP.length === 0)
        return;

    for (let y = 0; y < VIEW_H; y++) {
        for (let x = 0; x < VIEW_W; x++) {

            const c = cell(x, y);

            drawSprite(SPRITE.GRASS, x, y);

			// Special dungeon entrance over the grass background.
			if (c.dungeon) {
				const palette = c.sprite === SPRITE.CAVE
					? { 4: PALETTES.BROWN }
					: null;
			
				drawSprite(c.sprite, x, y, palette);
				continue;
			}
			
			if (c.type === TYPE.GRASS)
				continue;

            if (c.type === TYPE.FOREST) {
                drawOverworldForest(x, y);
                continue;
            }

            const color =
                MOUNTAIN_COLORS[c.type] ??
                PALETTES[c.palette];

            const palette = color
                ? { 4: color }
                : null;

            drawRotatedSprite(
                c.sprite,
                x,
                y,
                c.rotation || 0,
                palette,
                c.flipH || false,
                c.flipV || false
            );
        }
    }

    drawCloudyMountain();

    // Animated cabin.
    const cabinY = Math.floor(VIEW_H / 2);

    drawSprite(SPRITE.GRASS, 0, cabinY);

    drawSprite(
        (animationFrame & 1)
            ? SPRITE.CABIN_2
            : SPRITE.CABIN_1,
        0,
        cabinY
    );

    // Animated player with remembered facing direction.
    drawSprite(
        (animationFrame & 1)
            ? SPRITE.PLAYER_2
            : SPRITE.PLAYER_1,
        overworldPlayer.x,
        overworldPlayer.y,
        null,
        overworldPlayer.facing === 1
    );
}

/* =========================================================
   9. CLOUDY MOUNTAIN

   2x2 sprite composition with animated upper-right peak.
========================================================= */

const CLOUDY_PEAK_FRAMES = [
    SPRITE.CLOUDY_PEAK_1,
    SPRITE.CLOUDY_PEAK_2,
    SPRITE.CLOUDY_PEAK_3
];


function drawCloudyMountain() {

	const x = TEST_DUNGEON_PLACEMENT ? 0 : VIEW_W - 2;
	const y = Math.floor(VIEW_H / 2) +
		(TEST_DUNGEON_PLACEMENT ? 1 : -1);

    const frame =
        Math.floor(performance.now() / 350) %
        CLOUDY_PEAK_FRAMES.length;

    // Background.
    for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {

            drawSprite(
                SPRITE.GRASS,
                x + dx,
                y + dy
            );
        }
    }

    drawSprite(
        SPRITE.CLOUDY_UPPER_LEFT,
        x,
        y
    );

    drawSprite(
        CLOUDY_PEAK_FRAMES[frame],
        x + 1,
        y
    );

    drawSprite(
        SPRITE.CLOUDY_LOWER_LEFT,
        x,
        y + 1
    );

    drawSprite(
        SPRITE.CLOUDY_LOWER_RIGHT,
        x + 1,
        y + 1
    );
}


/* =========================================================
   10. DEATH OVERLAY
========================================================= */

function drawPlayerDeath() {

    if (!player.dead)
        return;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        MAP_PIXEL_HEIGHT
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#ff6060";

    ctx.fillText(
        "YOU HAVE DIED",
        canvas.width / 2,
        MAP_PIXEL_HEIGHT / 2
    );

    ctx.restore();
}


/* =========================================================
   11. VICTORY OVERLAY
========================================================= */

const VICTORY_SPRITE = [
    "000010010000",
    "000011110000",
    "000133310000",
    "001333331000",
    "001344431000",
    "001444441000",
    "011422441100",
    "012444442100",
    "012444442100",
    "011222221100",
    "001111111000",
    "001155551000",
    "001100011000",
    "011100011100"
];

const VICTORY_COLORS = {
    1: "#ffd040",
    2: "#a02030",
    3: "#f0b080",
    4: "#6080e0",
    5: "#503020"
};


function drawPlayerVictory() {

    if (!player.won)
        return;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        MAP_PIXEL_HEIGHT
    );

    const cx = canvas.width / 2;
    const cy = MAP_PIXEL_HEIGHT / 2;

    const pixel = 5;

    const spriteWidth =
        VICTORY_SPRITE[0].length * pixel;

    const spriteHeight =
        VICTORY_SPRITE.length * pixel;

    const sx = Math.round(
        cx - spriteWidth / 2
    );

    const sy = Math.round(
        cy - spriteHeight / 2 - 12
    );

    // Throne and seated player.
    for (let y = 0; y < VICTORY_SPRITE.length; y++) {
        for (let x = 0; x < VICTORY_SPRITE[y].length; x++) {

            const color = Number(
                VICTORY_SPRITE[y][x]
            );

            if (color === 0)
                continue;

            ctx.fillStyle = VICTORY_COLORS[color];

            ctx.fillRect(
                sx + x * pixel,
                sy + y * pixel,
                pixel,
                pixel
            );
        }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#ffd040";

    ctx.fillText(
        "YOU ARE KING!",
        cx,
        sy + spriteHeight + 18
    );

    ctx.restore();
}


/* =========================================================
   12. DRAW COMPLETE SCENE
========================================================= */

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (gameMode === GAME_MODE.OVERWORLD) {

        drawOverworld();

    } else {

        drawDungeon();
        drawDungeonObjects();
        drawPlayer();
    }

    drawInventory();
    drawPlayerDeath();
    drawPlayerVictory();
}