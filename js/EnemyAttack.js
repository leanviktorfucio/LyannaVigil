import { Drawable } from "./Drawable.js";
import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { Hitbox } from "./Hitbox.js";
import { STATES } from "./Globals.js";

class EnemyAttack extends Drawable {
	constructor(game, parent) {
		super(game);
		this.drawableType = SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES_BULLETS_AND_SLASHES;

		this.parent = parent;

		this.attackLinger = null; // remember than a frame is every .16sec
		this.attackLingerCounter = null;
		this.width = null;
		this.height = null;
		this.imageSpriteNumberOfFramesX = null;
		this.spriteImageChangeFrequency = null;
		this.angle = null;
		this.velocityX = null;
		this.velocityY = null;
		this.imageSpriteSource = null;
		this.distanceFromPlayer = null;
		this.distanceFromPlayerHitboxOffset = null;
		this.hitboxSize = null;
		this.damage = null;
	}

	init() {
		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES_BULLETS_AND_SLASHES, this);

		this.hitboxes = this.generateHitboxes();
	}

	update(milliSecondsSinceLastFrame) {
		this.attackLingerCounter += milliSecondsSinceLastFrame;

		if (this.attackLingerCounter >= this.attackLinger) {
			this.markForDeletion();
		} else {
			this.checkCollisionPlayer();
		}
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);

		this.hitboxes.forEach(function(hitbox, index) {
			hitbox.draw(canvasContext);
		}.bind(this));
	}

	checkCollisionPlayer() {
		const player = this.game.player;
		if (Utils.isCollided(player.hitboxes.playerHitbox, this)) {
			this.game.player.onPlayerHit(this.parent.attackDamage);
		}
	}
}

class EnemyAttackSlash extends EnemyAttack {
	constructor(game, parent) {
		super(game, parent);

		this.id = "ENEMY_SLASH_" + Date.now();
	}

	init(enemyCenter, playerCenter) {
		this.angle = Utils.getAngleFromTwoPoints(enemyCenter, playerCenter);
		this.velocityX = Math.cos(this.angle);
		this.velocityY = Math.sin(this.angle);

		let position = Utils.getPositionForCircularMotion(this.angle, enemyCenter.x, enemyCenter.y, this.distanceFromPlayer, 0);
		this.positionX = position.x - (this.width / 2) + (this.distanceFromPlayer * this.velocityX);
		this.positionY = position.y - (this.height / 2) + (this.distanceFromPlayer * this.velocityY);

		super.init();
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);
	}

	drawImage(canvasContext) {
		canvasContext.save();
		let offsetY = this.height / 2;
		canvasContext.translate(this.positionX + (this.width / 2), this.positionY + offsetY);
		canvasContext.rotate(this.angle + (Math.PI / 2));
		canvasContext.translate(-this.width / 2, -this.height);
		canvasContext.drawImage(
			this.imageSpriteSource,
			this.imageSpriteFrameOffsetX, 
			(this.imageSpriteFrameOffsetY - 1) * this.height, // value starts from 1 instead of 0 so we minus 1
			this.width, this.height, 
			0, this.height / 2, this.width, this.height);
		canvasContext.restore();
	}
}

export class EnemyCommonAttackSlash extends EnemyAttackSlash {
	constructor(game, parent) {
		super(game, parent);

		this.id = "ENEMY_BULLET_" + Date.now();

		this.angle = null;
		this.velocityX = null;
		this.velocityY = null;

		this.attackLinger = 100; // remember than a frame is every .16sec
		this.attackLingerCounter = 0;
		this.imageSpriteNumberOfFramesX = 0;
		this.spriteImageChangeFrequency = -1;
		this.distanceFromPlayer = 10;
		this.distanceFromPlayerHitboxOffset = 10;
		this.hitboxSize = 25;
		this.width = this.parent.attackWidth;
		this.height = this.parent.attackHeight;
		this.imageSpriteSource = parent.attackImageSource;
	}
	
	init(enemyCenter, playerCenter) {
		super.init(enemyCenter, playerCenter);
	}

	generateHitboxes() {
		let hitboxes = [];
		const numberOfHitboxes = 1;
		const multiplierStart = -parseInt(numberOfHitboxes / 2);
		const parentCenter = this.parent.getCenterPosition();

		const hitboxAngleIncrement = [0, .4, .8, 1.2]; // middle is 0, next to it is 1st index, next to them is 2nd index
		const hitboxDistanceFromPlayerMiltiplierMapping = [1, .95, .90, .80] // middle is 1st index, next to it (for left and right side) is 2nd index, next to them is 3rd index, and so on
		for (let i = 0; i < numberOfHitboxes; i++) {
			const multiplier = multiplierStart + i;
			let hitboxAngleMultiplier = 0;
			let newHitboxDistanceFromPlayer = this.distanceFromPlayerHitboxOffset * 1;
			if (multiplier < 0) {
				hitboxAngleMultiplier = -hitboxAngleMultiplier;
			}
			const newAngle = this.angle + hitboxAngleMultiplier;
			
			const hitboxPosition = Utils.getPositionForCircularMotion(newAngle, parentCenter.x, parentCenter.y, newHitboxDistanceFromPlayer, 0);
			const hitboxPositionX = hitboxPosition.x - (this.hitboxSize / 2);
			const hitboxPositionY = hitboxPosition.y - (this.hitboxSize / 2);

			hitboxes.push(
				new Hitbox(
					this.game,
					this,
					hitboxPositionX,
					hitboxPositionY,
					this.hitboxSize,
					this.hitboxSize,
					SETTINGS.DRAWABLE_TYPE.ATTACK,
					"rgba(0,0,0,.1)"
				)
			);
		}

		return hitboxes;
	}
}