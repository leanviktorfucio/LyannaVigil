import { STATES } from "./Globals.js";

export class Utils {
    static isCollided(obj1, obj2) {
        // if an object has states, then check if it's in GHOST state. if in GHOST state, it must always return false 
        // if no states, then this it is always "collide-able"
        // this extra condition exists because LivingThings objects has states, and Hitbox does not

        return (
                obj1.positionX < obj2.positionX + obj2.width &&
                obj1.positionX + obj1.width > obj2.positionX &&
                obj1.positionY < obj2.positionY + obj2.height &&
                obj1.positionY + obj1.height > obj2.positionY
                // additionalConditionIfLivingThings
            );
    }

    static isCollidedArray(objects1, objects2) {
        for(let i = 0; i < objects1.length; i++) {
            for(let j = 0; j < objects2.length; j++) {
                if (this.isCollided(objects1[i], objects2[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    static isPointInsideADrawable(point, obj1) {
        return (
            (obj1.positionX <= point.x && point.x <= obj1.positionX + obj1.width) &&
            (obj1.positionY <= point.y && point.y <= obj1.positionY + obj1.height)
        );
    }

    static getPositionForCircularMotion(angle, centerX, centerY, spinRadius, spinSpeedRate) {
        let newAngle = (angle + Math.PI / 360) % (Math.PI * 2) + spinSpeedRate;
		let positionX = centerX + (spinRadius * Math.cos(newAngle));
		let positionY = centerY + (spinRadius * Math.sin(newAngle));

        return {
            x: positionX,
            y: positionY,
            angle: newAngle
        };
    }

    // the destination is always the relative to the whole map (not the canvas)
    // will calculate the next step (or the velocity X and Y) up to the chaser's center is in the destination point
    static findNextStepVelocityToTheDestination(originPoint, destinationPoint) {
        // get the angle and radian
        const angle = Math.atan2( destinationPoint.y - originPoint.y, destinationPoint.x - originPoint.x ) * ( 180 / Math.PI );
        const radian = angle * Math.PI / 180;

        // use cos and sin to get the speed rate multipier (0 to 1)
        const velocityX = Math.cos(radian);
        const velocityY = Math.sin(radian);

        return {
            velocityX: velocityX,
            velocityY: velocityY
        }
    }

    static getAngleFromTwoPoints(originPoint, destinationPoint) {
        return Math.atan2( destinationPoint.y - originPoint.y, destinationPoint.x - originPoint.x );
    }

    static getRadianFromTwoPoints(originPoint, destinationPoint) {
        // get the angle and radian
        const angle = Math.atan2( destinationPoint.y - originPoint.y, destinationPoint.x - originPoint.x ) * ( 180 / Math.PI );
        const radian = angle * Math.PI / 180;

        return radian;
    }

	static isFieldTheSame(field1, field2) {
		return field1.rowIndex === field2.rowIndex && field1.columnIndex === field2.columnIndex;
	}

	static isFieldInTheListOfFields(fieldToFind, fields) {
		if (
			fields[fieldToFind.rowIndex] && 
			fields[fieldToFind.rowIndex][fieldToFind.columnIndex]
		) {
			return true;
		}

        return false;
	}

    static calculateBarWidth(current, max, width) {
        return (current / max) * width;
    }

    static drawText(canvasContext, text = "", positionX = 0, positionY = 0, color = "black", fontsize = 20, fontstyle = "Lucida Console") {
        canvasContext.font = fontsize + "px " + fontstyle;
		canvasContext.fillStyle = color;
		canvasContext.fillText(text, positionX, positionY + fontsize);
    }
}
