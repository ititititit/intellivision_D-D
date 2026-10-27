
"use strict";

/* =========================================================
   OVERWORLD TEST CONTROLLER — TEST PAGE ONLY

   Dependencies:
       overworld_generator.js
       overworld_render.js

   Public functions:
       generateOverworldTest()
       refreshOverworldTest()

   Responsibilities:
       Read test controls
       Generate an overworld
       Display the map
       Display generation statistics

   No terrain generation or sprite drawing logic.
========================================================= */


/* =========================================================
   TEST MAP
========================================================= */

let testOverworldMap = null;


/* =========================================================
   READ NUMERIC CONTROL

   Reads and validates a numeric input.

   Returns a value within the specified range.
========================================================= */

function testNumber(id, fallback, min, max) {

    const value = Number(
        document.getElementById(id).value
    );

    return Number.isFinite(value)
        ? Math.max(min, Math.min(max, value))
        : fallback;
}


/* =========================================================
   REFRESH OVERWORLD DISPLAY

   Redraws the existing map without regenerating it.

   Used when changing display options.
========================================================= */

function refreshOverworldTest() {

    if (!testOverworldMap)
        return;

    drawOverworld(
        document.getElementById("map"),
        testOverworldMap,
        {
            tileSize: 40,
            showGrid:
                document.getElementById("showGrid").checked
        }
    );
}


/* =========================================================
   GENERATE OVERWORLD TEST

   Reads the controls and requests a new overworld
   from overworld_generator.js.

   The generated map is then passed to the renderer.
========================================================= */

function generateOverworldTest() {

    let stats = null;

    testOverworldMap = generateOverworld({

        width: 20,
        height: 12,

        mountainDensity: testNumber(
            "mountainDensity", 28, 0, 100
        ),

        forestDensity: testNumber(
            "forestDensity", 15, 0, 100
        ),

        riverCount: testNumber(
            "riverCount", 2, 0, 8
        ),

        riverLength: testNumber(
            "riverLength", 10, 1, 100
        ),

        mountainPenalty: testNumber(
            "mountainPenalty", 80, 1, 500
        ),

        allowMountainCrossing:
            document.getElementById("allowCrossing").checked,

        onStats: s => {
            stats = s;
        }

    });

    // Draw the newly generated map.

    refreshOverworldTest();

    // Display generation statistics.

    const r = stats.rivers;

    document.getElementById("status").textContent =
        "Mountain tiles: " + stats.mountains + "\n" +
        "River tiles: " + r.totalTiles + "\n" +
        "Mountain crossings: " + r.mountainCrossings + "\n" +
        "River lengths: " +
            r.rivers.map(v => v.length).join(", ") + "\n" +
        "Forest tiles: " + stats.forests.placed + "\n" +
        "Forest patches: " + stats.forests.patches;
}


/* =========================================================
   INITIALIZE TEST
========================================================= */

generateOverworldTest();
