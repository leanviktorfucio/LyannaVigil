import { InteractiveDrawable } from "./Drawable.js";

class Button extends InteractiveDrawable {
    constructor(game) {
        super(game);
    }

    onClick() {
        super.onClick();
    }

    setHover(isInHover) {
        super.setHover(isInHover);
    }

    onHover() {
        super.onHover();
    }

    resetHover() {
        super.resetHover();
    }
}

export class LevelUpButton extends Button {
    constructor(game) {
        super(game);

        this.id = "LevelUpButton";
		this.width = 113;
		this.height = 25;
		this.positionX = 10;
		this.positionY = 30;
		this.imageSpriteSource = document.getElementById("levelup");
		this.imageSpriteNumberOfFramesX = 1;
		this.imageSpriteFrameOffsetY = 1;
		this.spriteImageChangeFrequency = -1;
    }

	draw(millicanvasContext, milliSecondsSinceLastFrameSecondsSinceLastFrame) {
        super.draw(millicanvasContext, milliSecondsSinceLastFrameSecondsSinceLastFrame);
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

    onClick() {
        this.game.openPlayerClassSkillsUI();
    }
}