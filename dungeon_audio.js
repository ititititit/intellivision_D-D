
"use strict";

/* =========================================================
   DUNGEON AUDIO

   Responsible for:
       Awake monster proximity sounds
       Sleeping monster snoring
       Distance-based volume attenuation
       Distance-based probability of snoring

   Dependencies:
       dungeon_definitions.js
       dungeon_player.js
       sound.js
       Monster behavior definitions and isMonsterObject()

   Public functions:
       updateMonsterSounds()
       playSleepingMonsterSound()

   Configuration:
       MONSTER_SOUNDS
       MONSTER_SOUND_RANGE
       MONSTER_BEHAVIOR:
           makesSleepingSound
           hearingRange

   Distances are measured in world blocks using
   Euclidean distance.

   Each sleeping sound check plays at most one snore.
========================================================= */

function playSleepingMonsterSound() {

    const candidates = [];

    for (const monster of DUNGEON_OBJECTS) {

        if (!isMonsterObject(monster))
            continue;

        if (monster.state !== "sleeping")
            continue;

        const behavior = MONSTER_BEHAVIOR[monster[2]];

        if (!behavior?.makesSleepingSound)
            continue;

        const dx = monster[0] - player.x;
        const dy = monster[1] - player.y;

        const distance = Math.hypot(dx, dy);

        if (!behavior.hearingRange ||
            distance >= behavior.hearingRange)
            continue;

        // Probability and volume decrease with distance.
        const volume = 1 - distance / behavior.hearingRange;

        if (Math.random() >= volume)
            continue;

        candidates.push(volume);
    }

    if (candidates.length === 0)
        return;

    // Play one randomly selected sleeping monster.
    const volume = candidates[
        Math.floor(Math.random() * candidates.length)
    ];

    playSound(SOUND.SNORING, volume);
}
/* =========================================================
   UPDATE MONSTER SOUNDS

   Checks all dungeon objects for monsters with sounds.

   Only monsters within MONSTER_SOUND_RANGE are heard.

   Volume increases as the distance decreases.

   Uses Euclidean distance measured in world blocks.
========================================================= */

function updateMonsterSounds() {

    for (const obj of DUNGEON_OBJECTS) {

        // -----------------------------------------
        // SKIP PROJECTILES
        // -----------------------------------------

        if (obj.projectileType !== undefined)
            continue;

		if (obj.state === "dead" || obj.state === "sleeping")
			continue;

        const [x, y, type] = obj;

        const soundID = MONSTER_SOUNDS[type];

        if (soundID === undefined) {
            continue;
        }

        const dx = x - player.x;
        const dy = y - player.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (distance > MONSTER_SOUND_RANGE) {
            continue;
        }

        // Linear volume attenuation
        const volume =
            Math.max(
                0,
                1 - distance / MONSTER_SOUND_RANGE
            );

        playSound(soundID, volume);
    }
}
