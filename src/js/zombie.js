export class Zombie {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create the zombie sprite as a green rectangle
        this.sprite = scene.add.rectangle(x, y, 32, 48, 0x00ff00);
        scene.physics.add.existing(this.sprite);
        
        // Store reference to this instance on the sprite
        this.sprite.zombieInstance = this;
        
        // Physics properties
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(300);
        
        // Zombie properties
        this.speed = 50;
        this.health = 2;
        this.isStunned = false;
        this.STUN_DURATION = 500; // ms
    }

    update(player) {
        if (!this.sprite.active || this.isStunned) return;

        // Simple follow behavior
        const direction = player.x > this.sprite.x ? 1 : -1;
        this.sprite.body.setVelocityX(this.speed * direction);
        this.sprite.scaleX = direction;

        // Flip animation when changing direction
        if (this.sprite.scaleX !== direction) {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: direction,
                duration: 100
            });
        }
    }

    damage() {
        this.health--;
        this.isStunned = true;
        
        // Visual feedback
        const originalColor = 0x00ff00;
        const hitColor = 0xff0000;
        
        // Flash red when hit
        this.sprite.fillColor = hitColor;
        
        // Knockback animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 20,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        // Reset after stun
        this.scene.time.delayedCall(this.STUN_DURATION, () => {
            this.isStunned = false;
            this.sprite.fillColor = originalColor;
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleY: 0,
            scaleX: 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }
} 