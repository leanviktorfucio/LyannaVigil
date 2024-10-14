import { Drawable } from "./Drawable.js";
import { CirclingFamiliarHitbox, Hitbox } from "./Hitbox.js";
import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { Map } from "./Map.js";
import { STATES } from "./Globals.js";

class Attack extends Drawable {
	constructor(game, parent) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.ATTACK;

		this.parent = parent; // this is the drawable that attacks

		this.isRelativeToPlayer = true;

		this.positionX = 500;
		this.positionY = 0;
	}

	init() {
		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.PLAYER_BULLETS_AND_SLASHES, this);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) { // will only draw the player every frame
		super.draw(canvasContext, milliSecondsSinceLastFrame);
	}

	update(milliSecondsSinceLastFrame) {
		this.positionX += this.velocityX;
		this.positionY += this.velocityY;

		if (!this.isRelativeToPlayer) {
			super.update(milliSecondsSinceLastFrame);
		}
	}

	setMovementSpeed(movementSpeed) {
		this.movementSpeed = movementSpeed;
	}
}

class MeleeAttack extends Attack {
	constructor(game, parent) {
		super(game, parent);
	}

	init() {
		super.init();
	}
}

// class RangeAttack extends Attack {
// 	constructor(game, parent) {
// 		super(game, parent);
// 	}
// }

class PlayerSlashMeleeAttack extends MeleeAttack {
	// distanceFromPlayer - distance of the image from the player
	// distanceFromPlayerHitboxOffset - distance of the hitbox from the player
	constructor(game, width, height, imageSpriteSource, distanceFromPlayer, distanceFromPlayerHitboxOffset, hitboxSize, angle, attackCooldown) {
		super(game, game.player);

		let parentCenter = this.game.player.getCenterPosition();
		this.imageSpriteNumberOfFramesX = 0;
		this.imageSpriteFrameOffsetY = 1;
		this.spriteImageChangeFrequency = -1;
		this.id = "PSMA_" + Date.now();
		this.attackLinger = 100; // remember than a frame is every .16sec
		this.attackLingerCounter = 0;
		this.isRelativeToPlayer = true;
		this.attackCooldown = attackCooldown;

		this.attackBaseDamage = null;

		// variables set from the subclass
		this.angle = angle;
		this.width = width;
		this.height = height;
		this.imageSpriteSource = document.getElementById(imageSpriteSource);

		let position = Utils.getPositionForCircularMotion(angle, parentCenter.x, parentCenter.y, distanceFromPlayer, 0);
		this.velocityX = Math.cos(this.angle);
		this.velocityY = Math.sin(this.angle);
		this.positionX = position.x - (this.width / 2) + (distanceFromPlayer * this.velocityX);
		this.positionY = position.y - (this.height / 2) + (distanceFromPlayer * this.velocityY);

		this.hitboxes = this.generateHitboxes(hitboxSize, parentCenter, this.angle, distanceFromPlayer + distanceFromPlayerHitboxOffset, this.id);
	}

	init() {
		super.init();
	}

	generateHitboxes(hitboxSize, parentCenter, angle, hitboxDistanceFromPlayer) {
		let hitboxes = [];
		const numberOfHitboxes = 7;
		const multiplierStart = -parseInt(numberOfHitboxes / 2);

		const hitboxAngleIncrement = [0, .4, .8, 1.2]; // middle is 0, next to it is 1st index, next to them is 2nd index
		const hitboxDistanceFromPlayerMiltiplierMapping = [1, .95, .90, .80] // middle is 1st index, next to it (for left and right side) is 2nd index, next to them is 3rd index, and so on
		for (let i = 0; i < numberOfHitboxes; i++) {
			const multiplier = multiplierStart + i;
			let hitboxAngleMultiplier = hitboxAngleIncrement[Math.abs(multiplier)];
			let newHitboxDistanceFromPlayer = hitboxDistanceFromPlayer * hitboxDistanceFromPlayerMiltiplierMapping[Math.abs(multiplier)];
			if (multiplier < 0) {
				hitboxAngleMultiplier = -hitboxAngleMultiplier;
			}
			const newAngle = angle + hitboxAngleMultiplier;
			
			const hitboxPosition = Utils.getPositionForCircularMotion(newAngle, parentCenter.x, parentCenter.y, newHitboxDistanceFromPlayer, 0);
			const hitboxPositionX = hitboxPosition.x - (hitboxSize / 2);
			const hitboxPositionY = hitboxPosition.y - (hitboxSize / 2);

			hitboxes.push(
				new Hitbox(
					this.game,
					this,
					hitboxPositionX,
					hitboxPositionY,
					hitboxSize,
					hitboxSize,
					SETTINGS.DRAWABLE_TYPE.ATTACK,
					"rgba(0,0,0,.1)"
				)
			);
		}

		return hitboxes;
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);
		this.attackLingerCounter += milliSecondsSinceLastFrame;

		this.hitboxes.forEach(function(hitbox, index) {
			hitbox.draw(canvasContext);
		}.bind(this));
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

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);

		if (this.attackLingerCounter >= this.attackLinger) {
			this.markForDeletion();
		} else {
			this.checkCollidedWithEnemy();
		}

		// update positions
		for (let h = 0; h < this.hitboxes.length; h++) {
			const hitbox = this.hitboxes[h];

			hitbox.positionX += this.velocityX;
			hitbox.positionY += this.velocityY;
		}

		// move along player's velocity
		this.positionX += this.game.player.velocityX;
		this.positionY += this.game.player.velocityY;
	}

	checkCollidedWithEnemy() {
		const enemies = this.game.canvas.elementsToDraw[SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES];
		for (let i = 0; i < enemies.length; i++) {
			const enemy = enemies[i];

			for (let h = 0; h < this.hitboxes.length; h++) {
				const hitbox = this.hitboxes[h];

				if (Utils.isCollided(hitbox, enemy) && !enemy.isStateActive(STATES.GHOST)) { // when in ghost state, ignore
					enemy.onHit(this.attackBaseDamage, this);
	
					break; // break loop of the hitboxes so it can continue looping throught enemies
				}
			}
		}
	}
}

export class PlayerSlashMeleeAttackLevel1 extends PlayerSlashMeleeAttack {
	constructor(game, angle, attackCooldown) {
		const width = 90;
		const height = 45;
		const imageSpriteSource = "player_PlayerSlashMeleeAttackLevel1";
		const distanceFromPlayer = 20;
		const distanceFromPlayerHitboxOffset = 20;
		const hitboxSize = 40;
		
		super(game, width, height, imageSpriteSource, distanceFromPlayer, distanceFromPlayerHitboxOffset, hitboxSize, angle, attackCooldown);

		this.attackBaseDamage = 50;
	}

	init() {
		super.init();
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

export class PlayerSlashMeleeAttackLevel2 extends PlayerSlashMeleeAttack {
	constructor(game, angle, attackCooldown) {
		const width = 180;
		const height = 90;
		const imageSpriteSource = "player_PlayerSlashMeleeAttackLevel2";
		const distanceFromPlayer = 30;
		const distanceFromPlayerHitboxOffset = 40;
		const hitboxSize = 80;
		
		super(game, width, height, imageSpriteSource, distanceFromPlayer, distanceFromPlayerHitboxOffset, hitboxSize, angle, attackCooldown);

		this.attackBaseDamage = 100;
	}

	init() {
		super.init();
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

// export class PlayerSwordAttack extends MeleeAttack {
// 	constructor(game, parent) {
// 		super(game, parent);

// 		this.width = 9;
// 		this.height = 30;
// 		this.imageSpriteSource = document.getElementById("player_sword");
// 		this.imageSpriteNumberOfFramesX = 0;
// 		this.spriteImageChangeFrequency = -1;

// 		// these variable's initial values are not needed as they are computed real-time
// 		this.centerX = 0;
// 		this.centerY = 0;
// 		this.positionX = 0;
// 		this.positionY = 0;

// 		this.spinRadius = 40;
// 		this.angle = Math.PI * 1.5; // above the player
// 		this.spinSpeedRate = 0.1; // default speed rate

// 		this.hitboxes = this.createHitboxes(this, 3);
// 	}

// 	drawImage(canvasContext) {
// 		canvasContext.save();
		
// 		let offsetY = this.height / 2;
// 		canvasContext.translate(this.positionX + (this.width / 2), this.positionY + offsetY);
// 		canvasContext.rotate(this.angle + (Math.PI / 2));
// 		canvasContext.translate(-this.width / 2, -this.height);
// 		canvasContext.drawImage(
// 			this.imageSpriteSource,
// 			this.imageSpriteFrameOffsetX, 
// 			(this.imageSpriteFrameOffsetY - 1) * this.height, // value starts from 1 instead of 0 so we minus 1
// 			this.width, this.height, 
// 			0, this.height / 2, this.width, this.height);
// 		canvasContext.restore();

// 		this.hitboxes.forEach(function(hitbox, index) {
// 			hitbox.draw(canvasContext);
// 		}.bind(this));
// 	}

// 	update() {
// 		let playerPosition = this.game.player.getCenterPosition();
// 		let centerX = playerPosition.x - (this.width / 2);
// 		let centerY = playerPosition.y - (this.height / 2);

// 		let position = Utils.getPositionForCircularMotion(this.angle, centerX, centerY, this.spinRadius, this.spinSpeedRate);
// 		this.positionX = position.x;
// 		this.positionY = position.y;
// 		this.angle = position.angle;

// 		this.hitboxes.forEach(function(hitbox) {
// 			hitbox.update();
// 		}.bind(this));

// 		// this.checkCollidedWithEnemy();
// 	}

// 	checkCollidedWithEnemy() {
// 		this.hitboxes.forEach(hitbox => {
// 			this.game.canvas.elementsToDraw[SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES].forEach(enemy => {
// 				if (Utils.isCollided(hitbox, enemy) && !enemy.isStateActive(STATES.GHOST)) { // when in ghost state, ignore
// 					enemy.onDeath();
// 				}
// 			});
// 		});
// 	}

// 	createHitboxes(parent, numberOfHitboxes) {
// 		// this will create hitboxes that has collision detection
// 		// not the drawable itself
// 		let hitboxHeight = this.height / numberOfHitboxes;
// 		let hitboxes = [];
// 		for(let i = 0; i < numberOfHitboxes; i++) {
// 			hitboxes.push(this.createHitbox(hitboxHeight, i, numberOfHitboxes, parent));
// 		}

// 		return hitboxes;
// 	}

// 	createHitbox(hitboxHeight, hitboxIndex, numberOfHitboxes, parent) {
// 		let angle = 0;
// 		let spinRadius = 0;
// 		if (this.spinRadius) {
// 			angle = Math.PI * 1.5;
// 			spinRadius = this.spinRadius + ((this.spinRadius / numberOfHitboxes - 1) * hitboxIndex) - (this.height / 3);
// 		}

// 		return new CirclingFamiliarHitbox(
// 			this.game,
// 			// these properties' initial values are not needed as they are computed real-time
// 			null,
// 			null,
// 			this.width,
// 			hitboxHeight,
// 			hitboxIndex,
// 			parent,
// 			Math.PI * 1.5, // this is the starting point and will be updated real-time
// 			spinRadius
// 		);
// 	}
// }

// export class PlayerRangeAttack extends RangeAttack {
// 	constructor(game, parent, nextStepVelocity) {
// 		super(game, parent);

// 		this.radius = 5;
// 		this.width = this.radius;
// 		this.height = this.radius;
// 		this.speed = 15;
// 		this.isRelativeToPlayer = false;

// 		let parentCenter = this.parent.getCenterPosition();

// 		this.positionX = parentCenter.x + (this.radius / 2);
// 		this.positionY = parentCenter.y + (this.radius / 2);
// 		this.velocityX = nextStepVelocity.velocityX * this.speed;
// 		this.velocityY = nextStepVelocity.velocityY * this.speed;

// 		// no need for new hitbox, just use this for collision detection
// 	}

// 	draw(canvasContext, milliSecondsSinceLastFrame) {
// 		canvasContext.beginPath();
// 		canvasContext.arc(this.positionX, this.positionY, this.radius, 0, 2 * Math.PI, false);
// 		canvasContext.fillStyle = 'gray';
// 		canvasContext.fill();
// 		canvasContext.lineWidth = 5;
// 		canvasContext.strokeStyle = '#000000';
// 		canvasContext.stroke();
// 	}

// 	update(milliSecondsSinceLastFrame) {
// 		super.update(milliSecondsSinceLastFrame);

// 		this.checkCollidedWithEnemy();
// 		this.checkCollidedWithWalls();
// 	}

// 	checkCollidedWithEnemy() {
// 		const enemies = this.game.canvas.elementsToDraw[SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES];
		
// 		for (let i = 0; i < enemies.length; i++) {
// 			const enemy = enemies[i];
// 			if (Utils.isCollided(this, enemy) && !enemy.isStateActive(STATES.GHOST)) { // when in ghost state, ignore
// 				enemy.onDeath();
// 				this.markForDeletion();
// 				break; // kill 1 enemy per shot
// 			}
// 		}
// 	}

// 	checkCollidedWithWalls() {
// 		if (Utils.isCollidedArray([this], this.game.map.hitboxes[Map.FIELDS_WALL].flat())) {
// 			this.markForDeletion();
// 		}
// 	}
// }
