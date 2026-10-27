"use strict";
/* =========================================================
   OVERWORLD GENERATOR

   Requires:
       SPRITE
       TYPE
       VIEW_W
       VIEW_H
       OVERWORLD_DUNGEONS

   Public:
       generateOverworld(options)

   Returns:
       grid[y][x]

   Refreshes OVERWORLD_DUNGEONS during generation.
   Includes four WHITE locations for Cloudy Mountain.

   No drawing or HTML dependencies.
========================================================= */

const generateOverworld = (() => {

    let map = [];

    /* =====================================================
       GRID HELPERS
    ===================================================== */

    function createMap() {
        map = Array.from({ length: VIEW_H }, (_, y) =>
            Array.from({ length: VIEW_W }, (_, x) =>
                createTerrainTile(TYPE.GRASS, x, y)
            )
        );
    }

    function createTerrainTile(type, x, y, palette = null) {
        const even = (x + y) % 2 === 0;
        let sprite = SPRITE.GRASS;

        if (type === TYPE.FOREST) {
            sprite = even
                ? SPRITE.FOREST_1
                : SPRITE.FOREST_2;

        } else if (
            type === TYPE.MOUNTAIN ||
            type === TYPE.BLUE_MOUNTAIN ||
            type === TYPE.PURPLE_MOUNTAIN ||
            type === TYPE.RED_MOUNTAIN
        ) {
            sprite = even
                ? SPRITE.MOUNTAIN_1
                : SPRITE.MOUNTAIN_2;
        }

        return { type, sprite, palette };
    }

    function rnd(n) {
        return Math.floor(Math.random() * n);
    }

    function range(a, b) {
        return a + rnd(b - a + 1);
    }

    function mapInside(grid, x, y) {
        return (
            y >= 0 &&
            y < grid.length &&
            x >= 0 &&
            x < grid[y].length
        );
    }

    function inside(x, y) {
        return mapInside(map, x, y);
    }

    function cell(x, y) {
        return inside(x, y) ? map[y][x] : null;
    }

    function setCell(x, y, type, palette = null) {
        if (!inside(x, y)) return false;

        map[y][x] = createTerrainTile(type, x, y, palette);
        return true;
    }

    function protectedArea(x, y) {
        const centerY = Math.floor(VIEW_H / 2);

        return (
            (x <= 1 || x >= VIEW_W - 2) &&
            Math.abs(y - centerY) <= 1
        );
    }

    /* =====================================================
       MOUNTAINS
    ===================================================== */

    function growMountainRange(startX, startY, length, dx, dy) {
        let x = startX;
        let y = startY;

        for (let i = 0; i < length; i++) {
            if (!inside(x, y)) break;

            if (!protectedArea(x, y)) {
                const existing = cell(x, y);

                if (
                    existing.type === TYPE.GRASS ||
                    existing.type === TYPE.MOUNTAIN
                ) {
                    setCell(x, y, TYPE.MOUNTAIN, "BROWN");
                }
            }

            if (Math.random() < 0.32) {
                const sx = x + (rnd(2) ? 1 : -1);
                const sy = y + rnd(3) - 1;

                if (
                    inside(sx, sy) &&
                    !protectedArea(sx, sy) &&
                    cell(sx, sy).type === TYPE.GRASS
                ) {
                    setCell(sx, sy, TYPE.MOUNTAIN, "BROWN");
                }
            }

            const roll = Math.random();

            if (roll < 0.48) {
                x += dx;
                y += dy;
            } else if (roll < 0.70) {
                x += dx;
            } else if (roll < 0.88) {
                y += dy;
            } else {
                x -= dx;
                y += dy;
            }

            if (Math.random() < 0.13) {
                dx *= -1;
            }
        }
    }

    function generateMountains(target) {
        const anchors = [];
        let attempts = 0;

        function countMountains() {
            let count = 0;

            for (const row of map) {
                for (const tile of row) {
                    if (tile.type === TYPE.MOUNTAIN) {
                        count++;
                    }
                }
            }

            return count;
        }

        while (
            countMountains() < target &&
            attempts++ < 100
        ) {
            let x;
            let y;

            if (anchors.length && Math.random() < 0.65) {
                const anchor = anchors[rnd(anchors.length)];

                x = anchor.x + range(-4, 4);
                y = anchor.y + range(-3, 3);
            } else {
                x = range(2, VIEW_W - 3);
                y = rnd(VIEW_H);
            }

            x = Math.max(1, Math.min(VIEW_W - 2, x));
            y = Math.max(0, Math.min(VIEW_H - 1, y));

            anchors.push({ x, y });

            growMountainRange(
                x,
                y,
                range(5, 13),
                rnd(2) ? 1 : -1,
                rnd(2) ? 1 : -1
            );
        }
    }


/* =====================================================
   WALL BARRIERS
===================================================== */

function generateWallBarriers() {

    const candidates = [];

    const directions = [
        { dx: 1, dy: 0, axis: "horizontal" },
        { dx: 0, dy: 1, axis: "vertical" }
    ];

    for (let y = 2; y < VIEW_H - 1; y++) {
        for (let x = VIEW_W - 9; x < VIEW_W - 2; x++) {

            if (map[y][x].type !== TYPE.MOUNTAIN)
                continue;

            for (const { dx, dy, axis } of directions) {
                for (let length = 2; length <= 4; length++) {

                    const endX = x + dx * (length + 1);
                    const endY = y + dy * (length + 1);

                    if (!inside(endX, endY))
                        continue;

                    if (map[endY][endX].type !== TYPE.MOUNTAIN)
                        continue;

                    let clear = true;

                    for (let i = 1; i <= length; i++) {

                        const wx = x + dx * i;
                        const wy = y + dy * i;

                        if (
                            map[wy][wx].type !== TYPE.GRASS ||
                            protectedArea(wx, wy)
                        ) {
                            clear = false;
                            break;
                        }
                    }

                    if (clear) {
                        candidates.push({
                            x, y, dx, dy, axis, length
                        });
                    }
                }
            }
        }
    }

    if (!candidates.length)
        return;

    const axes = [
        ...new Set(candidates.map(c => c.axis))
    ];

    const axis = axes[rnd(axes.length)];

    const matching = candidates.filter(
        c => c.axis === axis
    );

    const shortest = Math.min(
        ...matching.map(c => c.length)
    );

    const choices = matching.filter(
        c => c.length === shortest
    );

    const wall = choices[rnd(choices.length)];

    // Place a door in the center of the wall.
    const center = Math.ceil(wall.length / 2);

    for (let i = 1; i <= wall.length; i++) {

        const isDoor = i === center;

        const sprite = wall.axis === "horizontal"
            ? (isDoor
                ? SPRITE.WALL_HORIZONTAL_DOOR
                : SPRITE.WALL_HORIZONTAL)
            : (isDoor
                ? SPRITE.WALL_VERTICAL_DOOR
                : SPRITE.WALL_VERTICAL);

        const wx = wall.x + wall.dx * i;
        const wy = wall.y + wall.dy * i;

        map[wy][wx] = {
            type: TYPE.WALL,
            sprite,
            palette: null,
            axis: wall.axis,
            door: isDoor
        };
    }
}

/* =====================================================
   RIVER RULES

   Cell format:
       [sprite, rotation, flipH, flipV]
===================================================== */

const DIR = [
    { name: "N", dx: 0, dy: -1 },
    { name: "E", dx: 1, dy: 0 },
    { name: "S", dx: 0, dy: 1 },
    { name: "W", dx: -1, dy: 0 }
];

    const FIXED_RULES = [
        {
            from: [SPRITE.RIVER_1,0,false,false],
            neighbors: {
                N: [
                    [SPRITE.RIVER_3,0,false,false],
                    [SPRITE.RIVER_2,2,true,false]
                ],
                E: [],
                S: [
                    [SPRITE.RIVER_2,0,false,false],
                    [SPRITE.RIVER_3,2,true,false]
                ],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_1,1,false,false],
            neighbors: {
                N: [],
                E: [
                    [SPRITE.RIVER_3,1,false,false],
                    [SPRITE.RIVER_2,3,true,false]
                ],
                S: [],
                W: [
                    [SPRITE.RIVER_2,1,false,false],
                    [SPRITE.RIVER_3,3,true,false]
                ]
            }
        },
        {
            from: [SPRITE.RIVER_1,2,false,false],
            neighbors: {
                N: [
                    [SPRITE.RIVER_2,2,false,false],
                    [SPRITE.RIVER_3,0,true,false]
                ],
                E: [],
                S: [
                    [SPRITE.RIVER_3,2,false,false],
                    [SPRITE.RIVER_2,0,true,false]
                ],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_1,3,false,false],
            neighbors: {
                N: [],
                E: [
                    [SPRITE.RIVER_2,3,false,false],
                    [SPRITE.RIVER_3,1,true,false]
                ],
                S: [],
                W: [
                    [SPRITE.RIVER_3,3,false,false],
                    [SPRITE.RIVER_2,1,true,false]
                ]
            }
        },
        {
            from: [SPRITE.RIVER_2,0,false,false],
            neighbors: {
                N: [
                    [SPRITE.RIVER_1,0,false,false],
                    [SPRITE.RIVER_3,0,false,false]
                ],
                E: [[SPRITE.RIVER_3,0,false,false]],
                S: [],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_2,1,false,false],
            neighbors: {
                N: [],
                E: [
                    [SPRITE.RIVER_1,1,false,false],
                    [SPRITE.RIVER_3,1,false,false]
                ],
                S: [[SPRITE.RIVER_3,1,false,false]],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_2,2,false,false],
            neighbors: {
                N: [],
                E: [],
                S: [
                    [SPRITE.RIVER_1,2,false,false],
                    [SPRITE.RIVER_3,2,false,false]
                ],
                W: [[SPRITE.RIVER_3,2,false,false]]
            }
        },
        {
            from: [SPRITE.RIVER_2,3,false,false],
            neighbors: {
                N: [[SPRITE.RIVER_3,3,false,false]],
                E: [],
                S: [],
                W: [
                    [SPRITE.RIVER_1,3,false,false],
                    [SPRITE.RIVER_3,3,false,false]
                ]
            }
        },
        {
            from: [SPRITE.RIVER_2,2,true,false],
            neighbors: {
                N: [],
                E: [[SPRITE.RIVER_3,2,true,false]],
                S: [[SPRITE.RIVER_1,0,false,false]],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_2,3,true,false],
            neighbors: {
                N: [],
                E: [],
                S: [[SPRITE.RIVER_3,3,true,false]],
                W: [[SPRITE.RIVER_1,1,false,false]]
            }
        },
        {
            from: [SPRITE.RIVER_2,0,true,false],
            neighbors: {
                N: [[SPRITE.RIVER_1,2,false,false]],
                E: [],
                S: [],
                W: [[SPRITE.RIVER_3,0,true,false]]
            }
        },
        {
            from: [SPRITE.RIVER_2,1,true,false],
            neighbors: {
                N: [[SPRITE.RIVER_3,1,true,false]],
                E: [[SPRITE.RIVER_1,3,false,false]],
                S: [],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_3,0,false,false],
            neighbors: {
                N: [],
                E: [],
                S: [
                    [SPRITE.RIVER_1,0,false,false],
                    [SPRITE.RIVER_2,0,false,false]
                ],
                W: [[SPRITE.RIVER_2,0,false,false]]
            }
        },
        {
            from: [SPRITE.RIVER_3,1,false,false],
            neighbors: {
                N: [[SPRITE.RIVER_2,1,false,false]],
                E: [],
                S: [],
                W: [
                    [SPRITE.RIVER_1,1,false,false],
                    [SPRITE.RIVER_2,1,false,false]
                ]
            }
        },
        {
            from: [SPRITE.RIVER_3,2,false,false],
            neighbors: {
                N: [
                    [SPRITE.RIVER_1,2,false,false],
                    [SPRITE.RIVER_2,2,false,false]
                ],
                E: [[SPRITE.RIVER_2,2,false,false]],
                S: [],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_3,3,false,false],
            neighbors: {
                N: [],
                E: [
                    [SPRITE.RIVER_1,3,false,false],
                    [SPRITE.RIVER_2,3,false,false]
                ],
                S: [[SPRITE.RIVER_2,3,false,false]],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_3,2,true,false],
            neighbors: {
                N: [[SPRITE.RIVER_1,0,false,false]],
                E: [],
                S: [],
                W: [[SPRITE.RIVER_2,2,true,false]]
            }
        },
        {
            from: [SPRITE.RIVER_3,3,true,false],
            neighbors: {
                N: [[SPRITE.RIVER_2,3,true,false]],
                E: [[SPRITE.RIVER_1,1,false,false]],
                S: [],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_3,0,true,false],
            neighbors: {
                N: [],
                E: [[SPRITE.RIVER_2,0,true,false]],
                S: [[SPRITE.RIVER_1,2,false,false]],
                W: []
            }
        },
        {
            from: [SPRITE.RIVER_3,1,true,false],
            neighbors: {
                N: [],
                E: [],
                S: [[SPRITE.RIVER_2,1,true,false]],
                W: [[SPRITE.RIVER_1,3,false,false]]
            }
        }
    ];

    /* =====================================================
       RIVER RULE TABLE
    ===================================================== */

    function makeCell(data) {
        return {
            sprite: data[0],
            rotation: data[1],
            flipH: data[2],
            flipV: data[3]
        };
    }

    function copyCell(c) {
        return {
            sprite: c.sprite,
            rotation: c.rotation,
            flipH: !!c.flipH,
            flipV: !!c.flipV
        };
    }

    function cellKey(c) {
        return [
            c.sprite,
            c.rotation,
            Number(c.flipH),
            Number(c.flipV)
        ].join(":");
    }

    function rotateCell(c, turns) {
        return {
            ...copyCell(c),
            rotation: (c.rotation + turns) % 4
        };
    }

    const neighborRules = new Map();

    function getRuleSlots(c) {
        const key = cellKey(c);

        if (!neighborRules.has(key)) {
            neighborRules.set(key, [[],[],[],[]]);
        }

        return neighborRules.get(key);
    }

    function addRule(from, direction, to) {
        const list = getRuleSlots(from)[direction];
        const key = cellKey(to);

        if (!list.some(c => cellKey(c) === key)) {
            list.push(copyCell(to));
        }
    }

    function buildRules() {
        neighborRules.clear();

        for (const rule of FIXED_RULES) {
            const source = makeCell(rule.from);

            for (let direction = 0; direction < 4; direction++) {
                const name = DIR[direction].name;

                for (const data of rule.neighbors[name]) {
                    const target = makeCell(data);

                    for (let turns = 0; turns < 4; turns++) {
                        const from = rotateCell(source, turns);
                        const to = rotateCell(target, turns);
                        const d = (direction + turns) % 4;

                        addRule(from, d, to);
                        addRule(to, (d + 2) % 4, from);
                    }
                }
            }
        }
    }

    /* =====================================================
       RIVERS
    ===================================================== */

    const RIVER_SETTINGS = {
        beamWidth: 32,
        mountainPenalty: 80,
        grassPenalty: 1,
        northPenalty: 7,
        horizontalPenalty: 2,
        southPenalty: 0,
        turnPenalty: 0.5,
        allowMountainCrossing: true
    };

    function riverTerrainCost(map, x, y, settings) {
        if (!mapInside(map, x, y)) {
            return Infinity;
        }

        const tile = map[y][x];

        if (!tile || tile.type === TYPE.GRASS) {
            return settings.grassPenalty;
        }

        if (
            tile.type === TYPE.MOUNTAIN &&
            settings.allowMountainCrossing
        ) {
            return settings.mountainPenalty;
        }

        return Infinity;
    }

    function riverNextOptions(map, state, settings) {
        const slots = neighborRules.get(cellKey(state.cell));
        if (!slots) return [];

        const options = [];

        for (let d = 0; d < 4; d++) {
            if (d === state.entry) continue;

            const nx = state.x + DIR[d].dx;
            const ny = state.y + DIR[d].dy;
            const key = nx + "," + ny;

            if (state.visited.has(key)) continue;

            const terrainCost = riverTerrainCost(
                map, nx, ny, settings
            );

            if (!Number.isFinite(terrainCost)) continue;

            let directionCost =
                d === 0 ? settings.northPenalty :
                d === 2 ? settings.southPenalty :
                          settings.horizontalPenalty;

            if (
                state.direction !== null &&
                state.direction !== d
            ) {
                directionCost += settings.turnPenalty;
            }

            for (const next of slots[d]) {
                options.push({
                    x: nx,
                    y: ny,
                    cell: copyCell(next),
                    entry: (d + 2) % 4,
                    direction: d,
                    cost: terrainCost + directionCost
                });
            }
        }

        return options;
    }

    function generateSingleRiver(
        map, startX, maxLength, settings, startY = 0
    ) {
        const empty = {
            length: 0,
            mountainCrossings: 0,
            path: []
        };

        if (!mapInside(map, startX, startY)) {
            return empty;
        }

        const initialCost = riverTerrainCost(
            map, startX, startY, settings
        );

        if (!Number.isFinite(initialCost)) {
            return empty;
        }

        const starts = FIXED_RULES
            .map(rule => makeCell(rule.from))
            .filter(c => {
                const slots = neighborRules.get(cellKey(c));
                return slots && slots[2].length > 0;
            });

        if (!starts.length) return empty;

        let beam = starts.map(c => ({
            x: startX,
            y: startY,
            cell: copyCell(c),
            entry: 0,
            direction: null,
            cost: initialCost,
            crossings:
                map[startY][startX].type === TYPE.MOUNTAIN
                    ? 1 : 0,
            visited: new Set([startX + "," + startY]),
            path: [{
                x: startX,
                y: startY,
                cell: copyCell(c)
            }]
        }));

        let best = beam[0];

        for (let step = 1; step < maxLength; step++) {
            const candidates = [];

            for (const state of beam) {
                const options = riverNextOptions(
                    map, state, settings
                );

                for (const next of options) {
                    const visited = new Set(state.visited);
                    visited.add(next.x + "," + next.y);

                    const isMountain =
                        map[next.y][next.x] &&
                        map[next.y][next.x].type === TYPE.MOUNTAIN;

                    candidates.push({
                        x: next.x,
                        y: next.y,
                        cell: next.cell,
                        entry: next.entry,
                        direction: next.direction,
                        cost: state.cost + next.cost,
                        crossings:
                            state.crossings + (isMountain ? 1 : 0),
                        visited,
                        path: [
                            ...state.path,
                            {
                                x: next.x,
                                y: next.y,
                                cell: next.cell
                            }
                        ]
                    });
                }
            }

            if (!candidates.length) break;

            candidates.sort((a, b) => a.cost - b.cost);
            beam = candidates.slice(0, settings.beamWidth);
            best = beam[0];
        }

        for (const p of best.path) {
            map[p.y][p.x] = {
                type: TYPE.RIVER,
                sprite: p.cell.sprite,
                rotation: p.cell.rotation,
                flipH: p.cell.flipH,
                flipV: p.cell.flipV,
                palette: null
            };
        }

        return {
            length: best.path.length,
            mountainCrossings: best.crossings,
            path: best.path
        };
    }

    function generateRivers(
        map, count = 2, maxLength = 10, options = {}
    ) {
        const settings = {
            ...RIVER_SETTINGS,
            ...options
        };

        const results = [];
        const width = map[0].length;

        for (let i = 0; i < count; i++) {
            const startX = Math.max(
                0,
                Math.min(
                    width - 1,
                    Math.floor((i + 0.5) * width / count)
                )
            );

            const startY = Math.random() < 0.60
                ? 0
                : range(1, Math.ceil(map.length / 2) - 1);

            results.push(
                generateSingleRiver(
                    map, startX, maxLength, settings, startY
                )
            );
        }

        return {
            rivers: results,
            totalTiles: results.reduce(
                (sum, river) => sum + river.length, 0
            ),
            mountainCrossings: results.reduce(
                (sum, river) => sum + river.mountainCrossings, 0
            )
        };
    }

    /* =====================================================
       FORESTS
    ===================================================== */

    const FOREST_SETTINGS = {
        minPatchSize: 4,
        maxPatchSize: 12,
        branchChance: 0.52,
        obstacleAttraction: 2,
        seedChance: 0.04,
        maxAttempts: 150
    };

    const FOREST_NEIGHBORS = [
        [0,-1], [1,0], [0,1], [-1,0],
        [1,-1], [1,1], [-1,1], [-1,-1]
    ];

    function forestCanGrow(map, x, y) {
        if (!mapInside(map, x, y)) return false;

        const width = map[0].length;
        const centerY = Math.floor(map.length / 2);

        if (
            (x <= 1 && Math.abs(y - centerY) <= 1) ||
            (x >= width - 2 && Math.abs(y - centerY) <= 1)
        ) {
            return false;
        }

        const tile = map[y][x];
        return !tile || tile.type === TYPE.GRASS;
    }

    function forestObstacleNeighbors(map, x, y) {
        let count = 0;

        for (const [dx, dy] of FOREST_NEIGHBORS) {
            const nx = x + dx;
            const ny = y + dy;

            if (!mapInside(map, nx, ny)) continue;

            const tile = map[ny][nx];
            if (!tile) continue;

            if (
                tile.type === TYPE.MOUNTAIN ||
                tile.type === TYPE.RIVER ||
                tile.type === TYPE.FOREST
            ) {
                count++;
            }
        }

        return count;
    }

    function forestChooseSeed(map, settings) {
        const candidates = [];

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (!forestCanGrow(map, x, y)) continue;

                const attraction =
                    forestObstacleNeighbors(map, x, y);

                if (
                    attraction === 0 &&
                    Math.random() >= settings.seedChance
                ) {
                    continue;
                }

                candidates.push({
                    x,
                    y,
                    weight:
                        1 + attraction * settings.obstacleAttraction
                });
            }
        }

        if (!candidates.length) return null;

        const total = candidates.reduce(
            (sum, c) => sum + c.weight, 0
        );

        let pick = Math.random() * total;

        for (const candidate of candidates) {
            pick -= candidate.weight;
            if (pick <= 0) return candidate;
        }

        return candidates[candidates.length - 1];
    }

    function growForestPatch(
        map, seed, maxSize, remaining, settings
    ) {
        const frontier = [seed];
        let placed = 0;

        while (
            frontier.length &&
            placed < maxSize &&
            placed < remaining
        ) {
            const index = rnd(frontier.length);
            const p = frontier.splice(index, 1)[0];

            if (!forestCanGrow(map, p.x, p.y)) continue;

            map[p.y][p.x] = createTerrainTile(
                TYPE.FOREST, p.x, p.y
            );

            placed++;

            for (const [dx, dy] of FOREST_NEIGHBORS) {
                if (Math.random() < settings.branchChance) {
                    frontier.push({
                        x: p.x + dx,
                        y: p.y + dy
                    });
                }
            }
        }

        return placed;
    }

    function generateForests(map, target, options = {}) {
        const settings = {
            ...FOREST_SETTINGS,
            ...options
        };

        let placed = 0;
        let patches = 0;
        let attempts = 0;

        while (
            placed < target &&
            attempts++ < settings.maxAttempts
        ) {
            const seed = forestChooseSeed(map, settings);
            if (!seed) break;

            const patchSize = range(
                settings.minPatchSize,
                settings.maxPatchSize
            );

            const added = growForestPatch(
                map,
                seed,
                patchSize,
                target - placed,
                settings
            );

            if (added > 0) {
                placed += added;
                patches++;
            }
        }

        return { target, placed, patches };
    }

    /* =====================================================
       PATH ACCESS

       Blue mountain   = boat
       Purple mountain = key
       Red mountain    = axe

       Colored mountains are passable.
    ===================================================== */

    const ACCESS_MOUNTAINS = [
        { type: TYPE.BLUE_MOUNTAIN, item: "boat" },
        { type: TYPE.PURPLE_MOUNTAIN, item: "key" },
        { type: TYPE.RED_MOUNTAIN, item: "axe" }
    ];

    const ACCESS_DIRECTIONS = [
        [0,-1], [1,0], [0,1], [-1,0]
    ];

	function add_CloudyMountain() {
		const x = VIEW_W - 2;
		const y = Math.floor(VIEW_H / 2) - 1;
		
		OVERWORLD_DUNGEONS.push([x  , y  , "WHITE"]);
		OVERWORLD_DUNGEONS.push([x+1, y  , "WHITE"]);
		OVERWORLD_DUNGEONS.push([x  , y+1, "WHITE"]);
		OVERWORLD_DUNGEONS.push([x+1, y+1, "WHITE"]);
	}

    function ensureOverworldPaths(map) {
    	add_CloudyMountain();
        const height = map.length;
        const width = map[0].length;

        const start = {
            x: 0,
            y: Math.floor(height / 2)
        };

        const finish = {
            x: width - 2,
            y: Math.floor(height / 2)
        };

        const inside = (x, y) => mapInside(map, x, y);
        const key = (x, y) => y * width + x;

        const isCloudyMountain = (x, y) =>
            x >= width - 2 &&
            y >= finish.y - 1 &&
            y <= finish.y;

        const mountainDefinition = type =>
            ACCESS_MOUNTAINS.find(m => m.type === type);

        function requiredItem(type) {
            switch (type) {
                case TYPE.RIVER: return "boat";
                case TYPE.WALL: return "key";
                case TYPE.FOREST: return "axe";
                default: return null;
            }
        }

        let addedMountains = 0;

        function placeMountain(x, y, definition) {
            map[y][x] = createTerrainTile(
                definition.type, x, y
            );

            const color = {
                [TYPE.BLUE_MOUNTAIN]: "BLUE",
                [TYPE.PURPLE_MOUNTAIN]: "PURPLE",
                [TYPE.RED_MOUNTAIN]: "RED"
            }[definition.type];

            OVERWORLD_DUNGEONS.push([x, y, color]);
            addedMountains++;
        }

        // Clear and record Cloudy Mountain's four tiles.
        for (let y = finish.y - 1; y <= finish.y; y++) {
            for (let x = width - 2; x < width; x++) {
                map[y][x] = createTerrainTile(
                    TYPE.GRASS, x, y
                );

                OVERWORLD_DUNGEONS.push([x, y, "WHITE"]);
            }
        }

        map[start.y][start.x] = createTerrainTile(
            TYPE.GRASS, start.x, start.y
        );

        // Ensure at least one mountain of each color.
        for (const definition of ACCESS_MOUNTAINS) {
            if (map.some(row =>
                row.some(tile => tile.type === definition.type)
            )) {
                continue;
            }

            let candidates = [];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (
                        !isCloudyMountain(x, y) &&
                        map[y][x].type === TYPE.MOUNTAIN
                    ) {
                        candidates.push({ x, y });
                    }
                }
            }

            if (!candidates.length) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (
                            !isCloudyMountain(x, y) &&
                            !(x === start.x && y === start.y) &&
                            map[y][x].type === TYPE.GRASS
                        ) {
                            candidates.push({ x, y });
                        }
                    }
                }
            }

            if (!candidates.length) {
                throw new Error(
                    "No space for required colored mountains."
                );
            }

            const p = candidates[rnd(candidates.length)];
            placeMountain(p.x, p.y, definition);
        }

        function canEnter(tile, inventory) {
            if (tile.type === TYPE.MOUNTAIN) return false;

            const item = requiredItem(tile.type);
            return !item || inventory.has(item);
        }

        // Repeat exploration as equipment opens terrain.
        function explore() {
            const inventory = new Set();
            let reachable;
            let changed;

            do {
                changed = false;
                reachable = new Set([key(start.x, start.y)]);
                const queue = [start];

                for (let index = 0; index < queue.length; index++) {
                    const p = queue[index];

                    const definition =
                        mountainDefinition(map[p.y][p.x].type);

                    if (
                        definition &&
                        !inventory.has(definition.item)
                    ) {
                        inventory.add(definition.item);
                        changed = true;
                    }

                    for (const [dx, dy] of ACCESS_DIRECTIONS) {
                        const x = p.x + dx;
                        const y = p.y + dy;

                        if (
                            !inside(x, y) ||
                            reachable.has(key(x, y)) ||
                            !canEnter(map[y][x], inventory)
                        ) {
                            continue;
                        }

                        reachable.add(key(x, y));
                        queue.push({ x, y });
                    }
                }
            } while (changed);

            return { reachable, inventory };
        }

        function findRepairRoute(access) {
            const total = width * height;
            const costs = Array(total).fill(Infinity);
            const previous = Array(total).fill(-1);
            const pending = [];

            for (const id of access.reachable) {
                costs[id] = 0;
                pending.push({ id, cost: 0 });
            }

            const goal = key(finish.x, finish.y);

            while (pending.length) {
                pending.sort((a, b) => a.cost - b.cost);
                const current = pending.shift();

                if (current.cost !== costs[current.id]) continue;
                if (current.id === goal) break;

                const x = current.id % width;
                const y = Math.floor(current.id / width);

                for (const [dx, dy] of ACCESS_DIRECTIONS) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (!inside(nx, ny)) continue;

                    const tile = map[ny][nx];

                    const stepCost =
                        tile.type === TYPE.MOUNTAIN ? 5 :
                        canEnter(tile, access.inventory) ? 1 : 3;

                    const id = key(nx, ny);
                    const cost = current.cost + stepCost;

                    if (cost >= costs[id]) continue;

                    costs[id] = cost;
                    previous[id] = current.id;
                    pending.push({ id, cost });
                }
            }

            const path = [];
            let id = goal;

            while (!access.reachable.has(id)) {
                if (id < 0 || previous[id] < 0) {
                    throw new Error(
                        "Unable to plan an overworld route."
                    );
                }

                path.push({
                    x: id % width,
                    y: Math.floor(id / width)
                });

                id = previous[id];
            }

            return path.reverse();
        }

        function placeAccessibleEquipment(
            definition, access, near
        ) {
            const candidates = [];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (isCloudyMountain(x, y)) continue;

                    const tile = map[y][x];
                    const id = key(x, y);

                    const adjacentToReachable =
                        ACCESS_DIRECTIONS.some(([dx, dy]) =>
                            inside(x + dx, y + dy) &&
                            access.reachable.has(
                                key(x + dx, y + dy)
                            )
                        );

                    const opensMountain =
                        tile.type === TYPE.MOUNTAIN &&
                        adjacentToReachable;

                    const reachableGrass =
                        tile.type === TYPE.GRASS &&
                        access.reachable.has(id);

                    if (!opensMountain && !reachableGrass) {
                        continue;
                    }

                    candidates.push({
                        x,
                        y,
                        score:
                            (opensMountain ? 0 : 1000) +
                            (
                                x === start.x && y === start.y
                                    ? 10000 : 0
                            ) +
                            Math.abs(x - near.x) +
                            Math.abs(y - near.y)
                    });
                }
            }

            candidates.sort((a, b) => a.score - b.score);

            if (!candidates.length) {
                throw new Error(
                    "No accessible equipment location."
                );
            }

            const p = candidates[0];
            placeMountain(p.x, p.y, definition);
        }

        for (
            let attempt = 0;
            attempt < width * height + 4;
            attempt++
        ) {
            const access = explore();

            if (access.reachable.has(key(finish.x, finish.y))) {
                return {
                    valid: true,
                    addedMountains,
                    inventory: [...access.inventory]
                };
            }

            const path = findRepairRoute(access);
            const next = path[0];
            const tile = map[next.y][next.x];

            if (tile.type === TYPE.MOUNTAIN) {
                let definition = null;

                for (const p of path) {
                    const item = requiredItem(map[p.y][p.x].type);

                    if (item && !access.inventory.has(item)) {
                        definition = ACCESS_MOUNTAINS.find(
                            m => m.item === item
                        );
                        break;
                    }
                }

                definition ??=
                    ACCESS_MOUNTAINS.find(
                        m => !access.inventory.has(m.item)
                    ) ??
                    ACCESS_MOUNTAINS[
                        rnd(ACCESS_MOUNTAINS.length)
                    ];

                placeMountain(next.x, next.y, definition);

            } else {
                const item = requiredItem(tile.type);

                const definition = ACCESS_MOUNTAINS.find(
                    m => m.item === item
                );

                if (!definition) {
                    throw new Error(
                        "Unexpected blocked terrain."
                    );
                }

                placeAccessibleEquipment(
                    definition, access, next
                );
            }
        }

        throw new Error(
            "Overworld route repair did not finish."
        );
    }

    /* =====================================================
       PUBLIC GENERATION FUNCTION
    ===================================================== */

    buildRules();

    return function generateOverworld({
        mountainDensity = 28,
        forestDensity = 15,
        riverCount = 2,
        riverLength = 10,
        mountainPenalty = 80,
        allowMountainCrossing = true
    } = {}) {
        OVERWORLD_DUNGEONS.length = 0;

        createMap();

        generateMountains(
            Math.round(
                VIEW_W * VIEW_H * mountainDensity / 100
            )
        );

        generateWallBarriers();

        generateRivers(
            map,
            riverCount,
            riverLength,
            {
                mountainPenalty,
                allowMountainCrossing
            }
        );

        generateForests(
            map,
            Math.round(
                VIEW_W * VIEW_H * forestDensity / 100
            )
        );

        ensureOverworldPaths(map);

        return map;
    };

})();