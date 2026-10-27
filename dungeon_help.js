"use strict";

/* =========================================================
   DUNGEON HELP SCREEN

   Standalone canvas overlay; no external assets.

   Requires the game's existing `canvas` and `ctx` globals.

   Public functions:
       showHelp()
       hideHelp()
       toggleHelp()
       drawHelp()

   Call drawHelp() at the END of drawGame() so the overlay
   stays visible while the game continues rendering.

   Escape dismisses help. This module does not modify
   dungeon input handling.
========================================================= */

let helpVisible = false;

const helpCanvas = document.getElementById("helpCanvas");
const helpCtx = helpCanvas.getContext("2d");

function showHelp() {
    helpVisible = true;

    helpCanvas.style.display = "block";

    helpCanvas.width = window.innerWidth * window.devicePixelRatio;
    helpCanvas.height = window.innerHeight * window.devicePixelRatio;

    drawHelp();
}

function hideHelp() {
    helpVisible = false;

    helpCanvas.style.display = "none";
}

function toggleHelp() {
    if (helpVisible) hideHelp();
    else showHelp();
}

function drawHelp() {
    if (!helpVisible) return;

    const ctx = helpCtx;
    const canvas = helpCanvas;

    // Everything else in drawHelp() stays the same.

    if (!helpVisible || typeof ctx === "undefined" || typeof canvas === "undefined") return;

    const W = canvas.width;
    const H = canvas.height;
    const baseW = 1024;
    const baseH = 640;
    const scale = Math.min(W / baseW, H / baseH);
    const offsetX = (W - baseW * scale) / 2;
    const offsetY = (H - baseH * scale) / 2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const C = {
        orange: "#d57a2b",
        orangeLight: "#f4a44a",
        orangeDark: "#8b421a",
        yellow: "#f5d446",
        white: "#f0f0f4",
        gray: "#aaa9b3",
        purple: "#30218b",
        purpleLight: "#4334ad",
        purpleDark: "#171052",
        charcoal: "#3a3a45"
    };

    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    function line(x1, y1, x2, y2, color, thickness = 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function label(text, x, y, size = 19, color = C.white, align = "left") {
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = align;
        ctx.textBaseline = "middle";
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    function key(text, x, y, w = 66, h = 58, special = false) {
        rect(x + 5, y + 5, w, h, "#16121f");
        rect(x, y, w, h, "#dedde7");
        rect(x + 4, y + 4, w - 8, h - 8, special ? C.charcoal : C.purple);
        rect(x + 5, y + 5, w - 10, 5, special ? "#585863" : C.purpleLight);
        rect(x + 5, y + h - 10, w - 10, 5, special ? "#272731" : C.purpleDark);
        label(text, x + w / 2, y + h / 2 + 2, 30, C.white, "center");
    }

    // Double-layered pixel frame with square corner details.
    rect(42, 38, 940, 564, C.orangeDark);
    rect(48, 44, 928, 552, C.orangeLight);
    rect(54, 50, 916, 540, "#000");
    rect(49, 49, 8, 26, C.orange);
    rect(49, 49, 26, 8, C.orange);
    rect(967, 49, 8, 26, C.orange);
    rect(949, 49, 26, 8, C.orange);
    rect(49, 566, 8, 26, C.orange);
    rect(49, 584, 26, 8, C.orange);
    rect(967, 566, 8, 26, C.orange);
    rect(949, 584, 26, 8, C.orange);

    for (const [x, y] of [[50, 47], [958, 47], [50, 574], [958, 574]]) {
        rect(x, y, 16, 6, C.orangeLight);
        rect(x, y, 6, 16, C.orangeLight);
    }

    label("GAME CONTROLS", 512, 92, 46, C.yellow, "center");
    label("MOVEMENT", 88, 152, 27, C.yellow);
    label("FIRE ARROWS", 518, 152, 27, C.yellow);

    line(488, 157, 488, 506, C.gray, 2);

    const positions = [
        ["Q", "NORTHWEST", 100, 178],
        ["W", "NORTH",     235, 178],
        ["E", "NORTHEAST", 370, 178],
        ["A", "WEST",      100, 292],
        ["S", "USE",       235, 292],
        ["D", "EAST",      370, 292],
        ["Z", "SOUTHWEST", 100, 406],
        ["X", "SOUTH",     235, 406],
        ["C", "SOUTHEAST", 370, 406]
    ];

    for (const [letter, description, x, y] of positions) {
        key(letter, x, y, 66, 58, letter === "S");
        label(description, x + 33, y + 76, 15, C.white, "center");
    }

    // Arrow cluster and descriptions.
    key("↑", 587, 182, 58, 56);
    key("←", 521, 244, 58, 56);
    key("↓", 587, 244, 58, 56);
    key("→", 653, 244, 58, 56);

    label("ARROW KEYS", 742, 198, 18);
    label("FIRE AN ARROW", 742, 224, 18);
    label("BOW EQUIPPED", 742, 250, 17);
    label("ARROWS REQUIRED", 742, 276, 17);

    label("USE / INTERACT", 518, 342, 27, C.yellow);
    key("S", 521, 364, 66, 58, true);
    label("CURRENT TILE", 608, 381, 19);
    label("(RESERVED)", 608, 407, 17, C.gray);

    label("MODES", 518, 459, 27, C.yellow);
    label("BOW MODE TO FIRE", 524, 490, 18);

    line(72, 524, 952, 524, C.gray, 2);
    rect(98, 543, 828, 40, C.white);
    rect(102, 547, 820, 32, C.purpleDark);
    label("EXPLORE, COLLECT ITEMS, FIGHT ENEMIES, FIND THE EXIT!", 512, 563, 16, C.white, "center");

    ctx.restore();
}

// Escape closes the overlay before other document key handlers run.
document.addEventListener("keydown", function(event) {
    if (helpVisible && event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        hideHelp();
    }
}, true);