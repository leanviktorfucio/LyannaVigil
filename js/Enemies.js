import { Drawable } from "./Drawable.js";
import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { Hitbox } from "./Hitbox.js";
import { Map } from "./Map.js";
import { LivingThings } from "./LivingThings.js";
import { STATES } from "./Globals.js";
import { EnemyCommonAttackSlash } from "./EnemyAttack.js";

class Enemy extends LivingThings {
	constructor(game) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.ENEMY;

		this.positionX = 500;
		this.positionY = 0;
		this.velocityX = 0;
		this.velocityY = 0;
		this.id = "ENEMY_" + Date.now();
		this.healthBarColor = SETTINGS.ENEMY_HEALTH_BAR_COLOR;
		this.healthBarHeight = SETTINGS.ENEMY_HEALTH_BAR_HEIGHT;

		// will be assigned by the subclass
		this.movementSpeed = null;
		this.healthPointsMax = null;
		this.experience = null;
		this.attackDamage = null;
		this.targetHitbox = null;
		this.attackImageSource = null;
		this.attackWidth = null;
		this.attackHeight = null;
		this.attackCooldown = null;
		this.attackCooldownCounter = null;

		this.hitboxes = {
			temporaryEnemyHitboxX: null,
			temporaryEnemyHitboxY: null,
		}
	}

	init(waveCurrentLevel) {
		this.healthBarWidth = this.width;

		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES, this);

		this.healthPointsMax *= waveCurrentLevel;

		super.init();
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);

		// Note: an enemy should not take a damage per fps while the attack collides with this Enemy
		// so we store the attack id and ignore it for a specific time
		this.immuneToDamageSourceList.forEach(function(attack, index) {
			attack.cooldown -= milliSecondsSinceLastFrame;
			if (attack.cooldown <= 0) {
				attack = this.immuneToDamageSourceList.splice(index, 1);
			}
		}.bind(this));

		// update attack cooldown
		this.attackCooldownCounter -= milliSecondsSinceLastFrame;
		if (this.attackCooldownCounter <= 0) {
			this.attackCooldownCounter = 0;
		}
	}

	draw(canvasContext, milliSecondsSinceLastFrame, isAnimate) { // will only draw the player every frame
		super.draw(canvasContext, milliSecondsSinceLastFrame, isAnimate);

		// canvasContext.strokeStyle = "black";
		// canvasContext.strokeRect(this.positionX, this.positionY, this.width, this.height);
	}

	onHit(damageTaken, attack) { // attack - any offensive attack or skill (as class) from player
		// if already this Enemy is immune to this attack, ignore
		if (this.isAlreadyImmuneToDamageSourceId(attack.id)) {
			return;
		}

		this.addImmunityFromDamageSourceList(attack.id, attack.attackCooldown);
		this.healthPointsCurrent -= damageTaken;

		if (this.healthPointsCurrent <= 0) {
			this.healthPointsCurrent = 0;
			this.onDeath();
			this.game.player.addExperience(this.experience);
		}
	}

	setMovementSpeed(movementSpeed) {
		this.movementSpeed = movementSpeed;
	}

	changeSpriteToWhereItFacesTowardsX(velocityX) {
		// if (this.isMarkedForDeath()) { // if doing the death animation, always make the sprite frame offset of y as 1 because the death sprite does not have second y yet
		// 	this.imageSpriteFrameOffsetY = 1;
		// } else 
		if (velocityX > 0) {
			// faces right
			this.imageSpriteFrameOffsetY = 1;
		} else {
			// faces left
			this.imageSpriteFrameOffsetY = 2;
		}
	}

	attackAttempt() { // before actually attacking, all conditions must be fulfilled
		if (this.attackCooldownCounter === 0) {
			this.attackCooldownCounter = this.attackCooldown;
			this.attack();
		}
	}

	attack() {
		const enemyAttackSlash = new EnemyCommonAttackSlash(this.game, this);

		const target = this.targetHitbox;
		const targetCenter = target.getCenterPosition();
		const enemyCenter = this.getCenterPosition();

		enemyAttackSlash.init(enemyCenter, targetCenter);
	}

	// this is the whole logic of EnemyChaseAPoint movement
	// but this lives here because even EnemyFollowsFlowFields movement will use this if the enemy can see the player
	moveToTargetDirectly() {
		// calculate the next step (velocity x and y) towards the player
		const centerPoint = this.getCenterPositionRelativeToMap();
		let destinationCenterPosition = this.targetHitbox.getCenterPositionRelativeToMap();
		let nextStep = Utils.findNextStepVelocityToTheDestination(centerPoint, destinationCenterPosition);
		nextStep = {
			velocityX: nextStep.velocityX * this.movementSpeed,
			velocityY: nextStep.velocityY * this.movementSpeed,
		}
		
		// if collides to the user, attack
		if (Utils.isCollided(this, this.targetHitbox)) {
			this.attackAttempt();
		} else { // else continue moving directly to the target
			this.positionX += nextStep.velocityX * this.movementSpeed;
			this.positionY += nextStep.velocityY * this.movementSpeed;
		}

		// switch to sprite the faces left or right depending on the next positionX
		this.changeSpriteToWhereItFacesTowardsX(nextStep.velocityX);
	}
}

/**********************/
/** Behavior Classes **/
/**********************/
// Enemy classes should extend to this to move the enemies

// this class follows the flow fields which will be used for chasing a field and considering the walls
// mainly used by land enemies so it's obstructed by walls
class EnemyFollowsFlowFields extends Enemy {
	constructor(game) {
		super(game);

		// index flow field types from Map class
		this.flowFieldTypeToChaseIndex = null;

		// this is the flowfield this Enemy is currently stepping on
		this.currentFlowField = null;

		// this is the current direction the current flow field has.
		// this will be used to check if the current flow field has updated its direction
		this.currentDirection = null;

		this.searchLineHitboxes = [];
	}

	update(milliSecondsSinceLastFrame) {
		// if collided with target and not marked for death, then attack
		if(Utils.isCollided(this, this.targetHitbox) && !this.isMarkedForDeath()) {
			this.attackAttempt();
			super.update(milliSecondsSinceLastFrame);
			return;
		}

		// use the flow fields to get the velocity
		let centerPosition = this.getCenterPositionRelativeToMap();
		const currentFlowField = this.game.map.getFlowFieldByPoint(centerPosition, this.flowFieldTypeToChaseIndex);

		if (this.currentFlowField !== null) {
			const currentFlowFieldNow = this.game.map.getFlowField(this.currentFlowField.rowIndex, this.currentFlowField.columnIndex, this.flowFieldTypeToChaseIndex);
			if (
				currentFlowFieldNow.direction !== this.currentFlowField.direction || // change the this.currentFlowField since the flowfield this enemy is stepping on has changed it's velocity/direction
				!Utils.isCollided(this, this.currentFlowField) // change only if this Enemy moved all the way out of currentflowfield
			) {
				this.currentFlowField = currentFlowField;
			}
		} else {
			// set initial value
			this.currentFlowField = currentFlowField;
		}

		this.currentDirection = this.currentFlowField.direction;

		// we only want to move if this Enemy is stepping on a set flow field and does not hit the player
		// no need to check if it will hit the player. if chasing the castle, then enemy should walk through the player
		if (this.currentFlowField.isMovableAndHasForce() && !this.isMarkedForDeath()) {
			// there's a weird behaviour here where the enemies always goes to the corner of the flow field
			// we need to stop the velocity if the enemy collides with the player's hitbox
			const nextStep = {
				velocityX: this.movementSpeed * this.currentFlowField.flowVelocityX,
				velocityY: this.movementSpeed * this.currentFlowField.flowVelocityY
			};

			const willNextStepCollide = this.checkIfNextStepCollides(nextStep);

			var priorityVelocityX = null;
			var priorityVelocityY = null;
			var velocityX = null;
			var velocityY = null;

			// TODO Somehow the enemy sometimes get stuck
			// if for some reason this Enemy is stuck, ...
			if (willNextStepCollide.x && willNextStepCollide.y) {

			}

			// ignore movement in X
			if (!willNextStepCollide.x) {
				velocityX = nextStep.velocityX;
			} else if (!willNextStepCollide.y) {
				// there will be a spot where this Enemy will try to move left or right but a part of it is blocked by a wall
				// in this case, we force to move this Enemy vertically only if its not blocked vertically
				let forcedVelocityY = this.movementSpeed;

				// if next step velocity is available
				// (if the current flow field is has the vertical direction - UL, UR, DL, DR)
				// then move it vertically but since it is not a diagonal direction, velocity should not apply the next step speed rate
				// basically ignoring L in UL and move it U
				if (nextStep.velocityY !== 0) {
					// check if the next step velocity is negative so make the velocity negative as well
					if (nextStep.velocityY < 0) {
						forcedVelocityY = -forcedVelocityY;
					}
				}
				// in this case the direction of the current flow field is just L or R so we manually make it U or D
				// (if part of this Enemy is blocked by a wall and current flow field is L or R)
				// so move this Enemy vertically to the flow field the L or R is next to
				else {
					// at this point we know that this Enemy is in L or R flow field.
					// we also know that left flow field of this current flow field is movable - lets call it MovableFF (same logic as R)
					// but we should know where is the wall flow field (WallFF) so we can move away. is it above or below of this Enemy.
					// if WallFF is above then we move away and go down, vice versa
					if (this.positionY < willNextStepCollide.wallCollidedToX.positionY) {
						// it is above, move up
						forcedVelocityY = -forcedVelocityY;
					} else {
						forcedVelocityY = forcedVelocityY;
					}
				}
				
				// this should be the priority velocity and ignore the changing velocity Y again
				priorityVelocityY = forcedVelocityY;
			}

			// ignore movement in y
			if (!willNextStepCollide.y) {
				velocityY = nextStep.velocityY;
			} else if (!willNextStepCollide.x) {
				let forcedVelocityX = this.movementSpeed;
				if (nextStep.velocityX !== 0) {
					if (nextStep.velocityX < 0) {
						forcedVelocityX = -forcedVelocityX;
					}
				} else {
					if (this.positionX < willNextStepCollide.wallCollidedToY.positionX) {
						forcedVelocityX = -forcedVelocityX;
					} else {
						forcedVelocityX = forcedVelocityX;
					}
				}

				// this should be the priority velocity and ignore the first velocity X
				priorityVelocityX = forcedVelocityX;
			}

			// the big logic above applies the may velocity twice so we just update it once and use the priority
			if (priorityVelocityX !== null) {
				this.positionX += priorityVelocityX;
			} else if (velocityX !== null) {
				this.positionX += velocityX;
			}

			if (priorityVelocityY !== null) {
				this.positionY += priorityVelocityY;
			} else if (velocityY !== null) {
				this.positionY += velocityY;
			}

			this.changeSpriteToWhereItFacesTowardsX(nextStep.velocityX);
		}

		super.update(milliSecondsSinceLastFrame);
	}

	draw(canvasContext, milliSecondsSinceLastFrame, isAnimate) {
		super.draw(canvasContext, milliSecondsSinceLastFrame, isAnimate);

		this.searchLineHitboxes.forEach(function(hitbox, index) {
			hitbox.draw(canvasContext);
		}.bind(this));
	}

	isEnemyCanSeeTheTarget() {
		// draw a line from the same size as this Enemy every n pixels (it doesnt have to be every pixel) from this Enemy to the Player and check if the line hits a wall
		this.searchLineHitboxes = [];
		const nextStep = Utils.findNextStepVelocityToTheDestination(this.getCenterPosition(), this.targetHitbox.getCenterPosition());
		let nextHitboxPixelMultiplier = 0;
		while(true) {
			const positionXStart = this.positionX + (nextStep.velocityX * (nextHitboxPixelMultiplier));
			const positionYStart = this.positionY + (nextStep.velocityY * (nextHitboxPixelMultiplier));
			const singleHitboxForTheLine = new Hitbox(
				this.game,
				this,
				positionXStart,
				positionYStart,
				this.width,
				this.height,
				null,
				"red"
			);

			this.searchLineHitboxes.push(singleHitboxForTheLine);

			// if the search line found a wall stop drawing another hitbox
			if (Utils.isCollidedArray([singleHitboxForTheLine], this.game.map.hitboxes[Map.FIELDS_WALL].flat())) {
				break;
			}

			// if the search line found the player stop drawing another hitbox
			if (Utils.isCollided(this.targetHitbox, singleHitboxForTheLine)) {
				return true;
			}

			// it doesnt need to be incrementing by 1
			// we draw another hitbox every n pixels
			nextHitboxPixelMultiplier += 50;
		}

		return false;
	}

	checkIfNextStepCollides(nextStep) {
		// don't let this drawable go through the walls
		// need to predict one frame in the future if the play will collide to this wall
		this.hitboxes.temporaryEnemyHitboxX = new Hitbox(
			this.game,
			this,
			this.positionX + this.movementSpeed * nextStep.velocityX,
			this.positionY,
			this.width,
			this.height,
			SETTINGS.DRAWABLE_TYPE.PREDICT_FUTURE_POSITION_HITBOX,
			"rgba(255, 255, 255, .5)"
		);

		this.hitboxes.temporaryEnemyHitboxY = new Hitbox(
			this.game,
			this,
			this.positionX,
			this.positionY + this.movementSpeed * nextStep.velocityY,
			this.width,
			this.height,
			SETTINGS.DRAWABLE_TYPE.PREDICT_FUTURE_POSITION_HITBOX,
			"rgba(0, 0, 0, .5)"
		);

		// check if this Enemy will collide to a wall in the next fps
		// to do that we create a temporary hitbox for both x and y to be the "future" Enemy
		// if one of these temporary hitbox collide, we ignore updating the position.
		let isTemporaryEnemyHitboxXCollideToAWall = false;
		let isTemporaryEnemyHitboxYCollideToAWall = false;
		let wallCollidedToX = null;
		let wallCollidedToY = null;
		let isBreak = false;

		// instead of doing different set of loops for both x and y checks,
		// just do both checks in 1 set of loops
		for (let objectKeyRowIndex = 0; objectKeyRowIndex < Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL]).length; objectKeyRowIndex++) {
			let rowIndex = parseInt(Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL])[objectKeyRowIndex]);
			for (let objectKeyColumnIndex = 0; objectKeyColumnIndex < Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL][rowIndex]).length; objectKeyColumnIndex++) {
				let columnIndex = parseInt(Object.keys(this.game.map.hitboxes[Map.FIELDS_WALL][rowIndex])[objectKeyColumnIndex]);
				const flowField = this.game.map.getFlowField(rowIndex, columnIndex, Map.FIELDS_RAW);

				// there is a problem here where the hitboxes' positionXY in the Map class gets updated first
				// (especially when the map is moving and the hitboxes position were updated)
				// before this Enemy class and it makes the flow field collide since this movement logic is in this Enemy class. 
				// so we use this class variable for checking the collision
				const temporaryWallFieldHitbox = new Hitbox(
					this.game,
					this,
					flowField.lastPositionBeforeMovingTheMapX,
					flowField.lastPositionBeforeMovingTheMapY,
					flowField.width,
					flowField.height,
					SETTINGS.DRAWABLE_TYPE.PREDICT_FUTURE_POSITION_HITBOX
				);

				// check if a wall collides to the temporary hitbox X. but ignore collision check once it collided. still continue because Y still need to search
				if (!isTemporaryEnemyHitboxXCollideToAWall && (Utils.isCollided(this.hitboxes.temporaryEnemyHitboxX, temporaryWallFieldHitbox))) {
					isTemporaryEnemyHitboxXCollideToAWall = true;
					wallCollidedToX = flowField;
				}

				// check if a wall collides to the temporary hitbox Y. but ignore collision check once it collided. still continue because X still need to search
				if (!isTemporaryEnemyHitboxYCollideToAWall && Utils.isCollided(this.hitboxes.temporaryEnemyHitboxY, temporaryWallFieldHitbox)) {
					isTemporaryEnemyHitboxYCollideToAWall = true;
					wallCollidedToY = flowField;
				}

				// if both has collided, no need to continue the loops. break them
				if (isTemporaryEnemyHitboxXCollideToAWall && isTemporaryEnemyHitboxYCollideToAWall) {
					isBreak = true;
					break;
				}
			}

			if (isBreak) {
				break;
			}
		}

		return {
			x: isTemporaryEnemyHitboxXCollideToAWall,
			y: isTemporaryEnemyHitboxYCollideToAWall,
			wallCollidedToX: wallCollidedToX,
			wallCollidedToY: wallCollidedToY
		};
	}
}

class EnemyChaseCastleUsingFlowFields extends EnemyFollowsFlowFields {
	constructor(game) {
		super(game);

		this.flowFieldTypeToChaseIndex = Map.FIELDS_FLOW_CASTLE;
		this.targetHitbox = this.game.map.castle;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

class EnemyChasePlayerUsingFlowFields extends EnemyFollowsFlowFields {
	constructor(game) {
		super(game);

		this.flowFieldTypeToChaseIndex = Map.FIELDS_FLOW_PLAYER;
		this.targetHitbox = this.game.player.hitboxes.playerHitbox;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

// this class follows a point in the canvas which will be used for chasing a point unobstructed
// mainly used by flying enemies so it's not obstructed by walls
class EnemyChaseAPoint extends Enemy {
	constructor(game) {
		super(game);

		this.targetHitbox = null;
	}

	update(milliSecondsSinceLastFrame) {
		// do not update positions if enemy collided with the drawable
		if(!Utils.isCollided(this, this.targetHitbox) && !this.isMarkedForDeath()) {
			this.moveToTargetDirectly();
		} else {
			this.attackAttempt();
		}

		// in Drawable::update(), it adds the map's velocity X and Y
		// so it creates an illusion that all drawables are moving around the player
		super.update(milliSecondsSinceLastFrame);
	}
}

class EnemyChaseCastle extends EnemyChaseAPoint {
	constructor(game) {
		super(game);

		this.targetHitbox = this.game.map.castle;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

class EnemyChasePlayer extends EnemyChaseAPoint {
	constructor(game) {
		super(game);

		this.targetHitbox = this.game.player.hitboxes.playerHitbox;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}
}

export class EyeletEnemy extends EnemyChasePlayer {
	constructor(game, positionX, positionY) {
		super(game);

		this.width = 40;
		this.height = 32;
		this.imageSpriteSource = document.getElementById("eyelet_walk");
		this.imageSpriteNumberOfFramesX = 5;
		this.spriteImageChangeFrequency = 100; // milliseconds
		this.movementSpeed = 1;
		this.movementStyle = SETTINGS.ENEMY_BEHAVIOR.DEFAULT;
		this.healthPointsMax = 100;
		this.immuneToDamageSourceList = [];
		this.experience = 1;
		this.attackDamage = 1;

		this.positionX = positionX;
		this.positionY = positionY;
		this.velocityX = 0;
		this.velocityY = 0;

		this.attackImageSource = document.getElementById("eyelet_attack");
		this.attackWidth = 10;
		this.attackHeight = 15;
		this.attackCooldown = 1000;
		this.attackCooldownCounter = 0;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	onDeath() {
		this.markForDeath();
		this.addState(STATES.GHOST);

		this.velocityX = 0;
		this.velocityY = 0;
		
		this.imageSpriteSource = document.getElementById("eyelet_death");
		this.imageSpriteNumberOfFramesX = 5;
		this.spriteImageChangeFrequency = 50; // milliseconds
		
		this.imageSpriteFrameOffsetXCounter = 0;
		this.imageSpriteFrameOffsetX = 0;
	}
}

export class MouthyEnemy extends EnemyChasePlayerUsingFlowFields {
	constructor(game, positionX, positionY) {
		super(game);

		this.width = 40;
		this.height = 32;
		this.imageSpriteSource = document.getElementById("mouthy_walk");
		this.imageSpriteNumberOfFramesX = 3;
		this.spriteImageChangeFrequency = 100; // milliseconds
		this.movementSpeed = 1;
		this.movementStyle = SETTINGS.ENEMY_BEHAVIOR.DEFAULT;
		this.healthPointsMax = 100;
		this.immuneToDamageSourceList = [];
		this.experience = 1;
		this.attackDamage = 1;

		this.positionX = positionX;
		this.positionY = positionY;
		this.velocityX = 0;
		this.velocityY = 0;

		this.attackImageSource = document.getElementById("mouthy_attack");
		this.attackWidth = 15;
		this.attackHeight = 17;
		this.attackCooldown = 1000;
		this.attackCooldownCounter = 0;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	onDeath() {
		this.markForDeath();
		this.addState(STATES.GHOST);

		this.velocityX = 0;
		this.velocityY = 0;
		
		this.imageSpriteSource = document.getElementById("mouthy_death");
		this.imageSpriteNumberOfFramesX = 5;
		this.spriteImageChangeFrequency = 50; // milliseconds
		
		this.imageSpriteFrameOffsetXCounter = 0;
		this.imageSpriteFrameOffsetX = 0;
	}
}

export class EyeleenEnemy extends EnemyChasePlayer {
	constructor(game, positionX, positionY) {
		super(game);

		this.width = 32;
		this.height = 18;
		this.imageSpriteSource = document.getElementById("eyeleen_walk");
		this.imageSpriteNumberOfFramesX = 5;
		this.spriteImageChangeFrequency = 100; // milliseconds
		this.movementSpeed = 1;
		this.movementStyle = SETTINGS.ENEMY_BEHAVIOR.DEFAULT;
		this.healthPointsMax = 100;
		this.immuneToDamageSourceList = [];
		this.experience = 1;
		this.attackDamage = 1;

		this.positionX = positionX;
		this.positionY = positionY;
		this.velocityX = 0;
		this.velocityY = 0;

		this.attackImageSource = document.getElementById("eyeleen_attack");
		this.attackWidth = 15;
		this.attackHeight = 17;
		this.attackCooldown = 1000;
		this.attackCooldownCounter = 0;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	onDeath() {
		this.markForDeath();
		this.addState(STATES.GHOST);

		this.velocityX = 0;
		this.velocityY = 0;
		
		this.imageSpriteSource = document.getElementById("eyeleen_death");
		this.imageSpriteNumberOfFramesX = 8;
		this.spriteImageChangeFrequency = 50; // milliseconds
		
		this.imageSpriteFrameOffsetXCounter = 0;
		this.imageSpriteFrameOffsetX = 0;
	}
}

export class RobeyEnemy extends EnemyChasePlayer {
	constructor(game, positionX, positionY) {
		super(game);

		this.width = 26;
		this.height = 40;
		this.imageSpriteSource = document.getElementById("robey_walk");
		this.imageSpriteNumberOfFramesX = 3;
		this.spriteImageChangeFrequency = 100; // milliseconds
		this.movementSpeed = 1;
		this.movementStyle = SETTINGS.ENEMY_BEHAVIOR.DEFAULT;
		this.healthPointsMax = 100;
		this.immuneToDamageSourceList = [];
		this.experience = 1;
		this.attackDamage = 1;

		this.positionX = positionX;
		this.positionY = positionY;
		this.velocityX = 0;
		this.velocityY = 0;

		this.attackImageSource = document.getElementById("robey_attack");
		this.attackWidth = 12;
		this.attackHeight = 17;
		this.attackCooldown = 1000;
		this.attackCooldownCounter = 0;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	onDeath() {
		this.markForDeath();
		this.addState(STATES.GHOST);

		this.velocityX = 0;
		this.velocityY = 0;
		
		this.imageSpriteSource = document.getElementById("robey_death");
		this.imageSpriteNumberOfFramesX = 5;
		this.spriteImageChangeFrequency = 100; // milliseconds
		
		this.imageSpriteFrameOffsetXCounter = 0;
		this.imageSpriteFrameOffsetX = 0;
	}
}