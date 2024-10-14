import { InteractiveDrawable } from "./Drawable.js";

export class PlayerClassDrawable extends InteractiveDrawable {
    constructor(game, playerClass, imageId, positionX, positionY, borderColorOnHover) {
        super(game);

        this.id = "PlayerClassDrawable_" + playerClass.constructor.name + "_" + Date.now();

        this.imageSpriteSource = document.getElementById(imageId);

        this.isOnHover = false;
        this.borderColorDefault = "black";
        this.borderColor = this.borderColorDefault;
        this.borderColorOnHover = borderColorOnHover;
        this.playerClass = playerClass;

        // the size of the border.
        // so total size of the draw
        this.borderSize = 5;
        this.borderPositionX = positionX;
        this.borderPositionY = positionY;
        this.borderWidth = 180;
        this.borderHeight = 400;

        // we draw the actual image based on border
        this.width = this.borderWidth - (this.borderSize * 2);
        this.height = this.borderHeight - (this.borderSize * 2);
        this.positionX = this.borderPositionX + this.borderSize;
        this.positionY = this.borderPositionY + this.borderSize;
    }

    onClick() {
        super.onClick();
        this.playerClass.onUIClick();
    }

    setHover(isInHover) {
        if (isInHover) {
            this.onHover();
        } else {
            this.resetHover();
        }
    }

    onHover() {
        this.borderColor = this.borderColorOnHover;
    }

    resetHover() {
        this.borderColor = this.borderColorDefault;
    }

    init() {
        super.init(this);
    }

    update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
        super.draw(canvasContext, milliSecondsSinceLastFrame);

        // border
        canvasContext.fillStyle = this.borderColor;
		canvasContext.fillRect(this.borderPositionX, this.borderPositionY, this.borderWidth, this.borderHeight);

        // draw the image
        super.draw(canvasContext, milliSecondsSinceLastFrame);
    }
}