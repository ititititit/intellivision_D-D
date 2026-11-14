"use strict";

/* =========================================================
   DUNGEON INVENTORY DISPLAY

   Draws collected items, equipped weapon highlights,
   quantity marks, and player health below the map.

   Dependencies:
       dungeon_definitions.js
       dungeon_render.js
       dungeon_player.js

   Public function:
       drawInventory()
========================================================= */

function drawInventoryCompass(x, y, size) {

    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.4;

    ctx.save();

    // Fixed dial.
    ctx.fillStyle = "#d8d0a0";
    ctx.strokeStyle = "#d8b030";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    let nearest = null;
    let nearestDistance = Infinity;

    if (gameMode === GAME_MODE.DUNGEON) {

        for (const treasure of DUNGEON_PLACEMENT.treasures ?? []) {

            // Ignore treasures that have already been collected.
            const stillPresent = DUNGEON_OBJECTS.some(obj =>
                obj.projectileType === undefined &&
                obj[0] === treasure.x &&
                obj[1] === treasure.y &&
                obj[2] === PLACEMENT_OBJECT_TYPES[treasure.type]
            );

            if (!stillPresent)
                continue;

            const dx = treasure.x - player.x;
            const dy = treasure.y - player.y;
            const distance = dx * dx + dy * dy;

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = { dx, dy };
            }
        }
    }

    if (nearest && nearestDistance > 0) {

        const angle = Math.atan2(nearest.dy, nearest.dx);
        const length = radius - 1;

        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // Orange tip points toward treasure.
        ctx.fillStyle = "#ed641c";
        ctx.beginPath();
        ctx.moveTo(length, 0);
        ctx.lineTo(-2, -2);
        ctx.lineTo(-2, 2);
        ctx.closePath();
        ctx.fill();

        // Opposite end.
        ctx.fillStyle = "#408ac0";
        ctx.beginPath();
        ctx.moveTo(-length, 0);
        ctx.lineTo(0, -2);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

/* =========================================================
   DRAW INVENTORY
========================================================= */

function drawInventory() {

    const iconSize = DISPLAY_BLOCK_PIXELS;
    const slotSize = iconSize + 6;
    const padding = 2;
    const healthWidth = 44;

    const inventoryWidth = INVENTORY_ICONS.length * slotSize;
	const helpWidth = slotSize * 2;
	const width = inventoryWidth + healthWidth + helpWidth + padding * 2;
    const height = slotSize + padding * 2;

    const panelX = Math.floor((canvas.width - width) / 2);
    const panelY = MAP_PIXEL_HEIGHT + 1;

    const contentX = panelX + padding;
    const contentY = panelY + padding;

    ctx.save();
    ctx.lineWidth = 1;

    // Panel shadow.
    ctx.fillStyle = "#000000";
    ctx.fillRect(panelX + 1, panelY + 1, width, height);

    // Panel background and border.
    ctx.fillStyle = "#29221a";
    ctx.fillRect(panelX, panelY, width, height);

    ctx.strokeStyle = "#b08a40";
    ctx.strokeRect(
        panelX + 0.5,
        panelY + 0.5,
        width - 1,
        height - 1
    );

    // Item slots.
    for (let i = 0; i < INVENTORY_ICONS.length; i++) {

        const [item, spriteID] = INVENTORY_ICONS[i];

        const x = contentX + i * slotSize;
        const y = contentY;

        const value = player.inventory[item];

        const owned = typeof value === "number"
            ? value > 0
            : value === true;

        const equipped =
            (item === "sword" && player.mode === PLAYER_MODE.SWORD) ||
            (item === "bow" && player.mode === PLAYER_MODE.BOW);

        ctx.fillStyle = owned ? "#302c24" : "#171717";
        ctx.fillRect(x, y, slotSize - 1, slotSize - 1);

        ctx.strokeStyle = equipped
            ? "#ffe070"
            : owned ? "#8c7445" : "#444444";

        ctx.strokeRect(
            x + 0.5,
            y + 0.5,
            slotSize - 2,
            slotSize - 2
        );

        if (owned) {

            const iconX =
                x + Math.floor((slotSize - 1 - iconSize) / 2);

            const iconY = y + 1;

            if (item === "compass") {

                drawInventoryCompass(iconX, iconY, iconSize);

            } else {

                drawSprite(
                    spriteID,
                    iconX / DISPLAY_BLOCK_PIXELS,
                    iconY / DISPLAY_BLOCK_PIXELS
                );
            }
        }

        if (item === "arrow" || item === "crown") {

            drawInventoryQuantity(
                x,
                y + iconSize + 2,
                slotSize - 1,
                value,
                item === "arrow" ? 9 : 2,
                item === "arrow" ? 0 : 2
            );
        }
    }

    drawInventoryHealth(
        contentX + inventoryWidth,
        contentY,
        healthWidth,
        slotSize
    );

	drawInventoryHelp(
		contentX + inventoryWidth + healthWidth,
		contentY,
		helpWidth,
		slotSize
	);

    ctx.restore();
}


/* =========================================================
   QUANTITY MARKS

   Coordinates and width are in canvas pixels.
========================================================= */

function drawInventoryQuantity(x, y, width, value, maxCount, gap) {

    const count = Number.isFinite(value)
        ? Math.max(0, Math.min(maxCount, Math.floor(value)))
        : 0;

    const marksWidth = maxCount + (maxCount - 1) * gap;
    const startX = x + Math.floor((width - marksWidth) / 2);

    for (let n = 0; n < maxCount; n++) {

        ctx.fillStyle = n < count ? "#ffe080" : "#484037";

        ctx.fillRect(
            startX + n * (1 + gap),
            y,
            1,
            2
        );
    }
}


/* =========================================================
   PLAYER HEALTH

   Coordinates and dimensions are in canvas pixels.
========================================================= */

function drawInventoryHealth(x, y, width, height) {

    const health = Math.max(0, player.health);
    const maxHealth = 10;
    const ratio = Math.min(1, health / maxHealth);

    const contentY = y + Math.floor((height - 16) / 2);

    // Divider.
    ctx.fillStyle = "#8c7445";
    ctx.fillRect(x, y, 1, height - 1);

    // Health label.
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffe080";

    ctx.fillText(
		"HP " + Number(health.toFixed(1)),
        x + width / 2,
        contentY + 1
    );

    // Health bar.
    const barX = x + 5;
    const barY = contentY + 10;
    const barWidth = width - 10;

    ctx.fillStyle = "#171717";
    ctx.fillRect(barX, barY, barWidth, 4);

    ctx.fillStyle =
        ratio > 0.5 ? "#60c060" :
        ratio > 0.2 ? "#e0b040" :
                      "#e05040";

    ctx.fillRect(
        barX,
        barY,
        Math.floor(barWidth * ratio),
        4
    );
}

let inventoryHelpBounds = null;

function drawInventoryHelp(x, y, width, height) {
    inventoryHelpBounds = { x, y, width, height };

    const buttonWidth = width / 2;

    for (let i = 0; i < 2; i++) {
        const buttonX = x + i * buttonWidth;

        ctx.fillStyle = "#171717";
        ctx.fillRect(
            buttonX + 2,
            y + 2,
            buttonWidth - 4,
            height - 4
        );

        ctx.strokeStyle = "#b08a40";
        ctx.strokeRect(
            buttonX + 2.5,
            y + 2.5,
            buttonWidth - 5,
            height - 5
        );

        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffe080";

        ctx.fillText(
            i === 0 ? "?" : "i",
            buttonX + buttonWidth / 2,
            y + height / 2
        );
    }
}

canvas.addEventListener("click", function(event) {
    const bounds = inventoryHelpBounds;
    if (!bounds || helpVisible) return;

    const rect = canvas.getBoundingClientRect();

    const x = (
        event.clientX - rect.left - canvas.clientLeft
    ) * canvas.width / canvas.clientWidth;

    const y = (
        event.clientY - rect.top - canvas.clientTop
    ) * canvas.height / canvas.clientHeight;

    if (
        x < bounds.x ||
        x >= bounds.x + bounds.width ||
        y < bounds.y ||
        y >= bounds.y + bounds.height
    ) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (x < bounds.x + bounds.width / 2) {
        helpPage = "controls";
        showHelp();
    } else {
        showStory();
    }
}, true);