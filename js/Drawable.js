import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";

export class Drawable {
	constructor(game) {
		this.game = game;

		this.imageSpriteFrameOffsetX = 0;
		this.imageSpriteFrameOffsetXCounter = 0;
		this.imageSpriteFrameOffsetY = 1;
		this.lastFPSTime = 0;

		this.index = 0;
		this.deleteDrawableOutsideTheMapOffset = 200;

		this.isOnDeath = false;
		this.isForDeletion = false;
		this.hitboxes = []; // this will be assign by the child class
	}

	getCenterPosition() {
		return {
			x: this.positionX + (this.width / 2),
			y: this.positionY + (this.height / 2)
		}
	}

	getCenterPositionRelativeToMap() {
		return {
			x: this.positionX + (this.width / 2) - this.game.map.positionX,
			y: this.positionY + (this.height / 2)  - this.game.map.positionY
		}
	}

	getPositionRelativeToMap() {
		return {
			x: this.positionX  - this.game.map.positionX,
			y: this.positionY  - this.game.map.positionY
		}
	}

	draw(canvasContext, milliSecondsSinceLastFrame, isAnimate = true) { 
		this.lastFPSTime += milliSecondsSinceLastFrame;

		// if the time as above the sprimte image change frequency (in milliseconds)
		if (this.lastFPSTime > this.spriteImageChangeFrequency) {
			this.lastFPSTime = 0;

			this.imageSpriteFrameOffsetX = (this.width * this.imageSpriteFrameOffsetXCounter);

			// reset the counter so it does increment forever
			if (this.imageSpriteFrameOffsetXCounter > (this.imageSpriteNumberOfFramesX - 1)) {
				// we will normally reset the counter so it frame goes back to the first one and start iterating agin
				if (!this.isMarkedForDeath()) {
					this.imageSpriteFrameOffsetXCounter = 0;
					this.imageSpriteFrameOffsetX = 0;
				}
				// if is marked for death, then the whole death animation is now done, 
				// remove the drawable
				else {
					this.markForDeletion();
				}
			}

			// TODO unpausing does not change the sprite for a frame
			if (isAnimate) {
				this.imageSpriteFrameOffsetXCounter++;
			}
		}

		if (this.drawImage) {
			this.drawImage(canvasContext);
		} else {
			canvasContext.drawImage(
				this.imageSpriteSource,
				this.imageSpriteFrameOffsetX, 
				(this.imageSpriteFrameOffsetY - 1) * this.height, // value starts from 1 instead of 0 so we minus 1
				this.width, this.height, 
				this.positionX, this.positionY, this.width, this.height);
		}

		if (this.game.isDebugMode && this.drawableType !== SETTINGS.DRAWABLE_TYPE.MAP) {
			let strokeStyleColor = 'black';
			if ([SETTINGS.DRAWABLE_TYPE.ATTACK, SETTINGS.DRAWABLE_TYPE.CASTLE].includes(this.drawableType)) {
				strokeStyleColor = "white";
			} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.PLAYER) {
				strokeStyleColor = "Turquoise";
			} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.ENEMY) {
				strokeStyleColor = "Fuchsia";
			} else if (this.drawableType === SETTINGS.DRAWABLE_TYPE.ENEMY) {
				strokeStyleColor = "Fuchsia";
			}

			// canvasContext.strokeStyle = strokeStyleColor;
			// canvasContext.strokeRect(this.positionX, this.positionY, this.width, this.height);
		}
	}

	update(milliSecondsSinceLastFrame) {
		// remove all drawables if outside the map + offset
		let map = this.game.map;

		this.positionX += map.velocityX;
		this.positionY += map.velocityY;

		if (
			((this.positionX + this.width + this.deleteDrawableOutsideTheMapOffset) < map.positionX) || 
			((this.positionY + this.height + this.deleteDrawableOutsideTheMapOffset) < map.positionY) ||
			((this.positionX - this.width - this.deleteDrawableOutsideTheMapOffset) > map.positionX + map.width) || 
			((this.positionY - this.height - this.deleteDrawableOutsideTheMapOffset) > map.positionY + map.height)
		) {
			this.markForDeletion();
		}
	}

	updateToBeRelativeToMap() {
		// every drawable that needs to move when the map is moving
		// (when player moves around but stills in center, but the whole map is moving)
		let map = this.game.map;
		this.positionX += map.velocityX;
		this.positionY += map.velocityY;
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
}

export class InteractiveDrawable extends Drawable {
	constructor(game) {
		super(game);
	}

	onClick() {
        
    }

    setHover(isInHover) {
        
    }

    onHover() {
        
    }

    resetHover() {
        
    }

    init() {
        this.game.canvas.addToInteractiveDrawables(this);
    }
}