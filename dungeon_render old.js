"use strict";

/* =========================================================
   DUNGEON RENDERING

   Draws:
       Dungeon terrain
       Dungeon objects and projectiles
       Player
       Overworld and Cloudy Mountain
       Death and victory overlays

   Coordinates are in world blocks unless specified.
========================================================= */


/* =========================================================
   1. CANVAS AND DISPLAY CONSTANTS
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const RENDER_STEPS = 8;
const INVENTORY_HEIGHT = 20;

const MAP_PIXEL_WIDTH = VIEW_W * BLOCK_PIXELS;
const MAP_PIXEL_HEIGHT = VIEW_H * BLOCK_PIXELS;

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
    return Math.round(value * BLOCK_PIXELS);
}


/* =========================================================
   3. CACHED TERRAIN BLOCKS
========================================================= */

const BLOCK_CACHE = new Map();

function drawBlock(value, bx, by) {

    let image = BLOCK_CACHE.get(value);

    if (!image) {

        const { block, orientation } = decodeBlock(value);

        const offscreen = document.createElement("canvas");

        offscreen.width = BLOCK_PIXELS;
        offscreen.height = BLOCK_PIXELS;

        const offctx = offscreen.getContext("2d");

        for (let y = 0; y < BLOCK_PIXELS; y++) {
            for (let x = 0; x < BLOCK_PIXELS; x++) {

                const color = getBlockPixel(
                    block,
                    orientation,
                    x,
                    y
                );

                offctx.fillStyle = COLORS[color];
                offctx.fillRect(x, y, 1, 1);
            }
        }

        image = offscreen;
        BLOCK_CACHE.set(value, image);
    }

    ctx.drawImage(
        image,
        renderPixel(bx),
        renderPixel(by)
    );
}


/* =========================================================
   4. SPRITE RENDERING

   Supports:
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

        offscreen.width = BLOCK_PIXELS;
        offscreen.height = BLOCK_PIXELS;

        const offctx = offscreen.getContext("2d");

        const last = BLOCK_PIXELS - 1;

        for (let y = 0; y < BLOCK_PIXELS; y++) {
            for (let x = 0; x < BLOCK_PIXELS; x++) {

                const color = sprite[y * BLOCK_PIXELS + x];

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

                offctx.fillStyle =
                    palette?.[color] ?? SPRITE_COLORS[color];

                offctx.fillRect(dx, dy, 1, 1);
            }
        }

        image = offscreen;

        SPRITE_CACHE.set(key, image);
    }

    // -------------------------------------
    // DRAW CACHED SPRITE
    // -------------------------------------

    ctx.drawImage(
        image,
        renderPixel(bx),
        renderPixel(by)
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

                ctx.fillStyle = COLORS[0];

                ctx.fillRect(
                    renderPixel(bx),
                    renderPixel(by),
                    BLOCK_PIXELS,
                    BLOCK_PIXELS
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
========================================================= */

function cell(x, y) {
    return OVERWORLD_MAP[y][x];
}


function drawOverworld() {

    if (OVERWORLD_MAP.length === 0) {
        return;
    }

    for (let y = 0; y < VIEW_H; y++) {
        for (let x = 0; x < VIEW_W; x++) {

            const c = cell(x, y);

            // Background
            drawSprite(SPRITE.GRASS, x, y);

            if (c.type === TYPE.GRASS)
                continue;

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

    // Animated cabin
    const cabinY = Math.floor(VIEW_H / 2);

    drawSprite(SPRITE.GRASS, 0, cabinY);

    drawSprite(
        animationFrame === 0
            ? SPRITE.CABIN_1
            : SPRITE.CABIN_2,
        0,
        cabinY
    );

    // Overworld player
    drawSprite(
        SPRITE.PLAYER_1,
        overworldPlayer.x,
        overworldPlayer.y
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

    const x = VIEW_W - 2;
    const y = Math.floor(VIEW_H / 2) - 1;

    const frame =
        Math.floor(performance.now() / 350) %
        CLOUDY_PEAK_FRAMES.length;

    // Background
    for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {

            drawSprite(
                SPRITE.GRASS,
                x + dx,
                y + dy
            );
        }
    }

    // Upper-left
    drawSprite(
        SPRITE.CLOUDY_UPPER_LEFT,
        x,
        y
    );

    // Animated upper-right
    drawSprite(
        CLOUDY_PEAK_FRAMES[frame],
        x + 1,
        y
    );

    // Lower-left
    drawSprite(
        SPRITE.CLOUDY_LOWER_LEFT,
        x,
        y + 1
    );

    // Lower-right
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

    // Darken game screen
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

    // Throne and seated player
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

    // Victory message
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