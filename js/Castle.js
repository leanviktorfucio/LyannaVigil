import { Drawable } from "./Drawable.js";
import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { LivingThings } from "./LivingThings.js";
import { STATES } from "./Globals.js";

class Castle extends LivingThings {
	constructor(game) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.CASTLE;

		this.positionX = null;
		this.positionY = null;
		this.velocityX = 0;
		this.velocityY = 0;
		this.imageSpriteSource = null;
		this.imageSpriteNumberOfFramesX = 1;
		this.imageSpriteFrameOffsetY = 1;
		this.spriteImageChangeFrequency = -1; // milliseconds
		this.immuneToDamageSourceList = [];

		this.healthPointsMax = 1000;
		this.healthBarColor = SETTINGS.CASTLE_HEALTH_BAR_COLOR;
		this.healthBarHeight = SETTINGS.CASTLE_HEALTH_BAR_HEIGHT;

		this.fields = null;
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);

		this.checkCollidedWithEnemy();

		this.immuneToDamageSourceList.forEach(function(attack, index) {
			attack.cooldown -= milliSecondsSinceLastFrame;
			if (attack.cooldown <= 0) {
				attack = this.immuneToDamageSourceList.splice(index, 1);
			}
		}.bind(this));
	}

	checkCollidedWithEnemy() {
		// check collided with enemy
		this.game.canvas.elementsToDraw[SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES]
		.forEach(enemy => {
			if (Utils.isCollided(this, enemy)) { // when in ghost state, ignore) {
				this.onEnemyBumpedIntoCastle(enemy);
			}
		});
	}

	onEnemyBumpedIntoCastle(enemy) {
		// if already this Enemy is immune to this enemy, ignore
		if (this.isAlreadyImmuneToDamageSourceId(enemy.id)) {
			return;
		}

		this.addImmunityFromDamageSourceList(enemy.id, 1000);
		// this.healthPointsCurrent -= enemy.bumpDamage;

		if (this.healthPointsCurrent <= 0) {
			this.healthPointsCurrent = 0;
			this.onDeath();
		}
	}

	onHitGhostEnd() {
		this.onHitGhost = false;
	}

	onDeath() {
		this.game.onGameOver();
	}

	getFields() {
		return this.fields;
	}

	setFields(fields) {
		this.fields = fields;
	}
	
	init(castleFields) {
		this.setFields(castleFields);
        this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.MAP, this);

		super.init();
	}
}

export class Map1Castle extends Castle {
	constructor(game) {
		super(game);

		this.imageSpriteSource = document.getElementById("map1_castle");

		this.width = 128;
		this.height = 154;
	}

	init(positionX, positionY, castleFields) {
		super.init(castleFields);

		this.healthBarWidth = this.width;

		// this is the initial position of the castle on the canvas
		this.positionX = positionX;
		this.positionY = positionY;
	}
}