import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { Drawable } from "./Drawable.js";
import { PLAYER_CLASSES, BardagulanClass } from "./PlayerClass.js";

class UIInPause extends Drawable {
	constructor(game) {
		super(game);
	}

	init() {
		
	}

	destroy() {
		this.markForDeletion();
		this.subDrawableElements.forEach(element => {
			element.markForDeletion();
		});
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);
	}
}

export class PlayerClassSelectUI extends UIInPause {
	constructor(game) {
		super(game);

		// main window size
		this.width = this.game.canvas.width;
		this.height = this.game.canvas.height;
		this.positionX = 0;
		this.positionY = 0;

		this.backgroundColor = "white";
		this.subDrawableElements = [];
	}

	init() {
		super.init();

		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.UI_PAUSED, this);

		PLAYER_CLASSES.forEach(playerClassName => {
			let playerClass = eval("new " + playerClassName + "(this.game);");
			this.subDrawableElements.push(playerClass.ui.image);
		});
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);

		this.subDrawableElements.forEach(element => {
			element.update(milliSecondsSinceLastFrame);
		});
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		// we dont want to call super.draw because this class will not draw anything except the backgrond and label
		// we draw everything else within their own class

		canvasContext.fillStyle = "yellow";
		canvasContext.fillRect(this.positionX, this.positionY, this.width, this.height);

		Utils.drawText(canvasContext, "SELECT PLAYER CLASS", 200, 25, "black", 20);

		this.subDrawableElements.forEach(element => {
			element.draw(canvasContext, milliSecondsSinceLastFrame);
		});
	}
}

export class PlayerClassSkillsUI extends UIInPause {
	constructor(game) {
		super(game);

		// main window size
		this.width = this.game.canvas.width;
		this.height = this.game.canvas.height;
		this.positionX = 0;
		this.positionY = 0;

		this.backgroundColor = "white";
		this.subDrawableElements = [];
	}

	init() {
		super.init();

		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.UI_PAUSED, this);

		console.log(this.game.player.skills);
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		canvasContext.fillStyle = "SlateBlue";
		canvasContext.fillRect(this.positionX, this.positionY, this.width, this.height);

		Utils.drawText(canvasContext, "SKILL LIST", 200, 25, "black", 20);

		this.subDrawableElements.forEach(element => {
			element.draw(canvasContext, milliSecondsSinceLastFrame);
		});
	}
}