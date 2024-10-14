import { Utils } from "./Utils.js";
import { SETTINGS } from "./Settings.js";
import { STATES } from "./Globals.js";
import { Drawable } from "./Drawable.js";
import { LevelUpButton } from "./Button.js";

class UI extends Drawable {
	constructor(game) {
		super(game);
		this.drawableType = null;
	}

	init() {
        
	}

	update(milliSecondsSinceLastFrame) {
        super.update(milliSecondsSinceLastFrame);
	}

	draw(millicanvasContext, milliSecondsSinceLastFrameSecondsSinceLastFrame) {
        super.update(millicanvasContext, milliSecondsSinceLastFrameSecondsSinceLastFrame);
	}
}

export class UIInPlay extends UI {
	constructor(game) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.UI;

		this.subElements = [];
		
		this.levelUpButton = new LevelUpButton(this.game);
		this.levelUpButton.init();
	}

	init() {
		super.init();
        this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.UI_PLAY, this);
	}

	update(milliSecondsSinceLastFrame) {
		super.update(milliSecondsSinceLastFrame);

		this.subElements.forEach(element => {
			element.update(milliSecondsSinceLastFrame);
		});
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);
		this.drawPlayerUI(canvasContext, milliSecondsSinceLastFrame);
		this.drawWaveUI(canvasContext, milliSecondsSinceLastFrame);

		if (this.game.player.unspentSkillPoints > 0) {
			this.drawLevelUpButton(canvasContext, milliSecondsSinceLastFrame);
		}

		if (this.game.isGamePaused()) {
			const canvas = this.game.canvas;
			Utils.drawText(canvasContext, "Paused", (canvas.width / 2) - 50, (canvas.height) / 2 - 20, "black", 50);
		}

		this.subElements.forEach(element => {
			element.draw(canvasContext, milliSecondsSinceLastFrame);
		});
	}

	drawPlayerUI(canvasContext, milliSecondsSinceLastFrame) {
		const player = this.game.player;
		this.drawPlayerHealthBar(canvasContext, milliSecondsSinceLastFrame, player);
		this.drawPlayerLevel(canvasContext, milliSecondsSinceLastFrame, player);
		this.drawPlayerExperience(canvasContext, milliSecondsSinceLastFrame, player);
	}

	drawPlayerHealthBar(canvasContext, milliSecondsSinceLastFrame, player) {
		const healthBarPositionX = 40;
		const healthBarPositionY = 5;
		const healthBarBackgroundPadding = 1;
		const healthBarWidth = player.calculateHealthPointsBarWidth(SETTINGS.PLAYER_UI_HEALTH_BAR_WIDTH);

		canvasContext.fillStyle = SETTINGS.BAR_BACKGROUND_COLOR;
		canvasContext.fillRect(healthBarPositionX - healthBarBackgroundPadding, healthBarPositionY - healthBarBackgroundPadding, SETTINGS.PLAYER_UI_HEALTH_BAR_WIDTH + (healthBarBackgroundPadding * 2), SETTINGS.PLAYER_UI_HEALTH_BAR_HEIGHT + (healthBarBackgroundPadding * 2));
		canvasContext.fillStyle = player.healthBarColor;
		canvasContext.fillRect(healthBarPositionX, healthBarPositionY, healthBarWidth, SETTINGS.PLAYER_UI_HEALTH_BAR_HEIGHT);
	}

	drawPlayerLevel(canvasContext, milliSecondsSinceLastFrame, player) {
		canvasContext.font = "20px Lucida Console";
		canvasContext.fillStyle = "black";
		canvasContext.fillText(player.currentLevel, 15, 20);
	}

	drawPlayerExperience(canvasContext, milliSecondsSinceLastFrame, player) {
		const experienceBarPositionX = 40;
		const experienceBarPositionY = 17;
		const experienceBarBackgroundPadding = 1;
		const experienceMaxBarWidth = SETTINGS.PLAYER_UI_HEALTH_BAR_WIDTH;
		const experienceWidth = Utils.calculateBarWidth(player.experienceCurrent, player.experienceToLevelUp, experienceMaxBarWidth);
		const experienceBarHeight = SETTINGS.PLAYER_EXPERIENCE_BAR_HEIGHT;

		canvasContext.fillStyle = SETTINGS.BAR_BACKGROUND_COLOR;
		canvasContext.fillRect(experienceBarPositionX - experienceBarBackgroundPadding, experienceBarPositionY - experienceBarBackgroundPadding, experienceMaxBarWidth + (experienceBarBackgroundPadding * 2), experienceBarHeight + (experienceBarBackgroundPadding * 2));
		canvasContext.fillStyle = SETTINGS.PLAYER_EXPERIENCE_BAR_COLOR;
		canvasContext.fillRect(experienceBarPositionX, experienceBarPositionY, experienceWidth, experienceBarHeight);
	}

	drawWaveUI(canvasContext, milliSecondsSinceLastFrame) {
		const canvas = this.game.canvas;
		const map = this.game.map;
		if (!map.isLastWave()) {
			this.drawWaveInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas);
			this.drawNextWaveInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas);
			this.drawNextWaveLevelInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas);
		}
	}

	drawWaveInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas) {
		const nextWaveLevelBarWidth = SETTINGS.WAVE_BAR_LENGTH;
		const waveLevelPositionX = canvas.width - nextWaveLevelBarWidth - 120;
		const waveLevelPositionY = 18;

		canvasContext.font = "20px Lucida Console";
		canvasContext.fillStyle = "black";
		canvasContext.fillText("Level: " + map.waveCurrentLevel, waveLevelPositionX, waveLevelPositionY);
	}

	drawNextWaveInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas) {
		const nextWaveBarWidth = SETTINGS.WAVE_BAR_LENGTH;
		const nextWaveBarHeight = SETTINGS.WAVE_BAR_HEIGHT;
		const nextWaveBarPositionX = canvas.width - nextWaveBarWidth - 5;
		const nextWaveBarPositionY = 5;
		const nextWaveBackgroundPadding = 1;
		const nextWaveCounterWidth = nextWaveBarWidth - Utils.calculateBarWidth(map.waveRespawnFrequencyCounter, map.waveRespawnFrequency, nextWaveBarWidth);

		canvasContext.fillStyle = SETTINGS.BAR_BACKGROUND_COLOR;
		canvasContext.fillRect(nextWaveBarPositionX - nextWaveBackgroundPadding, nextWaveBarPositionY - nextWaveBackgroundPadding, nextWaveBarWidth + (nextWaveBackgroundPadding * 2), nextWaveBarHeight + (nextWaveBackgroundPadding * 2));
		canvasContext.fillStyle = SETTINGS.WAVE_BAR_COLOR;
		canvasContext.fillRect(nextWaveBarPositionX, nextWaveBarPositionY, nextWaveCounterWidth, nextWaveBarHeight);
	}

	drawNextWaveLevelInfo(canvasContext, milliSecondsSinceLastFrame, map, canvas) {
		const nextWaveLevelBarWidth = SETTINGS.WAVE_BAR_LENGTH;
		const nextWaveLevelBarHeight = SETTINGS.WAVE_LEVEL_BAR_HEIGHT;
		const nextWaveLevelBarPositionX = canvas.width - nextWaveLevelBarWidth - 5;
		const nextWaveLevelBarPositionY = 16;
		const nextWaveLevelBackgroundPadding = 1;
		const nextWaveLevelCounterWidth = nextWaveLevelBarWidth - Utils.calculateBarWidth(map.waveLevelIncrementFrequencyCounter, map.waveLevelIncrementFrequency, nextWaveLevelBarWidth);

		canvasContext.fillStyle = SETTINGS.BAR_BACKGROUND_COLOR;
		canvasContext.fillRect(nextWaveLevelBarPositionX - nextWaveLevelBackgroundPadding, nextWaveLevelBarPositionY - nextWaveLevelBackgroundPadding, nextWaveLevelBarWidth + (nextWaveLevelBackgroundPadding * 2), nextWaveLevelBarHeight + (nextWaveLevelBackgroundPadding * 2));
		canvasContext.fillStyle = SETTINGS.WAVE_LEVEL_BAR_COLOR;
		canvasContext.fillRect(nextWaveLevelBarPositionX, nextWaveLevelBarPositionY, nextWaveLevelCounterWidth, nextWaveLevelBarHeight);
	}

	drawLevelUpButton(canvasContext, milliSecondsSinceLastFrame) {
		this.levelUpButton.draw(canvasContext, milliSecondsSinceLastFrame);
	}
}