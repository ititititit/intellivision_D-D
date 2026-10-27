"use strict";

/* =========================================================
   DUNGEON INVENTORY DISPLAY

   Responsible for:
       Drawing the inventory panel
       Drawing collected item icons
       Highlighting equipped weapons
       Drawing arrow and crown quantity tick marks
       Drawing player health on the right

   Dependencies:
       dungeon_definitions.js
       dungeon_render.js
       dungeon_player.js

   Public functions:
       drawInventory()

   Uses:
       ctx
       canvas
       drawSprite()
       player.inventory
       player.mode
       player.health
       INVENTORY_ICONS
       MAP_PIXEL_HEIGHT
       BLOCK_PIXELS
       PLAYER_MODE
========================================================= */

/* =========================================================
   DRAW INVENTORY

   Displays inventory and health below the map.
   Both sections are centered together.

   Items not collected display as empty slots.
   The currently equipped weapon is highlighted.
========================================================= */

function drawInventory() {

    const slotSize = 16;
    const iconSize = 8;
    const padding = 2;

    const inventoryWidth =
        INVENTORY_ICONS.length * slotSize;

    const healthWidth = 44;

    const width =
        inventoryWidth + healthWidth + padding * 2;

    const height = slotSize + padding * 2;

    const x0 = Math.floor((canvas.width - width) / 2);
    const y0 = MAP_PIXEL_HEIGHT + 2;

    ctx.save();

    // -------------------------------------
    // PANEL
    // -------------------------------------

    // Outer shadow
    ctx.fillStyle = "#000000";

    ctx.fillRect(
        x0 + 1,
        y0 + 1,
        width,
        height
    );

    // Main panel
    ctx.fillStyle = "#29221a";

    ctx.fillRect(
        x0,
        y0,
        width,
        height
    );

    // Gold border
    ctx.strokeStyle = "#b08a40";
    ctx.lineWidth = 1;

    ctx.strokeRect(
        x0 + 0.5,
        y0 + 0.5,
        width - 1,
        height - 1
    );

    // -------------------------------------
    // INVENTORY SLOTS
    // -------------------------------------

    for (let i = 0; i < INVENTORY_ICONS.length; i++) {

        const [item, spriteID] = INVENTORY_ICONS[i];

        const x = x0 + padding + i * slotSize;
        const y = y0 + padding;

        const value = player.inventory[item];

        // Support Boolean and numeric inventory
        const owned =
            typeof value === "number"
                ? value > 0
                : value === true;

        const equipped =
            (item === "sword" &&
             player.mode === PLAYER_MODE.SWORD) ||
            (item === "bow" &&
             player.mode === PLAYER_MODE.BOW);

        // Slot background
        ctx.fillStyle = owned
            ? "#302c24"
            : "#171717";

        ctx.fillRect(
            x,
            y,
            slotSize - 1,
            slotSize - 1
        );

        // Slot border
        ctx.strokeStyle = equipped
            ? "#ffe070"
            : owned
                ? "#8c7445"
                : "#444444";

        ctx.strokeRect(
            x + 0.5,
            y + 0.5,
            slotSize - 2,
            slotSize - 2
        );

        // Draw collected item sprite
        if (owned) {

            const iconX =
                x + Math.floor((slotSize - iconSize) / 2);

            const iconY = y + 1;

            drawSprite(
                spriteID,
                iconX / BLOCK_PIXELS,
                iconY / BLOCK_PIXELS
            );
        }

        // Draw quantity tick marks
        if (item === "arrow" || item === "crown") {

            const maxCount =
                item === "arrow" ? 9 : 2;

            const count = Math.max(
                0,
                Math.min(maxCount, value)
            );

            const tickWidth = 1;

            const tickGap =
                item === "arrow" ? 0 : 2;

            const totalWidth =
                maxCount * tickWidth +
                (maxCount - 1) * tickGap;

            const startX =
                x + Math.floor(
                    (slotSize - 1 - totalWidth) / 2
                );

            const tickY = y + 12;

            for (let n = 0; n < maxCount; n++) {

                ctx.fillStyle = n < count
                    ? "#ffe080"
                    : "#484037";

                ctx.fillRect(
                    startX + n * (tickWidth + tickGap),
                    tickY,
                    tickWidth,
                    2
                );
            }
        }
    }

    // -------------------------------------
    // PLAYER HEALTH — RIGHT SIDE
    // -------------------------------------

    const healthX = x0 + padding + inventoryWidth;
    const healthY = y0 + padding;

    const health = Math.max(0, player.health);
    const maxHealth = 10;

    const healthRatio = Math.min(
        1,
        health / maxHealth
    );

    // Divider
    ctx.fillStyle = "#8c7445";

    ctx.fillRect(
        healthX,
        healthY,
        1,
        slotSize - 1
    );

    // Health text
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffe080";

    ctx.fillText(
        "HP " + health,
        healthX + 22,
        healthY + 1
    );

    // Health bar background
    const barX = healthX + 5;
    const barY = healthY + 10;
    const barWidth = healthWidth - 10;

    ctx.fillStyle = "#171717";

    ctx.fillRect(
        barX,
        barY,
        barWidth,
        4
    );

    // Remaining health
    ctx.fillStyle =
        healthRatio > 0.5 ? "#60c060" :
        healthRatio > 0.2 ? "#e0b040" :
                            "#e05040";

    ctx.fillRect(
        barX,
        barY,
        Math.floor(barWidth * healthRatio),
        4
    );

    ctx.restore();
}