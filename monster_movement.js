
"use strict";

/* =========================================================
   IDENTIFY MONSTER OBJECT
========================================================= */

function isMonsterObject(obj) {

    const objectID = obj[2];

    switch (objectID) {

        case OBJECT.BAT:
        case OBJECT.SNAKE:
        case OBJECT.DEMON:
        case OBJECT.DRAGON:
        case OBJECT.RAT:
        case OBJECT.SPIDER:
        case OBJECT.BLOB:
        case OBJECT.WINGED_DRAGON:
            return true;

        default:
            return false;
    }
}

/* =========================================================
   MONSTER MOVEMENT

   Movement selection routines.

   wanderMonster:
       Randomly selects an available neighboring square.
       Avoids returning to the previous square unless
       no other valid destination exists.

   chaseMonster:
       Attempts movement toward the player in priority:
           1. Diagonal
           2. Vertical
           3. Horizontal
       Falls back to wandering if permitted.

   Movement selection functions return { x, y } or null.
   They do not modify monster positions.

   Monster positions:
       monster[0] = X
       monster[1] = Y
       monster[2] = Object ID
========================================================= */

/* =========================================================
   VALIDATE MONSTER DESTINATION
========================================================= */

function canMonsterMoveTo(x, y) {

    if (
        x < 0 ||
        y < 0 ||
        x >= WORLD_W ||
        y >= WORLD_H
    ) {
        return false;
    }

    const block = decodeBlock(getWorldBlock(x, y)).block;

    return block === 1;
}


/* =========================================================
   WANDER MONSTER
========================================================= */

const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
];

function wanderMonster(monster) {

    if (!monster.canWander)
        return null;

    const available = [];
    const previous = [];

    for (const [dx, dy] of directions) {

        const x = monster[0] + dx;
        const y = monster[1] + dy;

        if (!canMonsterMoveTo( x, y))
            continue;

        if (
            x === monster.previousX &&
            y === monster.previousY
        ) {
            previous.push({ x, y });
        } else {
            available.push({ x, y });
        }
    }

    const choices = available.length
        ? available
        : previous;

    if (!choices.length)
        return null;

    return choices[
        Math.floor(Math.random() * choices.length)
    ];
}


/* =========================================================
   CHASE MONSTER
========================================================= */

function chaseMonster(monster, player) {

    if (!monster.canChase)
        return wanderMonster(monster);

    const dx = Math.sign(player.x - monster[0]);
    const dy = Math.sign(player.y - monster[1]);

    // Already at the player's square
    if (dx === 0 && dy === 0)
        return null;

    const directions = [];

    // First: diagonal toward player
    if (dx !== 0 && dy !== 0)
        directions.push([dx, dy]);

    // Second: vertical toward player
    if (dy !== 0)
        directions.push([0, dy]);

    // Third: horizontal toward player
    if (dx !== 0)
        directions.push([dx, 0]);

    for (const [mx, my] of directions) {

        const x = monster[0] + mx;
        const y = monster[1] + my;

        if (canMonsterMoveTo(x, y))
            return { x, y };
    }

    // No direct route: wander if permitted
    return wanderMonster(monster);
}


/* =========================================================
   SHOULD AWAKEN MONSTER

   Returns true if the monster should awaken.

   Visibility always awakens the monster immediately.

   Otherwise, awakening is probabilistic based on
   distance and the monster's hearing range.

   This function does not change monster state.
========================================================= */

function shouldAwakenMonster(monster, player, isVisible) {

    if (isVisible)
        return true;

    const dx = player.x - monster[0];
    const dy = player.y - monster[1];

    const distance = Math.hypot(dx, dy);
    const hearingRange = monster.hearingRange;

    if (hearingRange <= 0 || distance > hearingRange)
        return false;

    const chance = 1 - distance / hearingRange;

    return Math.random() < chance;
}


/* =========================================================
   DETERMINE NEXT MONSTER ACTION

   Controls monster behavior and selects its next square.

   States:
       sleeping
       wandering
       chasing

   Sleeping monsters:
       Awaken immediately when visible.
       Otherwise check hearing periodically.

   Chasing monsters:
       Continue chasing while player is visible.
       Continue chasing temporarily after losing sight.
       Return to sleeping after forgetting player.

   Returns:
       { x, y } = target square
       null     = no movement

   Does not update monster grid position.
========================================================= */

function determineNextMonsterAction(
    monster,
    player,
    isVisible,
    now = performance.now()
) {

    // -----------------------------------------
    // SLEEPING
    // -----------------------------------------

    if (monster.state === "sleeping") {

        // Visible monsters awaken immediately.
        // Hearing checks occur at fixed intervals.

        if (!isVisible) {

            if (now < monster.nextAwakenCheckTime)
                return null;

            monster.nextAwakenCheckTime =
                now + monster.awakenCheckInterval;
        }

        if (!shouldAwakenMonster(
            monster,
            player,
            isVisible
        )) {
            return null;
        }

        // Awakened by sight or hearing
        monster.state =
            isVisible && monster.canChase
                ? "chasing"
                : "wandering";
    }

    // -----------------------------------------
    // PLAYER VISIBLE
    // -----------------------------------------

    if (isVisible) {

        monster.lastSeenTime = now;

        if (monster.canChase) {

            monster.state = "chasing";

            return chaseMonster(
                monster,
                player
            );
        }

        // Monster sees player but cannot chase
        monster.state = "wandering";

        return wanderMonster(monster);
    }

    // -----------------------------------------
    // CHASING WITHOUT VISIBILITY
    // -----------------------------------------

    if (monster.state === "chasing") {

        const elapsed =
            monster.lastSeenTime === null
                ? Infinity
                : now - monster.lastSeenTime;

        if (elapsed < monster.forgetTime) {

            return chaseMonster(
                monster,
                player
            );
        }

        // Player forgotten
        monster.state = "sleeping";
        monster.lastSeenTime = null;

        monster.nextAwakenCheckTime =
            now + monster.awakenCheckInterval;

        return null;
    }

    // -----------------------------------------
    // WANDERING
    // -----------------------------------------

    if (monster.state === "wandering") {

        return wanderMonster(monster);
    }

    return null;
}


/* =========================================================
   MONSTER MOVEMENT AND BEHAVIOR

   Adds movement and behavior properties to monsters
   already placed in DUNGEON_OBJECTS.

   Controls:
       Initial behavior
       Movement speed
       Awakening
       Wandering
       Chasing
       Forgetting
========================================================= */


/* =========================================================
   MONSTER BEHAVIOR DEFINITIONS

   Speed:
       1/16 = Half player speed
       1/8  = Player speed
       1/4  = Twice player speed (maximum monster speed)

   awakenCheckInterval:
       Milliseconds between hearing-based awakening
       checks while sleeping.

   Visibility bypasses the awakening interval.
========================================================= */

const PLAYER_SPEED = 1 / 8;
const MAX_MONSTER_SPEED = 1 / 4;

const MONSTER_BEHAVIOR = {

    [OBJECT.WINGED_DRAGON]: {
        initialState: "sleeping",
        speed: 1 / 4,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 3,
        damage: 3,
        damageInterval: 250,

        visibleInDark: false,
        makesSleepingSound: true,
        makesAwakeSound: true,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.DRAGON]: {
        initialState: "sleeping",
        speed: 1 / 5,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 2,
        damage: 2,
        damageInterval: 350,

        visibleInDark: false,
        makesSleepingSound: true,
        makesAwakeSound: true,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.SNAKE]: {
        initialState: "sleeping",
        speed: 1 / 6,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 2,
        damage: 1,
        damageInterval: 500,

        visibleInDark: false,
        makesSleepingSound: true,
        makesAwakeSound: true,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.DEMON]: {
        initialState: "sleeping",
        speed: 1 / 7,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 2,
        damage: 1,
        damageInterval: 550,

        visibleInDark: false,
        makesSleepingSound: false,
        makesAwakeSound: false,
        leavesTracks: true,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.RAT]: {
        initialState: "sleeping",
        speed: 1 / 10,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 1,
        damage: 1,
        damageInterval: 1000,

        visibleInDark: false,
        makesSleepingSound: false,
        makesAwakeSound: true,
        leavesTracks: true,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.BAT]: {
        initialState: "wandering",
        speed: 1 / 12,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 1,
        damage: 0,
        damageInterval: 0,

        visibleInDark: false,
        makesSleepingSound: false,
        makesAwakeSound: true,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: true,
        invulnerable: false
    },

    [OBJECT.SPIDER]: {
        initialState: "wandering",
        speed: 1 / 14,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 1,
        damage: 0,
        damageInterval: 0,

        visibleInDark: false,
        makesSleepingSound: false,
        makesAwakeSound: false,
        leavesTracks: false,

        stealsArrows: true,
        masksSounds: false,
        invulnerable: false
    },

    [OBJECT.BLOB]: {
        initialState: "wandering",
        speed: 1 / 16,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: Infinity,
        damage: 10,
        damageInterval: 100,

        visibleInDark: true,
        makesSleepingSound: false,
        makesAwakeSound: false,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: true
    },

    default: {
        initialState: "sleeping",
        speed: 1 / 8,
        forgetTime: 10000,
        hearingRange: 10,
        awakenCheckInterval: 1000,
        canChase: true,
        canWander: true,

        health: 1,
        damage: 1,
        damageInterval: 500,

        visibleInDark: false,
        makesSleepingSound: false,
        makesAwakeSound: false,
        leavesTracks: false,

        stealsArrows: false,
        masksSounds: false,
        invulnerable: false
    }

};


/* =========================================================
   INITIALIZE MONSTER BEHAVIOR

   Call after dungeon generation has populated
   DUNGEON_OBJECTS.

   Does not change monster positions.
========================================================= */

function initializeMonsterBehavior() {

    for (const monster of DUNGEON_OBJECTS) {

        // Skip non-monster objects
        if (!isMonsterObject(monster))
            continue;

        const settings =
            MONSTER_BEHAVIOR[monster[2]] ||
            MONSTER_BEHAVIOR.default;

        monster.state = settings.initialState;

        monster.previousX = null;
        monster.previousY = null;

        monster.lastSeenTime = null;

        monster.speed = Math.min(
            MAX_MONSTER_SPEED,
            Math.max(0, settings.speed)
        );

		monster.health = settings.health;
        monster.forgetTime = settings.forgetTime;
        monster.hearingRange = settings.hearingRange;

        monster.awakenCheckInterval =
            settings.awakenCheckInterval;

        monster.nextAwakenCheckTime = 0;

        monster.canChase = settings.canChase;
        monster.canWander = settings.canWander;

        monster.offset_x = 0;
        monster.offset_y = 0;
    }
}


/* =========================================================
   UPDATE MONSTER MOVEMENT

   If moving:
       Reduce offsets toward zero.

   If stationary:
       Determine next action.
       Immediately update logical position.
       Set offsets to preserve visual position.
========================================================= */

function approachZero(value, speed) {

    if (speed <= 0)
        return value;

    if (Math.abs(value) <= speed)
        return 0;

    return value - Math.sign(value) * speed;
}

function checkMonsterPlayerDamage(
    monster,
    player,
    now = performance.now()
) {

    if (player.health <= 0) {
        player.dead = true;
        return;
    }

    if (
        player.dead || player.won ||
        monster.projectileType !== undefined ||
        monster.state === "dead"
    ) {
        return;
    }

    const settings =
        MONSTER_BEHAVIOR[monster[2]] ||
        MONSTER_BEHAVIOR.default;

    if (settings.damage <= 0)
        return;

    const monsterX = monster[0] + monster.offset_x;
    const monsterY = monster[1] + monster.offset_y;

    // Check contact with player.
    if (
        Math.abs(monsterX - player.x) >= 0.5 ||
        Math.abs(monsterY - player.y) >= 0.5
    ) {
        return;
    }

    // Damage cooldown for this monster.
    if (now < (monster.nextDamageTime ?? 0))
        return;

    monster.nextDamageTime =
        now + settings.damageInterval;

    player.health = Math.max(
        0,
        player.health - settings.damage
    );

    player.dead = player.health === 0;

	if( player.dead ){
	    playSound(SOUND.DEATH, 1);
	}
	else{
	    playSound(SOUND.SWORD, 1);
	}
}

function updateMonsterMovement(
    monster,
    player,
    isVisible,
    now = performance.now()
) {

    if (player.dead || player.won)
        return;


    // Dead monsters must not move or resume chasing.
    if (monster.state === "dead")
        return;

    const delta = 0.0001;

    // -----------------------------------------
    // OBJECT CURRENTLY MOVING
    // -----------------------------------------

    if (
        Math.abs(monster.offset_x) > delta ||
        Math.abs(monster.offset_y) > delta
    ) {

        monster.offset_x =
            approachZero(monster.offset_x, monster.speed);

        monster.offset_y =
            approachZero(monster.offset_y, monster.speed);

        // Check monster contact with player.
        checkMonsterPlayerDamage(monster, player, now);

        // -------------------------------------
        // CHECK PROJECTILE COLLISION
        // DURING MOVEMENT
        // -------------------------------------

        if (monster.projectileType !== undefined) {

            const mnstr =
                checkProjectileMonsterCollision(monster);

            if (mnstr) {

                mnstr.health -= 1;

                mnstr.state =
                    mnstr.health <= 0 ? "dead" : "chasing";

                playSound(SOUND.BOW, 1);

                removeProjectile(monster);
                return;
            }
        }

        return;
    }

    // -----------------------------------------
    // OBJECT STATIONARY
    // -----------------------------------------

    monster.offset_x = 0;
    monster.offset_y = 0;

    // Check contact even when no movement is selected.
    checkMonsterPlayerDamage(monster, player, now);

    // -----------------------------------------
    // DETERMINE NEXT ACTION
    // -----------------------------------------

    const target = monster.projectileType !== undefined
        ? determineNextProjectileAction(monster)
        : determineNextMonsterAction(
            monster,
            player,
            isVisible,
            now
        );

    if (!target)
        return;

    // A zero-speed object cannot move.
    if (monster.speed <= 0)
        return;

    const oldX = monster[0];
    const oldY = monster[1];

    // Remember previous square.
    monster.previousX = oldX;
    monster.previousY = oldY;

    // -----------------------------------------
    // UPDATE MONSTER FACING DIRECTION
    //
    // Projectiles use directions 0–7.
    // Do not overwrite projectile direction.
    // -----------------------------------------

    if (monster.projectileType === undefined) {

        if (target.x < oldX)
            monster.direction = 1;
        else if (target.x > oldX)
            monster.direction = 0;
    }

    // -----------------------------------------
    // UPDATE LOGICAL POSITION
    // -----------------------------------------

    monster[0] = target.x;
    monster[1] = target.y;

    // -----------------------------------------
    // PRESERVE PREVIOUS VISUAL POSITION
    // -----------------------------------------

    monster.offset_x = oldX - target.x;
    monster.offset_y = oldY - target.y;

    // -----------------------------------------
    // CHECK PROJECTILE COLLISION
    // AT START OF MOVEMENT
    // -----------------------------------------

    if (monster.projectileType !== undefined) {

        const mnstr =
            checkProjectileMonsterCollision(monster);

        if (mnstr) {

            mnstr.health -= 1;

            mnstr.state =
                mnstr.health <= 0 ? "dead" : "chasing";

            playSound(SOUND.BOW, 1);

            removeProjectile(monster);
            return;
        }
    }
}

