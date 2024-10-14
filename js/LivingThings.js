import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { STATES } from "./Globals.js";
import { Drawable } from "./Drawable.js";

export class LivingThings extends Drawable {
	constructor(game) {
		super(game);

		this.activeStates = [];
		this.immuneToDamageSourceList = null; // array of attack ids that is ignored so it does not take damage every frame for the same attack
		this.healthPointsMax = null;
		this.healthPointsCurrent = null;
		this.healthBarWidth = null;
	}

	init() {
		this.healthPointsCurrent = this.healthPointsMax;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	draw(canvasContext, milliSecondsSinceLastFrame, isAnimate) {
		super.draw(canvasContext, milliSecondsSinceLastFrame, isAnimate);

		const currentHealthBarWidth = this.calculateHealthPointsBarWidth(this.healthBarWidth);
		canvasContext.fillStyle = SETTINGS.BAR_BACKGROUND_COLOR;
		canvasContext.fillRect(this.positionX - 1, this.positionY - this.healthBarHeight - 5 - 1, this.healthBarWidth + 2, this.healthBarHeight + 2);
		canvasContext.fillStyle = this.healthBarColor;
		canvasContext.fillRect(this.positionX, this.positionY - this.healthBarHeight - 5, currentHealthBarWidth, this.healthBarHeight);
	}

	// since player has 2 bar width, we need the width as argument
	calculateHealthPointsBarWidth(maxWidth) {
		return Utils.calculateBarWidth(this.healthPointsCurrent, this.healthPointsMax, maxWidth);
	}

	addState(newState) {
		if (!this.activeStates.includes(newState)) {
			this.activeStates.push(newState);
		}
	}

	removeStates(states) {
		states.forEach(state => {
			var index = this.activeStates.indexOf(state);
			if (index !== -1) { // state exists;
				this.activeStates.splice(index, 1);
			}
		});
	}

	isStateActive(state) {
		// bring this back
		// same logic as InputHandler::isKeyActive()
		let activeStatusMovingLeftIndex = this.activeStates.indexOf(STATES.MOVING_LEFT);
		let activeStatusMovingRightIndex = this.activeStates.indexOf(STATES.MOVING_RIGHT);
		let activeStatusMovingUpIndex = this.activeStates.indexOf(STATES.MOVING_UP);
		let activeStatusMovingDownIndex = this.activeStates.indexOf(STATES.MOVING_DOWN);

		// movement key check will end in these if else block
		if (state === STATES.MOVING_LEFT) {
			return activeStatusMovingLeftIndex > activeStatusMovingRightIndex;
		} else if (state === STATES.MOVING_RIGHT) {
			return activeStatusMovingRightIndex > activeStatusMovingLeftIndex;
		}
		if (state === STATES.MOVING_UP) {
			return activeStatusMovingUpIndex > activeStatusMovingDownIndex;
		} else if (state === STATES.MOVING_DOWNDOWN) {
			return activeStatusMovingDownIndex > activeStatusMovingUpIndex;
		}

		// // if it reaches here, it is not a movement status
		return this.activeStates.includes(state);
	}

	markForDeletion() {
		this.isForDeletion = true;
	}

	isMarkedForDeletion() {
		return this.isForDeletion;
	}

	markForDeath() {
		this.isOnDeath = true;
	}

	isMarkedForDeath() {
		return this.isOnDeath;
	}

	addImmunityFromDamageSourceList(damageSourceId, damageSourceCooldown) {
		if (!this.isAlreadyImmuneToDamageSourceId(damageSourceId)) {
			this.immuneToDamageSourceList.push({
				id: damageSourceId,
				cooldown: damageSourceCooldown // cooldown will say how long this attack be in the this list
			});
		}
	}

	isAlreadyImmuneToDamageSourceId(damageSourceId) {
		for(let i = 0; i < this.immuneToDamageSourceList.length; i++) {
			const attack = this.immuneToDamageSourceList[i];

			if (attack.id === damageSourceId) {
				return true;
			}
		}

		return false;
	}
}