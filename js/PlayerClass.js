import { PlayerClassDrawable } from "./PlayerClassDrawable.js";
import { PlayerSlashMeleeAttackLevel1, PlayerSlashMeleeAttackLevel2 } from "./Attacks.js";

export const PLAYER_CLASSES = [
    "BardagulanClass"
];

class PlayerClass {
    constructor(game) {
        this.game = game;

        this.ui = null;
        this.config = null;
    }

    // TODO save this class to the player
    onSelected() {
        
    }
}

export class BardagulanClass extends PlayerClass {
    constructor(game) {
        super(game);

        const image = new PlayerClassDrawable(this.game, this, "player_class_bardagulan", 20, 120, "red");
        image.init();

        this.ui = {
            image: image
        };
        this.skills = [
            "Stomp"
        ];
    }

    onUIClick() {
        this.game.player.onPlayerClassSelected(this);
    }

	draw(canvasContext, milliSecondsSinceLastFrame) {
        this.ui.image.draw(canvasContext, milliSecondsSinceLastFrame);
    }

    onSelected() {
        super.onSelected();
    }

    attack(pointClicked) {
		const centerPoint = this.game.player.getCenterPosition();
		const angle = Math.atan2(pointClicked.y - centerPoint.y, pointClicked.x - centerPoint.x);
		const playerSlashMeleeAttack1 = new PlayerSlashMeleeAttackLevel1(this.game, angle, this.attackCooldown);
		playerSlashMeleeAttack1.init();
    }
}