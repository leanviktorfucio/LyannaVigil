import { Canvas } from "./Canvas.js";
import { SETTINGS } from "./Settings.js";
import { STATES } from "./Globals.js";
import { InputHandler } from "./InputHandler.js";
import { Map1 } from "./Map.js";
import { UIInPlay } from "./UI.js";
import { PlayerClassSelectUI, PlayerClassSkillsUI } from "./UIInPause.js";

window.functionExecutionTime = 0;

export class Game {
  constructor(canvasId) {
    this.isDebugMode = false; // dev mode
    // this.isDebugMode = true; // dev mode
    this.canvas = new Canvas(canvasId, this);
    this.inputHandler = new InputHandler(this);
    this.player = null;
    this.map = null;
    this.currentUIInPause = null;

		this.isPaused = false;

    this.lastFPSTime = 0;

  }

  init() {
      let map = new Map1(this);
      this.map = map;
      this.map.init();

      this.uiInPlay = new UIInPlay(this);
      this.uiInPlay.init();

      this.canvas.startGameAnimationLoop();

      this.openPlayerClassSelectUI();
  }

  togglePause(isPaused) {
    if (isPaused === undefined) {
      this.isPaused = !this.isPaused;
    } else {
      this.isPaused = isPaused;
    }

    // remove all UIInPause if unpaused
    if (this.isPaused === false && this.currentUIInPause) {
      this.currentUIInPause.destroy();
    }
  }

  isGamePaused() {
    return this.isPaused;
  }

  onCanvasDraw(milliSecondsSinceLastFrame) {
      
  }

  onCanvasUpdate(milliSecondsSinceLastFrame) {
      
  }

  openPlayerClassSelectUI() {
    this.togglePause(true);
    this.currentUIInPause = new PlayerClassSelectUI(this);
    this.currentUIInPause.init();
  }

  openPlayerClassSkillsUI() {
    this.togglePause(true);
    this.currentUIInPause = new PlayerClassSkillsUI(this);
    this.currentUIInPause.init();
  }

  onGameOver() {
    this.canvas.toggleAnimationLoop(true);
    this.canvas.context.fillStyle = "white";
    this.canvas.context.fillRect(200, 200, 400, 200);

    this.canvas.context.font = "20px Lucida Console";
    this.canvas.context.fillStyle = "black";
    this.canvas.context.fillText("GAME OVER", 350, 290);
  }
}


/*
TODO:
- UI
  - Skills
- Enemy
  - behaviours
    - default - chase castle but if player is nearby, chase player
       - need to create enemy visibility radius and blind radius
- Castle
  - image should be a square and match the whole castle fields

- GAME 
  - Player leveling, skills

- Improvements
  - instead of generating flow field forces each FPS, just do it when player is stepping on a different flow field like an event onFlowFielfChange
  - create a Point model so we prevent using referencing .positionX, .positionY. use getPosition() and return .positionX Y
  - put all debug draw of image/hitboxes inside isDebugMode condition
  - Create enemy main hitbox so we can draw the enemy larger than the field but the hitbox must be as large as the field
*/