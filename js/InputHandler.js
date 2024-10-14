import { STATES } from "./Globals.js";
import { SETTINGS } from "./Settings.js";
import { Utils } from "./Utils.js";

export class InputHandler {
	constructor(game) {
        this.game = game;
        this.registeredKeys = Object.entries(SETTINGS.DEFAULT_KEYBOARD_KEYS).map(keyboardKey => {
			const [key, keyCode] = keyboardKey;
			return keyCode;
		});
        this.activeRegisteredKeys = SETTINGS.DEFAULT_KEYBOARD_KEYS;

        this.activeKeys = [];

        this.init();
    }

    init() {
        window.addEventListener("keydown", e => {
            if (!this.game.isGamePaused() || e.code === SETTINGS.DEFAULT_KEYBOARD_KEYS.PAUSE) {
                if (this.isKeyRegistered(e.code) && !this.isKeyAlreadyActive(e.code)) {
                    this.addToActiveKeys(e.code);
    
                    if (e.code === SETTINGS.DEFAULT_KEYBOARD_KEYS.PAUSE) {
                        this.game.togglePause();
                    }
                }
            }
        });

        window.addEventListener("keyup", e => {
            if (!this.game.isGamePaused() || e.code === SETTINGS.DEFAULT_KEYBOARD_KEYS.PAUSE) {
                if (this.isKeyRegistered(e.code) && this.isKeyAlreadyActive(e.code)) {
                    this.removeFromActiveKeys(e.code);
                }
            }
        });

        this.game.canvas.getCanvas().addEventListener("click", e => {
            const point = {
                x: e.offsetX,
                y: e.offsetY
            };

            if (!this.game.isGamePaused()) {
                this.game.player.attack(point);
            }
            
            this.game.canvas.interactiveDrawables.forEach(element => {
                if (element.onClick && Utils.isPointInsideADrawable(point, element)) {
                    element.onClick();
                }
            });
        });
        this.game.canvas.getCanvas().addEventListener("mousemove", e => {
            const point = {
                x: e.offsetX,
                y: e.offsetY
            };

            this.game.canvas.interactiveDrawables.forEach(element => {
                if (element.setHover) {
                    if (Utils.isPointInsideADrawable(point, element)) {
                        element.setHover(true);
                    } else {
                        element.setHover(false);
                    }
                }
            });
        });
    }

    addToActiveKeys(key) {
        this.activeKeys.push(key);

        let player = this.game.player;

        // set player states on movement keys
        if (key === this.activeRegisteredKeys.MOVE_LEFT) {
			player.addState(STATES.MOVING_LEFT);
        } else if (key === this.activeRegisteredKeys.MOVE_RIGHT) {
			player.addState(STATES.MOVING_RIGHT);
        } else if (key === this.activeRegisteredKeys.MOVE_UP) {
			player.addState(STATES.MOVING_UP);
        } else if (key === this.activeRegisteredKeys.MOVE_DOWN) {
			player.addState(STATES.MOVING_DOWN);
        }
    }

    removeFromActiveKeys(key) {
        this.activeKeys = this.activeKeys.filter(activeKey => {
            return activeKey !== key;
        });

        let player = this.game.player;
        
        if (key === this.activeRegisteredKeys.MOVE_LEFT) {
			player.removeStates([STATES.MOVING_LEFT]);
        } else if (key === this.activeRegisteredKeys.MOVE_RIGHT) {
			player.removeStates([STATES.MOVING_RIGHT]);
        } else if (key === this.activeRegisteredKeys.MOVE_UP) {
			player.removeStates([STATES.MOVING_UP]);
        } else if (key === this.activeRegisteredKeys.MOVE_DOWN) {
			player.removeStates([STATES.MOVING_DOWN]);
        }
    }

    isKeyRegistered(key) {
        return this.registeredKeys.includes(key);
    }

    isKeyAlreadyActive(key) {
        return this.activeKeys.includes(key);
    }

    isKeyActive(key) {
        // if the (MOVE_LEFT and MOVE_RIGHT) or (MOVE_UP and MOVE_DOWN) are both active, return true to the last key pressed.
        let activeKeyLeftIndex = this.activeKeys.indexOf(SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_LEFT);
        let activeKeyRightIndex = this.activeKeys.indexOf(SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_RIGHT);
        let activeKeyUpIndex = this.activeKeys.indexOf(SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_UP);
        let activeKeyDownIndex = this.activeKeys.indexOf(SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_DOWN);

        // movement key check will end in these if else block
        if (key === SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_LEFT) {
            return activeKeyLeftIndex > activeKeyRightIndex;
        } else if (key === SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_RIGHT) {
            return activeKeyRightIndex > activeKeyLeftIndex;
        }
        if (key === SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_UP) {
            return activeKeyUpIndex > activeKeyDownIndex;
        } else if (key === SETTINGS.DEFAULT_KEYBOARD_KEYS.MOVE_DOWN) {
            return activeKeyDownIndex > activeKeyUpIndex;
        }

        // if it reaches here, it is not a movement key
        return this.activeKeys.includes(key);
    }
}