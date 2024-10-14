class Rectangle {
	constructor(positionX, positionY, width, height, speed, color, canvasContext, move) {
		this.positionX = positionX;
		this.positionY = positionY;
		this.width = width;
		this.height = height;
		this.speed = speed;
		this.color = color;
		this.canvasContext = canvasContext;
		this.move = move;

		this.directionX = speed;
	}

	redraw() { // will redraw the whole rectangle every FPS
		this.move();
		this.canvasContext.fillStyle = this.color;
		this.canvasContext.fillRect(this.positionX, this.positionY, this.width, this.height);
	}
}