import { SETTINGS } from "./Settings.js";
import { Game } from "./Game.js";

const FPS = 120;
const MOVING_RECTANGLE_ID = 9;
const WALL_RECTANGLE_ID = 1;

let GLOBALS = {}; // this will hold any variables that will be accessed accross the game
let objects = {};

window.onload = function() {
	setupGame();
};

function setupGame() {
	preloadImages(function() {
		let game = new Game("mainCanvas");
		game.init();
	});
}

function preloadImages(callback) {
	const assetsContainer = document.getElementById("assets");
	const images = assetsContainer.getElementsByTagName('img');
	GLOBALS.totalNumberOfImages = images.length;
	GLOBALS.totalNumberOfPreloadedImages = 0;

	for (let img of images) {
		if(img.complete) {
			onImageLoaded(callback);
		} else {
			img.addEventListener('load', function() {
				onImageLoaded(callback);
			});
		}
	}
}

function onImageLoaded(callback) {
	GLOBALS.totalNumberOfPreloadedImages++;
	if (GLOBALS.totalNumberOfPreloadedImages >= GLOBALS.totalNumberOfImages) {
		callback();
	}
}