export const STATES = {
    IDLE: 0,
    MOVING_LEFT: 1,
    MOVING_RIGHT: 2,
    MOVING_UP: 3,
    MOVING_DOWN: 4,
    ATTACKING: 5,
    CASTING_SPELL: 6,
    CHANNELING: 7,
    STUNNED: 8,
    SLOWED: 9,

    INVINCIBILITY: 10,
    GHOST: 11, // ignore all hit
}

// these enemy codes should match the enemy class
export const ENEMY_CLASS = {
    EYELET: "EyeletEnemy",
    MOUTHY: "MouthyEnemy",
    EYELEEN: "EyeleenEnemy",
    ROBEY: "RobeyEnemy"
}