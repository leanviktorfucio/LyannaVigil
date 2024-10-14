import { SETTINGS } from "./Settings.js";

export class Canvas {
	constructor(elementId, game) {
		this.elementId = elementId;
		this.game = game;

		this.width = SETTINGS.CANVAS_WIDTH;
		this.height = SETTINGS.CANVAS_HEIGHT;

		this.milliSecondsSinceLastFrame = 0;
		this.lastTimestamp = 0;

		this.elementsToDraw = {};
		Object.entries(SETTINGS.ELEMENT_TYPES_Z_INDEX).forEach(entry => {
			const [key, zIndex] = entry;
			this.elementsToDraw[zIndex] = [];
		});

		this.interactiveDrawables = [];

		this.canvas = document.getElementById(this.elementId);
		this.init();
	}

	init() {
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.context = this.canvas.getContext("2d");
	}

	getContext(context) {return this.context;}

	getCanvas() {return this.canvas;}

	startGameAnimationLoop() {
		this.animateNextFrame(null);
	}

	animateNextFrame(timestamp) {
		if (this.lastTimestamp !== null) {
			this.milliSecondsSinceLastFrame = -(this.lastTimestamp - timestamp);
		}
		this.lastTimestamp = timestamp;

		// will draw everything in the this.ob
		this.reDrawEverythingToCanvasFromScratch();

		requestAnimationFrame(this.animateNextFrame.bind(this));
	}

	reDrawEverythingToCanvasFromScratch() {
		window.functionExecutionTime = 0;

		var timestampNow = Date.now();
		this.context.clearRect(0, 0, this.width, this.height);

		this.game.onCanvasUpdate(this.milliSecondsSinceLastFrame);
		this.game.onCanvasDraw(this.milliSecondsSinceLastFrame);

		Object.entries(this.elementsToDraw).forEach(elementTypeEntries => {
			let [elementTypeGroup, elements] = elementTypeEntries;

			this.processElements(elementTypeGroup, elements);
		});

		// remove interactive drawables
		this.interactiveDrawables.forEach(function(element, index) {
			if (element.isMarkedForDeletion()) {
				this.interactiveDrawables.splice(index, 1);
			}
		}.bind(this));

		if (window.functionExecutionTime > 1) {
			console.log(window.functionExecutionTime);
		}

		if (this.game.isDebugMode) {
			this.context.font = "20px Lucida Console";
			this.context.fillStyle = "black";
			this.context.fillText(this.milliSecondsSinceLastFrame, 0, 20);
			this.context.fillText(Date.now() - timestampNow, 0, 40);
		}
		this.context.font = "20px Lucida Console";
		this.context.fillStyle = "black";
		// this.context.fillText(this.milliSecondsSinceLastFrame, 0, 20);
		this.context.fillText(Date.now() - timestampNow, 0, this.height);
	}

	addElementToDraw(elementTypeZIndex, element) {
		this.elementsToDraw[elementTypeZIndex].push(element);
	}

	addToInteractiveDrawables(element) {
		this.interactiveDrawables.push(element);
	}

	processElements(elementTypeGroup, elements) {
		elements.forEach(function(element, index) {
			// remove marked for deletion element and continue;
			if (element.isMarkedForDeletion()) {
				elements = elements.splice(index, 1);
			}
			else
			// TODO Check to improve
			// if game is unpaused, update and draw everything else but not draw UI_PAUSED
			// if game is paused, update and draw UI_PAUSED, and just draw everything else
			if (!this.game.isGamePaused() && parseInt(elementTypeGroup) !== SETTINGS.ELEMENT_TYPES_Z_INDEX.UI_PAUSED) {
				element.update(this.milliSecondsSinceLastFrame);
				element.draw(this.context, this.milliSecondsSinceLastFrame, true);
			} else if (this.game.isGamePaused()) {
				if (parseInt(elementTypeGroup) === SETTINGS.ELEMENT_TYPES_Z_INDEX.UI_PAUSED) {
					element.update(this.milliSecondsSinceLastFrame);
				}
				element.draw(this.context, this.milliSecondsSinceLastFrame, false);
			}
		}.bind(this));
	}
}