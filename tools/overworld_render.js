
"use strict";

/* =========================================================
   OVERWORLD RENDERER — TEST DISPLAY ONLY

   Dependencies:
       A canvas passed to drawOverworld()
       A 2D map returned by generateOverworld()

   No terrain generation here.
========================================================= */

const OVERWORLD_COLORS = {
    4:"#b8b8b8",
    7:"#245b2a",
    11:"#83b86a",
    12:"#a0c784",
    15:"#a0d8e8"
};

const OVERWORLD_PALETTES = {
    BROWN:"#8a7020"
};

const OVERWORLD_SPRITES = {
    20:[
        0,4,0,0,0,0,0,0,
        4,4,4,0,4,0,0,0,
        0,0,0,4,4,4,0,0,
        0,0,4,4,4,4,4,0,
        0,4,0,4,4,4,4,4,
        4,4,4,0,0,0,0,0,
        0,4,4,4,0,0,4,0,
        0,0,0,0,0,4,4,4
    ],
    21:[
        0,0,0,0,0,0,4,0,
        0,0,0,4,0,4,4,4,
        0,0,4,4,4,4,0,0,
        0,4,4,4,4,4,0,0,
        4,4,4,4,4,0,4,0,
        0,0,0,0,0,4,4,4,
        0,4,0,0,4,4,4,0,
        4,4,4,0,0,0,0,0
    ],
    22:[
        0,15,0,0,0,0,0,0,
        0,0,15,0,0,0,0,0,
        0,0,0,15,0,0,0,0,
        0,0,0,0,15,0,0,0,
        0,0,15,0,15,0,0,0,
        0,15,0,15,0,0,0,0,
        15,0,0,0,0,0,0,0,
        0,15,0,0,0,0,0,0
    ],
    23:[
        0,0,15,0,0,0,0,0,
        0,0,15,0,0,0,0,0,
        0,15,0,0,0,15,15,0,
        15,0,0,0,15,0,0,15,
        15,0,15,15,0,0,0,0,
        0,15,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0
    ],
    48:[
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,15,0,0,0,0,0,0,
        15,0,15,0,0,0,0,0,
        0,0,15,0,0,0,0,0,
        0,0,15,0,0,0,0,0,
        0,15,0,0,0,0,0,0,
        0,15,0,0,0,0,0,0
    ],
    25:[
        0,0,7,0,0,7,0,0,
        0,7,7,7,7,7,7,0,
        7,7,7,7,7,7,7,7,
        0,7,7,7,7,7,7,0,
        0,0,7,0,0,7,0,0,
        0,7,7,7,7,7,7,0,
        7,7,7,7,7,7,7,7,
        0,7,7,0,7,7,7,0
    ],
    44:[
        11,11,11,11,11,11,11,11,
        11,11,11,11,12,11,11,11,
        11,11,12,11,11,11,11,11,
        11,11,11,11,11,11,12,11,
        11,11,11,11,11,11,12,11,
        11,12,11,11,11,11,11,11,
        11,11,11,11,11,11,11,11,
        11,11,11,12,11,11,11,11
    ]
};

/* =========================================================
   TRANSFORM SPRITE PIXEL

   Supports:
       90-degree rotations
       Horizontal flipping
       Vertical flipping
========================================================= */

function overworldTransformPixel(
    x, y, rotation,
    flipH=false,
    flipV=false
) {
    if (flipH) x = 7 - x;
    if (flipV) y = 7 - y;

    switch (rotation & 3) {
        case 1: return [7-y, x];
        case 2: return [7-x, 7-y];
        case 3: return [y, 7-x];
        default: return [x, y];
    }
}

/* =========================================================
   DRAW SPRITE

   Draws one 8x8 pixel sprite at the specified
   canvas position and size.

   Parameters:
       ctx       Canvas rendering context
       id        Sprite ID
       px, py    Canvas pixel position
       size      Displayed tile size
       palette   Optional palette override
       rotation  0, 1, 2, or 3
       flipH     Horizontal flip
       flipV     Vertical flip
========================================================= */

function overworldDrawSprite(
    ctx, id, px, py, size,
    palette=null,
    rotation=0,
    flipH=false,
    flipV=false
) {
    const pixels = OVERWORLD_SPRITES[id];

    if (!pixels) return;

    const scale = size / 8;

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {

            const value = pixels[y*8+x];

            if (!value) continue;

            const [rx,ry] = overworldTransformPixel(
                x, y, rotation, flipH, flipV
            );

            ctx.fillStyle = palette && value === 4
                ? OVERWORLD_PALETTES[palette]
                : OVERWORLD_COLORS[value];

            ctx.fillRect(
                px + rx*scale,
                py + ry*scale,
                scale, scale
            );
        }
    }
}

/* =========================================================
   DRAW OVERWORLD

   Renders a complete generated overworld map.

   Parameters:
       canvas    Target HTML canvas
       map       Generated 2D terrain array
       options:
           tileSize = 40
           showGrid = false

   Does not modify the map.
========================================================= */

function drawOverworld(canvas, map, options = {}) {

    if (!map || !map.length) return;

    const tileSize = options.tileSize || 40;
    const showGrid = !!options.showGrid;

    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    canvas.width = map[0].length * tileSize;
    canvas.height = map.length * tileSize;

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {

            const px = x * tileSize;
            const py = y * tileSize;

            const c = map[y][x];

            // Draw grass background.
            overworldDrawSprite(
                ctx, 44, px, py, tileSize
            );

            // Draw terrain on top of grass.
            if (c && c.type !== 0) {

                overworldDrawSprite(
                    ctx,
                    c.sprite,
                    px,
                    py,
                    tileSize,
                    c.palette,
                    c.rotation || 0,
                    !!c.flipH,
                    !!c.flipV
                );
            }
        }
    }

    // Optional debugging grid.
    if (showGrid) {

        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;

        for (let x = 0; x <= map[0].length; x++) {

            ctx.beginPath();
            ctx.moveTo(x*tileSize+0.5, 0);
            ctx.lineTo(
                x*tileSize+0.5,
                canvas.height
            );
            ctx.stroke();
        }

        for (let y = 0; y <= map.length; y++) {

            ctx.beginPath();
            ctx.moveTo(0, y*tileSize+0.5);
            ctx.lineTo(
                canvas.width,
                y*tileSize+0.5
            );
            ctx.stroke();
        }
    }
}
