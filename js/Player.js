import { Drawable } from "./Drawable.js";
import { Hitbox } from "./Hitbox.js";
import { Utils } from "./Utils.js";
import { STATES } from "./Globals.js";
import { SETTINGS } from "./Settings.js";
import { Map } from "./Map.js";
import { LivingThings } from "./LivingThings.js";

export class Player extends LivingThings {
	constructor(game) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.PLAYER;

		// sprite properties
		this.width = 32;
		this.height = 32;
		this.imageSpriteSource = document.getElementById("player");
		this.imageSpriteNumberOfFramesX = 3;
		this.imageSpriteFrameOffsetY = 3;
		this.spriteImageChangeFrequency = 100; // milliseconds

		// character in-game properties
		this.movementSpeed = 3; // px per frame
		this.healthPointsMax = 20;
		this.healthBarColor = SETTINGS.PLAYER_HEALTH_BAR_COLOR;
		this.healthBarHeight = SETTINGS.PLAYER_HEALTH_BAR_HEIGHT;
		this.healthBarWidth = this.width;

		this.attackCooldown = 100; // will attack every ms
		this.attackCooldownCounter = 0;
		this.weapon = null // by default, player has no weapon
		this.weaponCount = 0;
		this.onHitGhost = false;
		this.onHitGhostDuration = 2000; // when hit, this is the invulnerability
		this.enemyKillCount = 0;
		this.currentLevel = 1;
		this.experienceCurrent = 0;
		this.experienceToLevelUpList = {
			1: 20, 2: 200, 3: 300, 4: 400, 5: 500, 6: 600, 7: 700, 8: 800, 9: 900, 10: 1000,
			11: 1100, 12: 1200, 13: 1300, 14: 1400, 15: 1500, 16: 1600, 17: 1700, 18: 1800, 19: 1900, 20: 2000
		};
		this.experienceToLevelUp = this.experienceToLevelUpList[this.currentLevel];
		this.unspentSkillPoints = 0;

		// position properties
		let mapCenterPosition = this.game.map.getCenter();
		this.centerX = this.game.canvas.width / 2 - (this.width / 2); // positionX where the player is in the center
		this.centerY = this.game.canvas.height / 2 - (this.height / 2);
		this.positionX = null;
		this.positionY = null;
		this.velocityX = 0;
		this.velocityY = 0;

		// don't let this drawable go through the walls
		// need to predict one frame in the future if the play will collide to this wall
		let temporaryPlayerHitbox = new Hitbox(this.game, this, this.positionX, this.positionY, this.width, this.height, SETTINGS.DRAWABLE_TYPE.PREDICT_FUTURE_POSITION_HITBOX);

		// thin horizontal line
		// positionY and height will update realtime that why it's null
		let temporaryPlayerSnapToCenterHitboxX = new Hitbox(this.game, this, 0, null, this.game.canvas.width, null, SETTINGS.DRAWABLE_TYPE.HITBOX_PLAYER_SNAP_TO_CENTER);

		// thin vertical line
		// positionX and width will update realtime that why it's null
		let temporaryPlayerSnapToCenterHitboxY = new Hitbox(this.game, this, null, 0, null, this.game.canvas.height, SETTINGS.DRAWABLE_TYPE.HITBOX_PLAYER_SNAP_TO_CENTER);

		let playerHitbox = new Hitbox(this.game, this, this.positionX, this.positionY, this.width - 16, this.height - 10);

		this.hitboxes = {
			playerHitbox: playerHitbox,
			playerFuturePosition: temporaryPlayerHitbox,
			temporaryPlayerSnapToCenterHitboxX: temporaryPlayerSnapToCenterHitboxX,
			temporaryPlayerSnapToCenterHitboxY: temporaryPlayerSnapToCenterHitboxY
		};

		// flowField cell of Player
		this.fields = null;

		// will be set on Class Selection UI
		this.playerClass = null;
		this.skills = ["DamageUpSkill"];
	}

	init() {
		// this.positionX = positionX; // always show the player at the center of the map
		// this.positionY = positionY;

		// show the player at the center of the map
		this.positionX = this.game.canvas.width / 2 - (this.width / 2);
		this.positionY = this.game.canvas.height / 2 - (this.height / 2);
		this.hitboxes.playerHitbox.positionX = this.positionX;
		this.hitboxes.playerHitbox.positionY = this.positionY;

        this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.PLAYER, this);

		super.init();
	}

	draw(canvasContext, milliSecondsSinceLastFrame, isAnimate) {
		super.draw(canvasContext, milliSecondsSinceLastFrame, isAnimate);

		if (this.game.isDebugMode) {
			// draw hitboxes
			this.hitboxes.playerFuturePosition.draw(canvasContext, milliSecondsSinceLastFrame);
			this.hitboxes.temporaryPlayerSnapToCenterHitboxX.draw(canvasContext, milliSecondsSinceLastFrame);
			this.hitboxes.temporaryPlayerSnapToCenterHitboxY.draw(canvasContext, milliSecondsSinceLastFrame);
		}

		this.attackCooldownCounter -= milliSecondsSinceLastFrame;
		if (this.attackCooldownCounter <= 0) {
			this.attackCooldownCounter = 0;
		}
	}

	update(milliSecondsSinceLastFrame) { // will handle movements of the player
		let map = this.game.map;

		let centerPositionRelativeToMap = this.getCenterPositionRelativeToMap();
		let currentFlowField = map.getFlowFieldByPoint(centerPositionRelativeToMap, Map.FIELDS_RAW);
		this.fields = [];
		this.fields[currentFlowField.rowIndex] = [];
		this.fields[currentFlowField.rowIndex][currentFlowField.columnIndex] = currentFlowField;

		this.hitboxes.playerFuturePosition.positionX = this.positionX;
		this.hitboxes.playerFuturePosition.positionY = this.positionY;
		
		if (this.isStateActive(STATES.MOVING_LEFT)) {
			// this is for colliding to a wall
			// predict 1 frame in the future so we know that the next frame will collide to a wall
			// This is STATES.MOVING_LEFT so we make the left side of the hitbox bigger
			this.hitboxes.playerFuturePosition.positionX -= this.movementSpeed;

			// if will collide, then stop moving the player
			if (this.checkCollidedWithWalls(this.hitboxes.playerFuturePosition)) {
				this.setPlayerVelocityX(0, 0);
			} else {
				// NOTE: Everything moves relatively to the player so it looks like the player is at the center but is moving
				// The map stops moving when the canvas reaches its edge,
				// so this condition moves the actual player up to the edge of the map
				// and also re-center the player when its not in the center
				if (map.isLeftMostReached() || !this.isAtCenterHorizontally()) {
					this.setPlayerVelocityX(-this.movementSpeed, 0);
				} else {
					this.setPlayerVelocityX(0, this.movementSpeed);
				}
			}
			this.setPlayerImageOffsetYByMoveState(STATES.MOVING_LEFT);
		} 
		else if (this.isStateActive(STATES.MOVING_RIGHT)) {
			this.hitboxes.playerFuturePosition.positionX += this.movementSpeed;
			if (this.checkCollidedWithWalls(this.hitboxes.playerFuturePosition)) {
				this.setPlayerVelocityX(0, 0);
			} else {
				if (map.isRightMostReached() || !this.isAtCenterHorizontally()) {
					this.setPlayerVelocityX(this.movementSpeed, 0);
				} else {
					this.setPlayerVelocityX(0, -this.movementSpeed);
				}
			}
			this.setPlayerImageOffsetYByMoveState(STATES.MOVING_RIGHT);
		} else {
			this.setPlayerVelocityX(0, 0);
			this.removeStates([STATES.MOVING_LEFT, STATES.MOVING_RIGHT]);
		}

		if (this.isStateActive(STATES.MOVING_UP)) {
			// remember that left, right movement updates the positionX, so at this point, bring back the original value
			this.hitboxes.playerFuturePosition.positionX = this.positionX;
			this.hitboxes.playerFuturePosition.positionY -= this.movementSpeed;
			if (this.checkCollidedWithWalls(this.hitboxes.playerFuturePosition)) {
				this.setPlayerVelocityY(0, 0);
			} else {
				if (map.isTopMostReached() || !this.isAtCenterVertically()) {
					this.setPlayerVelocityY(-this.movementSpeed, 0);
				} else {
					this.setPlayerVelocityY(0, this.movementSpeed);
				}
			}
			this.setPlayerImageOffsetYByMoveState(STATES.MOVING_UP);
		} else if (this.isStateActive(STATES.MOVING_DOWN)) {
			this.hitboxes.playerFuturePosition.positionX = this.positionX;
			this.hitboxes.playerFuturePosition.positionY += this.movementSpeed;
			if (this.checkCollidedWithWalls(this.hitboxes.playerFuturePosition)) {
				this.setPlayerVelocityY(0, 0);
			} else {
				if (map.isBottomMostReached() || !this.isAtCenterVertically()) {
					this.setPlayerVelocityY(this.movementSpeed, 0);
				} else {
					this.setPlayerVelocityY(0, -this.movementSpeed);
				}
			}
			this.setPlayerImageOffsetYByMoveState(STATES.MOVING_DOWN);
		} else {
			this.setPlayerVelocityY(0, 0);
			this.removeStates([STATES.MOVING_UP, STATES.MOVING_DOWN]);
		}

		// if moving diagonally, reduce the velocity to matche the normal speed
		// this is an easy version calculating the speed percentage rate depending on the angle
		// since the player can only move in 8 directions (N,NE,E,SE,S,SW,W,NW)
		if (this.isMovingDiagonally()) {
			this.setPlayerVelocityX(this.velocityX * 0.7071, map.velocityX * 0.7071);
			this.setPlayerVelocityY(this.velocityY * 0.7071, map.velocityY * 0.7071);
		}

		// really move the player/map
		this.positionX += this.velocityX;
		this.positionY += this.velocityY;
		map.positionX += map.velocityX;
		map.positionY += map.velocityY;

		// update player hitbox
		this.hitboxes.playerHitbox.positionX = this.positionX + 8;
		this.hitboxes.playerHitbox.positionY = this.positionY + 5;

		// prevent character from going out of bounds
		if (this.positionX < 0) {
			this.positionX = 0;
		} else if (this.positionX > (this.game.canvas.width - this.width)) {
			this.positionX = (this.game.canvas.width - this.width);
		}
		if (this.positionY < 0) {
			this.positionY = 0;
		} else if (this.positionY > (this.game.canvas.height - this.height)) {
			this.positionY = (this.game.canvas.height - this.height);
		}

		// draw an invisible thin horizontal and vertical line where if the player stand on, it will center player
		let movementSpeed = this.movementSpeed;
		if (this.isMovingDiagonally()) {
			movementSpeed = movementSpeed * 0.7071;
		}

		// update horizontal line
		this.hitboxes.temporaryPlayerSnapToCenterHitboxX.positionY = this.centerY + (this.height / 2)  - movementSpeed + .01;
		this.hitboxes.temporaryPlayerSnapToCenterHitboxX.height = (movementSpeed * 2) - .02;

		// update vertical line
		this.hitboxes.temporaryPlayerSnapToCenterHitboxY.positionX = this.centerX + (this.width / 2)  - movementSpeed + .01;
		this.hitboxes.temporaryPlayerSnapToCenterHitboxY.width = (movementSpeed * 2) - .02;

		let center = this.getCenterPosition();
		// console.log(center.y, this.hitboxes.temporaryPlayerSnapToCenterHitboxX.positionY, Utils.isPointInsideADrawable(center, this.hitboxes.temporaryPlayerSnapToCenterHitboxX));
		if (Utils.isPointInsideADrawable(center, this.hitboxes.temporaryPlayerSnapToCenterHitboxX)) {
			this.positionY = this.centerY;
		}
		if (Utils.isPointInsideADrawable(center, this.hitboxes.temporaryPlayerSnapToCenterHitboxY)) {
			this.positionX = this.centerX;
		}

		// will be true if player got hit
		if (this.onHitGhost) {
			this.onHitGhostDurationTimer -= milliSecondsSinceLastFrame;
			if (this.onHitGhostDurationTimer < 0) {
				this.onHitGhostDurationTimer = 0;
				this.removeStates([STATES.GHOST]);
				this.onHitGhostEnd();
			}
		}
		
		// dont call super.draw() as it will adjust the position based on the player
		// and this is the player class and we handle the positions here
	}

	setPlayerImageOffsetYByMoveState(state) {
		if (state === STATES.MOVING_LEFT) {
			this.imageSpriteFrameOffsetY = 2;
		} else if (state === STATES.MOVING_RIGHT) {
			this.imageSpriteFrameOffsetY = 3;
		} else if (state === STATES.MOVING_UP) {
			this.imageSpriteFrameOffsetY = 4;
		} else if (state === STATES.MOVING_DOWN) {
			this.imageSpriteFrameOffsetY = 1;
		} 
	}

	// either move the map or the player
	setPlayerVelocityX(playerVelocityX, mapVelocityX) {
		let map = this.game.map;
		this.velocityX = playerVelocityX;
		map.velocityX = mapVelocityX;
	}

	setPlayerVelocityY(playerVelocityY, mapVelocityY) {
		let map = this.game.map;
		this.velocityY = playerVelocityY;
		map.velocityY = mapVelocityY;
	}

	checkCollidedWithWalls(temporaryPlayerHitbox) {
		// prevent player to go inside the wall
		for (let objectKeyRowIndex = 0; objectKeyRowIndex < Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL]).length; objectKeyRowIndex++) {
			let rowIndex = parseInt(Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL])[objectKeyRowIndex]);
			for (let objectKeyColumnIndex = 0; objectKeyColumnIndex < Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL][rowIndex]).length; objectKeyColumnIndex++) {
				let columnIndex = parseInt(Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL][rowIndex])[objectKeyColumnIndex]);
				const wallFlowField = this.game.map.getFlowField(rowIndex, columnIndex, Map.FIELDS_WALL);
				if (Utils.isCollided(temporaryPlayerHitbox, wallFlowField)) {
					return true;
				}
			}
		}

		return false;
	}

	onPlayerHit(damage) {
		// ignore if is in ghost state
		if (this.isStateActive(STATES.GHOST)) {
			return;
		}

		this.healthPointsCurrent -= damage;
		if (this.healthPointsCurrent <= 0) {
			this.healthPointsCurrent = 0;
			this.onDeath();
		}
		this.addState(STATES.GHOST);
		this.imageSpriteSource = document.getElementById("player_ghost");
		this.onHitGhost = true;
		this.onHitGhostDurationTimer = this.onHitGhostDuration;
	}

	onHitGhostEnd() {
		this.onHitGhost = false;
		this.imageSpriteSource = document.getElementById("player");
	}

	onDeath() {
		this.game.onGameOver();
	}

	onLevelUp() {
		this.currentLevel++;
		console.log('level up: ' + this.currentLevel);
		this.unspentSkillPoints++;
	}

	setWeapon(weapon) {
		this.weapon = weapon;
		this.weaponCount = 0;

		if (this.weapon) {
			this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.PLAYER_BULLETS_AND_SLASHES, this.weapon);
		}
	}

	setMovementSpeed(movementSpeed) {
		this.movementSpeed = movementSpeed;
	}

	isAtCenterHorizontally() {
		return this.positionX === this.centerX;
	}

	isAtCenterVertically() {
		return this.positionY === this.centerY;
	}

	isMovingHorizontally() {
		return this.isStateActive(STATES.MOVING_LEFT) || this.isStateActive(STATES.MOVING_RIGHT);
	}

	isMovingVertically() {
		return this.isStateActive(STATES.MOVING_UP) || this.isStateActive(STATES.MOVING_DOWN);
	}

	isMovingDiagonally() {
		return this.isMovingHorizontally() && this.isMovingVertically();
	}

	isMoving() {
		return this.isMovingHorizontally() || this.isMovingVertically();
	}

	getFields() {
		return this.fields;
	}

	addExperience(experience) {
		this.experienceToLevelUp = this.experienceToLevelUpList[this.currentLevel];
		const maxLevel = Object.keys(this.experienceToLevelUpList).length;

		this.experienceCurrent += experience;
		if (this.experienceCurrent >= this.experienceToLevelUp && this.currentLevel <= maxLevel) {
			this.experienceCurrent = 0;
			this.onLevelUp();
		}
	}

	// this should really be calling a polymorphed attack function
	attack(pointClicked) {
		// prevent attacking when in cooldown
		if (this.attackCooldownCounter !== 0) {
			return;
		}
		this.attackCooldownCounter = this.attackCooldown;

		this.playerClass.attack(pointClicked);
	}

	onPlayerClassSelected(playerClass) {
		this.playerClass = playerClass;
		// merge common skills and exclusive playerClass skills
		this.skills = this.skills.concat(playerClass.skills);
		this.game.togglePause(false); // this will destroy current UIInPause class, specifically PlayerClassSelectUI
	}
}