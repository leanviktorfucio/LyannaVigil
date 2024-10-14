import { Drawable } from "./Drawable.js";
import { SETTINGS } from "./Settings.js";
import { Utils } from "./Utils.js";

export class Hitbox extends Drawable {
	constructor(game, parent, positionX, positionY, width, height, drawableType = null, color = null) {
		super(game);
		this.drawableType = drawableType;

		// initial positions are saved for walls. as they should not be changed
		this.initialPositionX = positionX;
		this.initialPositionY = positionY;

		this.game = game;
		this.parent = parent;
		this.positionX = positionX;
		this.positionY = positionY;
		this.width = width;
		this.height = height;
		this.color = color;

		this.lastPositionBeforeMovingTheMapX = null;
		this.lastPositionBeforeMovingTheMapY = null;
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		if (this.game.isDebugMode) {
			let fillStyleColor = "white";
			if (this.color === null) {
				if (this.drawableType === SETTINGS.DRAWABLE_TYPE.HITBOX_ATTACK) {
					fillStyleColor = "rgba(119, 136, 153, 1)";
				} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.HITBOX_WALL) {
					fillStyleColor = "rgba(255, 0, 0, .5)";
				} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.PREDICT_FUTURE_POSITION_HITBOX) {
					fillStyleColor = "rgba(64, 224, 208, .5)";
				} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.HITBOX_PLAYER_SNAP_TO_CENTER){
					fillStyleColor = "rgba(0, 255, 0, .5)";
				} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.ATTACK){
					fillStyleColor = "rgba(255, 0, 0, .5)";
				}
			} else {
				fillStyleColor = this.color;
			}

			canvasContext.fillStyle = fillStyleColor;
			canvasContext.fillRect(this.positionX, this.positionY, this.width, this.height);
		}
	}

	update(position) {
		this.positionX = position.x;
		this.positionY = position.y;
		// this.angle = position.angle; // will be used in sword familiar
	}
}

export class CirclingFamiliarHitbox extends Hitbox {
	constructor(game, parent, positionX, positionY, width, height, index, angle, spinRadius, color = null) {
		super(game, parent, positionX, positionY, width, height, SETTINGS.DRAWABLE_TYPE.HITBOX_ATTACK, color);
		this.index = index;
		this.angle = angle;
		this.spinRadius = spinRadius;
	}

	update() {
		const playerCenterPosition = this.game.player.getCenterPosition();
		let centerX = playerCenterPosition.x - (this.width / 2);
		let centerY = playerCenterPosition.y - (this.height / 2);

		let position = Utils.getPositionForCircularMotion(this.angle, centerX, centerY, this.spinRadius, this.parent.spinSpeedRate);
		this.positionX = position.x;
		this.positionY = position.y;
		this.angle = position.angle;
	}
}

// This is a "field"
// The whole map is partitioned into an multiple same size squares like a big tic-tac-toe and a single square is call a "field"
// a field be:
// wall - player and land enemies cannot walk through it. this does not have velocity and 
// flow - this fields contains velocityXY. which makes the enemy move while stepping on this field.
// castleField - basically a wall which cannot be walk through but is a flowable which has velocityXY
export class FieldHitbox extends Hitbox {
	constructor(game, parent, positionX, positionY, width, height, color = null) {
		super(game, parent, positionX, positionY, width, height, SETTINGS.DRAWABLE_TYPE.HITBOX_FLOW_FIELD, color)

		this.imageSpriteSource = document.getElementById("debug_arrows");
		this.imageSpriteFrameOffsetX = 1;

		this.rowIndex = null;
		this.columnIndex = null;
		this.force = null;
		this.isWall = false;
		this.isCastleField = false; // this is a type of flow field that can have flows but is not movable

		this.direction = null;
		this.flowVelocityX = null;
		this.flowVelocityY = null;

		this.imageSpriteFrameOffsetY = 2;
	}

	update(position) {
		this.lastPositionBeforeMovingTheMapX = this.positionX;
		this.lastPositionBeforeMovingTheMapY = this.positionY;
		super.update(position);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		if (this.isWall) {
			canvasContext.fillStyle = "rgba(0,0,0,.2)";
			canvasContext.fillRect(this.positionX, this.positionY, this.width, this.height);
			return;
		}

		// if (this.game.isDebugMode) {
			// draw arrows
			if (this.force !== 0 && this.force !== null) {
			// if (this.force !== null) {
				// canvasContext.drawImage(
				// 	this.imageSpriteSource,
				// 	(this.imageSpriteFrameOffsetX - 1) * this.width, 
				// 	this.imageSpriteFrameOffsetY,
				// 	this.width, this.height, 
				// 	this.positionX, this.positionY, this.width, this.height);
				
					

				// draw text rowIndex, columnIndex, direction
				const centerPoint = this.getCenterPosition();
				// canvasContext.font = "9px Lucida Console";
				// canvasContext.fillStyle  = "white";
				// canvasContext.fillText(this.rowIndex + ":" + this.columnIndex, centerPoint.x - 20, centerPoint.y + 5);
				// canvasContext.fillText(this.force, centerPoint.x - 5, centerPoint.y + 5);
				// canvasContext.fillText(this.direction, centerPoint.x, centerPoint.y + 5);
				// canvasContext.fillText(this.flowVelocityX2, centerPoint.x - 10, centerPoint.y - 5);
				// canvasContext.fillText(this.flowVelocityY2, centerPoint.x - 10, centerPoint.y + 10);
				
				// canvasContext.beginPath();
				// canvasContext.lineWidth = 5;
				// canvasContext.strokeStyle = 'black';
				// canvasContext.arc(centerPoint.x, centerPoint.y, 1, 0, 2 * Math.PI);
				// canvasContext.moveTo(centerPoint.x, centerPoint.y);
				// canvasContext.lineTo(centerPoint.x + (this.flowVelocityX * 15), centerPoint.y + (this.flowVelocityY * 15));
				// canvasContext.stroke();
				
				// canvasContext.beginPath();
				// canvasContext.lineWidth = 1;
				// canvasContext.strokeStyle = 'white';
				// canvasContext.arc(centerPoint.x, centerPoint.y, 1, 0, 2 * Math.PI);
				// canvasContext.moveTo(centerPoint.x, centerPoint.y);
				// canvasContext.lineTo(centerPoint.x + (this.flowVelocityX2 * 10), centerPoint.y + (this.flowVelocityY2 * 10));
				// canvasContext.stroke();
			}

			

			// draw a rectangle stroke so we know each flowfield boundery
			// canvasContext.strokeStyle = "white";
			// canvasContext.lineWidth = .2;
			// canvasContext.strokeRect(this.positionX, this.positionY, this.width, this.height);
		// }
	}

	setVelocityByDirection(direction) {
		this.flowVelocityX2 = Math.cos(this.angle);
		this.flowVelocityY2 = Math.sin(this.angle);

		if (direction === 'U') { // up
			this.flowVelocityX = 0;
			this.flowVelocityY = -1;
			this.imageSpriteFrameOffsetX = 1;
		} else if (direction === 'L') { // left
			this.flowVelocityX = -1;
			this.flowVelocityY = 0;
			this.imageSpriteFrameOffsetX = 4;
		} else if (direction === 'D') { // down
			this.flowVelocityX = 0;
			this.flowVelocityY = 1;
			this.imageSpriteFrameOffsetX = 3;
		} else if (direction === 'R') { // right
			this.flowVelocityX = 1;
			this.flowVelocityY = 0;
			this.imageSpriteFrameOffsetX = 2;
		} else if (direction === 'UL') { // up left
			this.flowVelocityX = -.7;
			this.flowVelocityY = -.7;
			this.imageSpriteFrameOffsetX = 8;
		} else if (direction === 'UR') { // up right
			this.flowVelocityX = .7;
			this.flowVelocityY = -.7;
			this.imageSpriteFrameOffsetX = 5;
		} else if (direction === 'DR') { // down right
			this.flowVelocityX = .7;
			this.flowVelocityY = .7;
			this.imageSpriteFrameOffsetX = 6;
		} else if (direction === 'DL') { // down left
			this.flowVelocityX = -.7;
			this.flowVelocityY = .7;
			this.imageSpriteFrameOffsetX = 7;
		} else if (direction === 'T') {
			this.flowVelocityX = 0;
			this.flowVelocityY = 0;
			this.imageSpriteFrameOffsetX = 8;
			this.flowVelocityX2 = 0;
			this.flowVelocityY2 = 0;
		}
		this.direction = direction;
	}

	isMovable() {
		return !this.isWall;
	}

	isMovableAndHasForce() {
		return !this.isWall && this.force !== null;
	}

	isThisACastleFieldAndHasForce() {
		return this.isCastleField && this.force !== null;
	}

	isThisACastleField() { // name should not same as the isCastleField
		return this.isCastleField;
	}

	hasForce() {
		return this.force !== null;
	}

	reset() {
		this.force = null;
		this.direction = null;
	}
}