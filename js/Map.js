import { Drawable } from "./Drawable.js";
import { Hitbox, FieldHitbox } from "./Hitbox.js";
import { STATES, ENEMY_CLASS } from "./Globals.js";
import { SETTINGS } from "./Settings.js";
import { Utils } from "./Utils.js";
import { EyeletEnemy, MouthyEnemy, EyeleenEnemy, RobeyEnemy } from "./Enemies.js";
import { Player } from "./Player.js";
import { Map1Castle } from "./Castle.js";

// NOTE:
// All map sprites are gridded by cells which is  12x12 pixels (not really - yet)
// A map will contain meta data for hitboxes
// - image - will be shown as background
// - invisible cells - cells that contains hitbox behaviors
//   - wall - LAND, FLYING monsters/player cannot walk through
//   - water - LAND monsters/player cannot walk through
//   - mud - SLOWS LAND monster/player
//	 - actual hitbox - check enemy bullets hit
export class Map extends Drawable 	{
	static FIELDS_RAW = 0;
	static FIELDS_WALL = 1;
	static FIELDS_FLOW_PLAYER = 2;
	static FIELDS_FLOW_CASTLE = 3;

	constructor(game) {
		super(game);
		this.drawableType = SETTINGS.DRAWABLE_TYPE.MAP;

		// these values are initialized by the sub class
		this.width = null;
		this.height = null;
		this.isWaveCleared = null;
		this.waveRespawnFrequency = null; // Frequency of enemies to respawn again
		this.waveRespawnFrequencyCounter = null;
		this.waveLevelIncrementFrequency = null; // number of waves to increment the wave level
		this.waveLevelIncrementFrequencyCounter = null;
		this.waveAliveEnemiesCount = null;
		this.waveConfiguration = null;
		this.waveCurrentLevel = 1;
		this.waveIsLast = false;
		this.castle = null;

		this.velocityX = 0;
		this.velocityY = 0;

	}

	update(milliSecondsSinceLastFrame) {
		// no need to execute update
		// super.update(milliSecondsSinceLastFrame);

		this.waveRespawnFrequencyCounter -= milliSecondsSinceLastFrame;

		// start a new wave if wave respawn frequency is now and not last wave
		if (this.waveRespawnFrequencyCounter <= 0 && !this.isLastWave()) {
			this.waveRespawnFrequencyCounter = this.waveRespawnFrequency;
			this.startWave();
		} else if (this.isLastWave()) {
			if (this.game.canvas.elementsToDraw[SETTINGS.ELEMENT_TYPES_Z_INDEX.ENEMIES].length <= 0) {
				this.game.onGameOver();
				console.log("Congrats, game finished");
			}
		}
	}

	startWave() {
		this.isWaveCleared = false;

		this.waveRespawnFrequencyCounter = this.waveRespawnFrequency;
		if (this.waveLevelIncrementFrequencyCounter <= 0) {
			this.waveLevelIncrementFrequencyCounter = this.waveLevelIncrementFrequency;
			this.incrementWaveLevel();
		}
		this.waveLevelIncrementFrequencyCounter--;

		// set wave is last to true so we dont need to spawn any enemies
		if (this.waveConfiguration.length < this.waveCurrentLevel) {
			this.waveIsLast = true;
			return;
		}

		// this.waveCurrentLevel does not start with 0, but 1
		const waveConfig = this.waveConfiguration[this.waveCurrentLevel - 1];
		const xAxesAsIndexes = Object.keys(waveConfig);

		const maxSpawnYAxis = this.game.canvas.height - this.cellHeight;

		for(let xAxesCounter = 0; xAxesCounter < xAxesAsIndexes.length; xAxesCounter++) {
			const xAxisIndex = xAxesAsIndexes[xAxesCounter];
			const enemyConfigs = waveConfig[xAxisIndex];

			for(let enemyConfigCounter = 0; enemyConfigCounter < enemyConfigs.length; enemyConfigCounter++) {
				const enemyConfig = enemyConfigs[enemyConfigCounter];
				const positionX = xAxisIndex * this.cellWidth;

				for(let enemySpawnCounter = 0; enemySpawnCounter < enemyConfig.enemyCount; enemySpawnCounter++) {
					const positionY = Math.floor(Math.random() * maxSpawnYAxis - 1);

					const enemy = eval("new " + enemyConfig.enemyCode + "(this.game, positionX, positionY)");
					enemy.init(this.waveCurrentLevel);
				}
			}
		}
	}

	onWaveCleared() {
		this.waveCurrentLevel++;
		this.isWaveCleared = true;
	}

	incrementWaveLevel() {
		this.waveCurrentLevel++;
	}

	isLastWave() {
		return this.waveIsLast;
	}

	getCenter() {
		return {
			positionX: this.positionX + (this.width / 2),
			positionY: this.positionY + (this.height / 2),
		}
	}

	isLeftMostReached() {
		return this.positionX >= 0;
	}

	isRightMostReached() {
		return this.positionX <= (this.game.canvas.width - this.width);
	}

	isTopMostReached() {
		return this.positionY >= 0;
	}

	isBottomMostReached() {
		return this.positionY <= (this.game.canvas.height - this.height);
	}
}

export class Map1 extends Map {
	constructor(game) {
		super(game);

		let mapId = "map1";

		// this.width = 1120; // 35 tiles
		// this.height = 672; // 21 tiles
		this.width = 2000; // 35 tiles
		this.height = 2000; // 21 tiles
		this.positionX = 0;
		this.positionY = 0;
		this.imageSpriteSource = document.getElementById(mapId);
		this.imageSpriteNumberOfFramesX = 1;
		this.spriteImageChangeFrequency = -1; // milliseconds

		this.waveRespawnFrequency = 5123123000; // Frequency of enemies to respawn again
		this.waveRespawnFrequencyCounter = 0;
		this.waveLevelIncrementFrequency = 8; // number of waves to increment the wave level
		this.waveLevelIncrementFrequencyCounter = this.waveLevelIncrementFrequency;

		// flow fields
		// make sure the cell size is less then the player's size
		this.cellWidth = 32;
		this.cellHeight = 32;
		this.flowFieldsToUpdateSurroundingQueue = []; // FIFO - list of flow fields to update its surroundings flow fields

		this.hitboxes = this.generateHitboxes();
	}

	init() {
		this.game.canvas.addElementToDraw(SETTINGS.ELEMENT_TYPES_Z_INDEX.MAP, this);

        let player = new Player(this.game);
        this.game.player = player;
		this.game.player.init();

		const castlePositionInFieldX = 0;
		const castlePositionInFieldY = 7;
		const castlePositionX = this.positionX + (castlePositionInFieldX * this.cellWidth);
		const castlePositionY = this.positionY + (castlePositionInFieldY * this.cellHeight) + 3;
        this.castle = new Map1Castle(this.game);
		this.castle.init(castlePositionX, castlePositionY, this.hitboxes[Map.FIELDS_FLOW_CASTLE]);

		this.waveConfiguration = [
			// level 1
			{
				// the keys are the X-axis of the fields where the enemies spawns randomly 
				// 22: [
				// 	{
				// 		enemyCount: 200, // enemy count per wave
				// 		enemyCode: ENEMY_CLASS.EYELET
				// 	}
				// ],
				// the keys are the X-axis of the fields where the enemies spawns randomly 
				// 20: [
				// 	{
				// 		enemyCount: 25, // enemy count per wave
				// 		enemyCode: ENEMY_CLASS.EYELET
				// 	}, 
				// 	{
				// 		enemyCount: 25, // enemy count per wave
				// 		enemyCode: ENEMY_CLASS.MOUTHY
				// 	}
				// ],
				22: [
					{
						enemyCount: 25, // enemy count per wave
						enemyCode: ENEMY_CLASS.MOUTHY
					}, 
					{
						enemyCount: 25, // enemy count per wave
						enemyCode: ENEMY_CLASS.EYELET
					}
				],
				// 24: [{
				// 	enemyCount: 50,
				// 	enemyCode: ENEMY_CLASS.EYELEEN
				// }, {
				// 	enemyCount: 50,
				// 	enemyCode: ENEMY_CLASS.ROBEY
				// }]
			},
			// level 2
			{
				22: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.EYELET
				}],
				24: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.EYELET
				}]
			},
			// level 3
			{
				22: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.EYELEEN
				}],
				24: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.EYELEEN
				}]
			},
			// level 4
			{
				22: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.ROBEY
				}],
				24: [{
					enemyCount: 15,
					enemyCode: ENEMY_CLASS.ROBEY
				}]
			}
		];
	}

	startWave() {
		super.startWave();
	}

	draw(canvasContext, milliSecondsSinceLastFrame) {
		super.draw(canvasContext, milliSecondsSinceLastFrame);

		// if (this.game.isDebugMode === true) {
			this.hitboxes[Map.FIELDS_FLOW_PLAYER]
			.forEach(flowFieldsInARow => {
				flowFieldsInARow.forEach(flowFieldCell => {
					flowFieldCell.draw(canvasContext, milliSecondsSinceLastFrame);
				});
			});

			// this.hitboxes[Map.FIELDS_FLOW_CASTLE]
			// .forEach(flowFieldsInARow => {
			// 	flowFieldsInARow.forEach(flowFieldCell => {
			// 		flowFieldCell.draw(canvasContext, milliSecondsSinceLastFrame);
			// 	});
			// });
	
			this.hitboxes[Map.FIELDS_WALL]
			.forEach(flowFieldsInARow => {
				flowFieldsInARow.forEach(flowFieldCell => {
					flowFieldCell.draw(canvasContext, milliSecondsSinceLastFrame);
				});
			});
		// }
	}

	update(milliSecondsSinceLastFrame) {
		// NOTE: map update logic happens in the Player::update() because the player moves the map

		super.update(milliSecondsSinceLastFrame);

		// create flow fields to player
		let playerField = this.getFlowFieldByPoint(this.game.player.getCenterPositionRelativeToMap(), Map.FIELDS_RAW);
		const playerFieldRowIndex = playerField.rowIndex;
		const playerFieldColumnIndex = playerField.columnIndex;
		const playerFieldAsFlowFields = [];
		playerFieldAsFlowFields[playerFieldRowIndex] = [];
		playerFieldAsFlowFields[playerFieldRowIndex][playerFieldColumnIndex] = playerField;
		this.generateFlowFields(playerFieldAsFlowFields, Map.FIELDS_FLOW_PLAYER);
		this.hitboxes[Map.FIELDS_FLOW_PLAYER].forEach(flowFieldsInARow => {
			flowFieldsInARow.forEach(flowFieldCell => {
				// this is a hitbox so we don't move it relative to the map automatically.
				// we do it manually
				let position = {
					x: this.positionX + flowFieldCell.initialPositionX,
					y: this.positionY + flowFieldCell.initialPositionY
				}
				flowFieldCell.update(position);
			});
		});

		// create flow fields to castle
		this.generateFlowFields(this.castle.getFields(), Map.FIELDS_FLOW_CASTLE);
		this.hitboxes[Map.FIELDS_FLOW_CASTLE].forEach(flowFieldsInARow => {
			flowFieldsInARow.forEach(flowFieldCell => {
				// this is a hitbox so we don't move it relative to the map automatically.
				// we do it manually
				let position = {
					x: this.positionX + flowFieldCell.initialPositionX,
					y: this.positionY + flowFieldCell.initialPositionY
				}
				flowFieldCell.update(position);
			});
		});

		this.hitboxes[Map.FIELDS_WALL].forEach(flowFieldsInARow => {
			flowFieldsInARow.forEach(flowFieldCell => {
				// this is a hitbox so we don't move it relative to the map automatically.
				// we do it manually
				let position = {
					x: this.positionX + flowFieldCell.initialPositionX,
					y: this.positionY + flowFieldCell.initialPositionY
				}
				flowFieldCell.update(position);
			});
		});
	}

	generateFlowFields(targetFields, hitboxesFlowFieldKey) {
		this.hitboxes[hitboxesFlowFieldKey] = this.generateHitboxes()[Map.FIELDS_RAW];
		
		// set the target flow fields to 0 force
		targetFields.forEach(fieldsinARow => {
			fieldsinARow.forEach(targetField => {
				let currentTargetField = this.getFlowField(targetField.rowIndex, targetField.columnIndex, hitboxesFlowFieldKey);
				currentTargetField.force = 0;
				this.flowFieldsToUpdateSurroundingQueue.push(currentTargetField);
			});
		});

		// TODO instead of recursive function, do this in while loop
		// first one's first
		this.setForceValueToSurroundingFlowField(this.flowFieldsToUpdateSurroundingQueue.shift(), hitboxesFlowFieldKey);

		// set velocity to the flow fields based on the force
		for(let rowIndex = 0; rowIndex < this.hitboxes[hitboxesFlowFieldKey].length; rowIndex++) {
			for(let columnIndex = 0; columnIndex < this.hitboxes[hitboxesFlowFieldKey][rowIndex].length; columnIndex++) {
				let flowFieldCell = this.hitboxes[hitboxesFlowFieldKey][rowIndex][columnIndex];

				if (Utils.isFieldInTheListOfFields(flowFieldCell, targetFields, hitboxesFlowFieldKey)) { 
					flowFieldCell.setVelocityByDirection('T');
					continue;
				}

				// only set if flow field is movable
				if (
					(hitboxesFlowFieldKey === Map.FIELDS_FLOW_CASTLE && (flowFieldCell.isThisACastleFieldAndHasForce() || flowFieldCell.isMovableAndHasForce())      ) || // if using a Map.FIELDS_FLOW_CASTLE, check castle field
					(hitboxesFlowFieldKey === Map.FIELDS_FLOW_PLAYER && flowFieldCell.isMovableAndHasForce()) // if using a Map.FIELDS_FLOW_PLAYER, check wall
				) {
					const direction = this.getDirectionFromTheFlowFieldWithinTheSurroundingFlowFieldsWithLeastForce(flowFieldCell, hitboxesFlowFieldKey);
					flowFieldCell.setVelocityByDirection(direction);
				}
			}
		}
	}

	checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInBasicDirections, hitboxesFlowFieldKey) {
		let isLessThan = false;
		if ( 
			(
				(hitboxesFlowFieldKey === Map.FIELDS_FLOW_CASTLE && (currentFlowField.isThisACastleFieldAndHasForce() || currentFlowField.isMovableAndHasForce())) || // if using a Map.FIELDS_FLOW_CASTLE, check castle field
				(hitboxesFlowFieldKey === Map.FIELDS_FLOW_PLAYER && currentFlowField.isMovableAndHasForce()) // if using a Map.FIELDS_FLOW_PLAYER, check wall
			) &&
			currentFlowField.force < lowestForceInBasicDirections.force
		) {
			isLessThan = true;
		}

		return isLessThan
	}

	getDirectionFromTheFlowFieldWithinTheSurroundingFlowFieldsWithLeastForce(flowField, hitboxesFlowFieldKey) {
		// search for the lower force value in the surrounding flow fields
		let lowestForceInBasicDirections = {
			force: Infinity,
			flowField: null
		};

		// up
		let currentFlowField = this.getFlowField(flowField.rowIndex - 1, flowField.columnIndex, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInBasicDirections, hitboxesFlowFieldKey)) {
			lowestForceInBasicDirections.force = currentFlowField.force;
			lowestForceInBasicDirections.flowField = currentFlowField;
		}

		// right
		currentFlowField = this.getFlowField(flowField.rowIndex, flowField.columnIndex + 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInBasicDirections, hitboxesFlowFieldKey)) {
			lowestForceInBasicDirections.force = currentFlowField.force;
			lowestForceInBasicDirections.flowField = currentFlowField;
		}

		// down
		currentFlowField = this.getFlowField(flowField.rowIndex + 1, flowField.columnIndex, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInBasicDirections, hitboxesFlowFieldKey)) {
			lowestForceInBasicDirections.force = currentFlowField.force;
			lowestForceInBasicDirections.flowField = currentFlowField;
		}

		// left
		currentFlowField = this.getFlowField(flowField.rowIndex, flowField.columnIndex - 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInBasicDirections, hitboxesFlowFieldKey)) {
			lowestForceInBasicDirections.force = currentFlowField.force;
			lowestForceInBasicDirections.flowField = currentFlowField;
		}

		let lowestForceInDiagonalDirections = {
			force: Infinity,
			flowField: null
		};

		// up left
		currentFlowField = this.getFlowField(flowField.rowIndex - 1, flowField.columnIndex - 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInDiagonalDirections, hitboxesFlowFieldKey)) {
			lowestForceInDiagonalDirections.force = currentFlowField.force;
			lowestForceInDiagonalDirections.flowField = currentFlowField;
		}

		// up right
		currentFlowField = this.getFlowField(flowField.rowIndex - 1, flowField.columnIndex + 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInDiagonalDirections, hitboxesFlowFieldKey)) {
			lowestForceInDiagonalDirections.force = currentFlowField.force;
			lowestForceInDiagonalDirections.flowField = currentFlowField;
		}

		// low right
		currentFlowField = this.getFlowField(flowField.rowIndex + 1, flowField.columnIndex + 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInDiagonalDirections, hitboxesFlowFieldKey)) {
			lowestForceInDiagonalDirections.force = currentFlowField.force;
			lowestForceInDiagonalDirections.flowField = currentFlowField;
		}

		// low left
		currentFlowField = this.getFlowField(flowField.rowIndex + 1, flowField.columnIndex - 1, hitboxesFlowFieldKey);
		if (currentFlowField !== null && this.checkFlowFieldForceIfLessThanTheLastOne(currentFlowField, lowestForceInDiagonalDirections, hitboxesFlowFieldKey)) {
			lowestForceInDiagonalDirections.force = currentFlowField.force;
			lowestForceInDiagonalDirections.flowField = currentFlowField;
		}

		let lowestForceFlowField = null;

		if (lowestForceInBasicDirections.force <= lowestForceInDiagonalDirections.force) {
			lowestForceFlowField = lowestForceInBasicDirections.flowField;
		} else {
			lowestForceFlowField = lowestForceInDiagonalDirections.flowField;
		}

		return this.getDirectionFromTwoFields(flowField, lowestForceFlowField);
	}

	getDirectionFromTwoFields(fromFlowField, toFlowField) {
		const fromFlowFieldCenter = fromFlowField.getCenterPositionRelativeToMap();
		const toFlowFieldCenter = this.game.player.getCenterPositionRelativeToMap();
		const angle = Utils.getRadianFromTwoPoints(fromFlowFieldCenter, toFlowFieldCenter);

		// get direction
		let direction = null;
		if (fromFlowField.rowIndex - 1 === toFlowField.rowIndex && 
			fromFlowField.columnIndex === toFlowField.columnIndex) {
			direction = 'U'; // up
			// console.log(angle);
		} else if (fromFlowField.rowIndex === toFlowField.rowIndex &&
			fromFlowField.columnIndex + 1 === toFlowField.columnIndex) {
			direction = 'R'; // right
			// console.log(angle);
		} else if (fromFlowField.rowIndex + 1 === toFlowField.rowIndex &&
			fromFlowField.columnIndex === toFlowField.columnIndex) {
			direction = 'D'; // down
			// console.log(angle);
		} else if (fromFlowField.rowIndex === toFlowField.rowIndex &&
			fromFlowField.columnIndex - 1 === toFlowField.columnIndex) {
			direction = 'L'; // left
		} else if (fromFlowField.rowIndex - 1 === toFlowField.rowIndex &&
			fromFlowField.columnIndex - 1 === toFlowField.columnIndex) {
			direction = 'UL'; // up left
		} else if (fromFlowField.rowIndex - 1 === toFlowField.rowIndex &&
			fromFlowField.columnIndex + 1 === toFlowField.columnIndex) {
			direction = 'UR'; // up right
		} else if (fromFlowField.rowIndex + 1 === toFlowField.rowIndex &&
			fromFlowField.columnIndex + 1 === toFlowField.columnIndex) {
			direction = 'DR'; // down right
		} else if (fromFlowField.rowIndex + 1 === toFlowField.rowIndex &&
			fromFlowField.columnIndex - 1 === toFlowField.columnIndex) {
			direction = 'DL'; // down left
		}

		fromFlowField.angle = angle;

		if (direction === null) {
			throw "direction cannot be null";
		}

		return direction;
	}

	getFlowField(rowIndex, columnIndex, hitboxesFlowFieldKey) {
		if (hitboxesFlowFieldKey === null || hitboxesFlowFieldKey === undefined) {
			throw "getFlowField requires: hitboxesFlowFieldKey";
		}

		if (
			this.hitboxes[hitboxesFlowFieldKey] && 
			this.hitboxes[hitboxesFlowFieldKey][rowIndex] && 
			this.hitboxes[hitboxesFlowFieldKey][rowIndex][columnIndex]
		) {
			return this.hitboxes[hitboxesFlowFieldKey][rowIndex][columnIndex];
		}

		return null;
	}

	getFlowFieldByPoint(point, hitboxesFlowFieldKey) {
		if (hitboxesFlowFieldKey === null || hitboxesFlowFieldKey === undefined) {
			throw "Should never have no value";
		}

		// we know that the flow fields are indexed consecutively by column and rows.
		// like index [0][0] has a flow field with positionX:0 and positionY:0
		// index[1][0] has a flow field with positionX:0 and positionY:32
		// index[1][1] has a flow field with positionX:32 and positionY:32
		// so we divide the point.y to the cell width
		// point.y:31 / cellwidth:32 = 0.96
		// parse it to have 0 and we get the index.
		// use this logic so we don't need to loop through all flow fields
		const rowIndex = parseInt(point.y / this.cellHeight);
		const columnIndex = parseInt(point.x / this.cellWidth);

		return this.hitboxes[hitboxesFlowFieldKey][rowIndex][columnIndex];
	}

	generateHitboxes() {
		let fields = this.generateTemporaryHitboxes();

		let rawFields = [];
		let wallHitboxes = [];
		let castleFields = [];
		const numberOfRows = fields.length;
		const numberOfColumns = fields[0].length;
		for(let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
			let row = [];
			let wallRow = [];
			let castleRow = [];
			for(let columnIndex = 0; columnIndex < numberOfColumns; columnIndex++) {
				let flowFieldCell = new FieldHitbox(
					this.game,
					this,
					columnIndex * this.cellWidth,
					rowIndex * this.cellHeight,
					this.cellWidth,
					this.cellHeight
				);
				flowFieldCell.force = null;
				flowFieldCell.columnIndex = columnIndex;
				flowFieldCell.rowIndex = rowIndex;

				const fieldType = fields[rowIndex][columnIndex];
				if (fieldType === 1) {
					flowFieldCell.isWall = true;
					flowFieldCell.isCastleField = false;
					wallRow[columnIndex] = flowFieldCell;
				} else if (fieldType === 2) {
					flowFieldCell.isWall = true;
					flowFieldCell.isCastleField = true;
					wallRow[columnIndex] = flowFieldCell;
					castleRow[columnIndex] = flowFieldCell;
				}
				
				row.push(flowFieldCell);
			}
			rawFields.push(row);
			if (wallRow.length > 0) {
				wallHitboxes[rowIndex] = wallRow;
			}
			if (castleRow.length > 0) {
				castleFields[rowIndex] = castleRow;
			}
		}

		let retVal = [];
		retVal[Map.FIELDS_RAW] = rawFields;
		retVal[Map.FIELDS_WALL] = wallHitboxes;
		retVal[Map.FIELDS_FLOW_CASTLE] = castleFields;

		return retVal;
	}

	generateTemporaryHitboxes() {
		let hitboxes = [];

		// walls
		const walls = {
			0: [17],
			1: [17],
			2: [10, 17],
			3: [10, 17],
			4: [10, 17],
			5: [10, 17],
			6: [10, 17],
			7: [10, 17],
			8:  [10],
			9:  [10],
			10: [10],
			11: [10, 17],
			12: [10, 17],
			13: [10, 17],
			14: [10, 17],
			15: [10, 13, 14, 15, 16, 17],
			16: [10, 17],
			17: [10, 17],
			18: [10, 17],
		};

		const castleFields = {
			// 8:  [        17        ],
			// 9:  [    16, 17, 18    ],
			// 10: [15, 16, 17, 18, 19], // 17 is the actual castle
			// 11: [15, 16, 17, 18, 19],
			// 12: [15, 16, 17, 18, 19]
			7:  [0, 1, 2, 3],
			8:  [0, 1, 2, 3],
			9:  [0, 1, 2, 3],
			10: [0, 1, 2, 3],
			11: [0, 1, 2, 3],
		};

		const numberOfColumns = this.width / this.cellWidth;
		const numberOfRows = this.height / this.cellHeight;
		for(let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
			let row = []
			for(let columnIndex = 0; columnIndex < numberOfColumns; columnIndex++) {
				// filedType
				// 0 is movable field
				// 1 is wall
				// 2 is castle field
				let filedType = 0;
				if (Object.keys(walls).includes(rowIndex + '')) {
					if (walls[rowIndex].includes(columnIndex)) {
						filedType = 1;
					}
				}
				if (Object.keys(castleFields).includes(rowIndex + '')) {
					if (castleFields[rowIndex].includes(columnIndex)) {
						filedType = 2;
					}
				}
				row.push(filedType);
			}
			hitboxes.push(row);
		}

		return hitboxes;
	}

	// this is a recursive function following the pattern of Dijkstra (path-finding algorithm - no diagonal)
	// https://qiao.github.io/PathFinding.js/visual/
	setForceValueToSurroundingFlowField(targetFlowFieldCell, hitboxesFlowFieldKey) {
		const currentFlowFieldCellRowIndex = targetFlowFieldCell.rowIndex;
		const currentFlowFieldCellColumnIndex = targetFlowFieldCell.columnIndex;
		let force = targetFlowFieldCell.force + 1; // add 1 to surrounding flow fields
		let flowFieldCellToUpdate = null;
		
		flowFieldCellToUpdate = this.getNextFlowFieldCandidateForSearch(currentFlowFieldCellRowIndex - 1, currentFlowFieldCellColumnIndex, hitboxesFlowFieldKey); // above
		if (flowFieldCellToUpdate !== null) {
			flowFieldCellToUpdate.force = force;
			this.flowFieldsToUpdateSurroundingQueue.push(flowFieldCellToUpdate);
		}
		
		flowFieldCellToUpdate = this.getNextFlowFieldCandidateForSearch(currentFlowFieldCellRowIndex, currentFlowFieldCellColumnIndex + 1, hitboxesFlowFieldKey); // right
		if (flowFieldCellToUpdate !== null) {
			flowFieldCellToUpdate.force = force;
			this.flowFieldsToUpdateSurroundingQueue.push(flowFieldCellToUpdate);
		}

		flowFieldCellToUpdate = this.getNextFlowFieldCandidateForSearch(currentFlowFieldCellRowIndex + 1, currentFlowFieldCellColumnIndex, hitboxesFlowFieldKey); // down
		if (flowFieldCellToUpdate !== null) {
			flowFieldCellToUpdate.force = force;
			this.flowFieldsToUpdateSurroundingQueue.push(flowFieldCellToUpdate);
		}

		flowFieldCellToUpdate = this.getNextFlowFieldCandidateForSearch(currentFlowFieldCellRowIndex, currentFlowFieldCellColumnIndex - 1, hitboxesFlowFieldKey); // left
		if (flowFieldCellToUpdate !== null) {
			flowFieldCellToUpdate.force = force;
			this.flowFieldsToUpdateSurroundingQueue.push(flowFieldCellToUpdate);
		}

		// get first index in the array and do everything again but remove it from the list
		let nextFlowFieldCell = this.flowFieldsToUpdateSurroundingQueue.shift();
		if (nextFlowFieldCell) {
			this.setForceValueToSurroundingFlowField(nextFlowFieldCell, hitboxesFlowFieldKey);
		}
	}

	getNextFlowFieldCandidateForSearch(currentFlowFieldCellRowIndex, currentFlowFieldCellColumnIndex, hitboxesFlowFieldKey) {
		let flowFields = this.hitboxes[hitboxesFlowFieldKey];

		// return an existing flowfield in the list with force is null
		// and also if flow fields in above, below, left or right side is 

		// check if row is not empty
		if (flowFields[currentFlowFieldCellRowIndex]) {
			// check if the actual flow field cell is not empty
			if (flowFields[currentFlowFieldCellRowIndex][currentFlowFieldCellColumnIndex]) {
				// check if flow field force value is not null
				const currentFlowField = flowFields[currentFlowFieldCellRowIndex][currentFlowFieldCellColumnIndex];

				if (
					(
						(hitboxesFlowFieldKey === Map.FIELDS_FLOW_CASTLE && (currentFlowField.isThisACastleField() || currentFlowField.isMovable())) || // if using a Map.FIELDS_FLOW_CASTLE, castle fields are considered movable
						(hitboxesFlowFieldKey === Map.FIELDS_FLOW_PLAYER && currentFlowField.isMovable()) // if using a Map.FIELDS_FLOW_PLAYER, check wall
					) &&
					!currentFlowField.hasForce()) // but has no force
				{
					return flowFields[currentFlowFieldCellRowIndex][currentFlowFieldCellColumnIndex];
				}
			}
		}

		return null;
	}
}