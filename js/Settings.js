export const SETTINGS = {
	PLAYER_COLOR: "lightblue",
	CANVAS_WIDTH: 800,
	CANVAS_HEIGHT: 600,
	ELEMENT_TYPES_Z_INDEX: { // lower value is in the background
		MAP: 1,
		ENEMIES: 2,
		PLAYER: 3,
		ENEMIES_BULLETS_AND_SLASHES: 4,
		PLAYER_BULLETS_AND_SLASHES: 5,
		UI_PLAY: 6,
		ANNOUNCEMENT: 7,
		UI_PAUSED: 8,
	},
	DRAWABLE_TYPE: {
		PLAYER: "PLAYER",
		PREDICT_FUTURE_POSITION_HITBOX: "PREDICT_FUTURE_POSITION_HITBOX",
		ENEMY: "ENEMY",
		HITBOX_ATTACK: "HITBOX_ATTACK",
		HITBOX_WALL: "HITBOX_WALL",
		HITBOX_PLAYER_SNAP_TO_CENTER: "HITBOX_PLAYER_SNAP_TO_CENTER", // a hitbox when if the player hit, it forces his position to the center. used to center the player
		HITBOX_FLOW_FIELD: "HITBOX_FLOW_FIELD", // a hit box what tell what velocity x and y is the drawable on collision
		CASTLE: "CASTLE",
		ATTACK: "ATTACK",
		MAP: "MAP",
		UI: "UI"
	},
	ENEMY_BEHAVIOR: {
		DEFAULT: 1, // will search for castle but will attack player if nearby
		CHASE_PLAYER: 2, // will search for player and attack player always
		WALK_RANDOM_ATTACK_PLAYER: 3, // will walk around but will attack player if nearby
		WALK_RANDOM_ATTACK_WHEN_HIT: 3, // will walk around but will attack player if hit
	},
	DEFAULT_KEYBOARD_KEYS: {
		MOVE_LEFT: "KeyA", // a
		MOVE_RIGHT: "KeyD", // d
		MOVE_UP: "KeyW", // w
		MOVE_DOWN: "KeyS", // s

		SKILL_1: "KeyQ", // q
		SKILL_2: "KeyE", // e
		SKILL_3: "Space", // space
		SKILL_4: "KeyR", // r
		CASTLE_SKILL_5: "KeyF", // f

		PAUSE: 'Escape' // Esc
	},
	BAR_BACKGROUND_COLOR: "#1d1d1d",
	CASTLE_HEALTH_BAR_HEIGHT: 7,
	CASTLE_HEALTH_BAR_COLOR: "#3364fa",
	PLAYER_HEALTH_BAR_HEIGHT: 5,
	PLAYER_UI_HEALTH_BAR_HEIGHT: 10,
	PLAYER_UI_HEALTH_BAR_WIDTH: 300,
	PLAYER_HEALTH_BAR_COLOR: "#12d56f",
	PLAYER_EXPERIENCE_BAR_HEIGHT: 2,
	PLAYER_EXPERIENCE_BAR_COLOR: "#f6e300",
	ENEMY_HEALTH_BAR_HEIGHT: 3,
	ENEMY_HEALTH_BAR_COLOR: "#cd2c2c",
	WAVE_BAR_LENGTH: 100,
	WAVE_BAR_HEIGHT: 10,
	WAVE_BAR_COLOR: "#e4e4e1",
	WAVE_LEVEL_BAR_HEIGHT: 2,
	WAVE_LEVEL_BAR_COLOR: "#8d989c",
	SKILL_TYPE: {
		PASSIVE: "PASSIVE",
		ACTIVE: "ACTIVE"
	}
}

