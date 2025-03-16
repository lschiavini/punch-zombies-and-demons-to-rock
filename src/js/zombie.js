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
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setFriction(1, 1);
        this.sprite.body.setDrag(100, 0);
        this.sprite.body.setMaxVelocity(200, 600);
        
        // Zombie properties
        this.speed = 50;
        this.health = 25;
        this.isStunned = false;
        this.STUN_DURATION = 500; // ms
        this.MIN_DISTANCE = 32; // Minimum distance to maintain from player

        // Attack properties
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.ATTACK_COOLDOWN_TIME = 1000; // ms - zombies attack slower than player
        this.attackDamage = 10;
        
        // Create attack hitbox (invisible by default)
        this.attackHitbox = scene.add.rectangle(0, 0, 100, 50, 0xff0000, 0);
        scene.physics.add.existing(this.attackHitbox, true);
        this.attackHitbox.visible = false;
    }

    update(player) {
        if (!this.sprite.active || this.isStunned) return;
    
        // Calculate distance to player using player.sprite
        const dx = player.sprite.x - this.sprite.x;
        const dy = player.sprite.y - this.sprite.y;
        
        // Update attack hitbox position and facing direction
        const direction = dx > 0 ? 1 : -1;
        this.sprite.scaleX = direction;
        this.attackHitbox.x = this.sprite.x + (40 * direction);
        this.attackHitbox.y = this.sprite.y;
        this.attackHitbox.body.reset(this.attackHitbox.x, this.attackHitbox.y);
        
        // Calculate distance to player
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Define behavior zones
        const ATTACK_RANGE = 50;
        const CHASE_RANGE = 300;
        
        if (distance <= ATTACK_RANGE) {
            // In attack range - stop and attack
            this.sprite.body.setVelocityX(0);
            if (!this.isAttacking && this.scene.time.now > this.attackCooldown) {
                this.attack(player);
            }
        } else if (distance <= CHASE_RANGE) {
            // In chase range - move toward player
            this.sprite.body.setVelocityX(this.speed * direction);
        } else {
            // Too far - stop moving
            this.sprite.body.setVelocityX(0);
        }
    }

    attack(player) {
        this.isAttacking = true;
        this.attackCooldown = this.scene.time.now + this.ATTACK_COOLDOWN_TIME;
    
        // Calculate distance to player
        const dx = player.sprite.x - this.sprite.x;
        const distance = Math.abs(dx);

        const STRIKE_RANGE = 80;
    
        // Check if player is within strike range
        if (distance <= STRIKE_RANGE) {
            player.damage(this.attackDamage); // Directly apply damage to the player
        }
    
        // Visual feedback for attack
        const originalColor = 0x00ff00;
        const attackColor = 0x66ff66;
        this.sprite.fillColor = attackColor;
    
        // Attack animation
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + (this.sprite.scaleX * 20),
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    
        // Reset after attack
        this.scene.time.delayedCall(300, () => {
            this.isAttacking = false;
            this.sprite.fillColor = originalColor;
        });
    }

    damage() {
        this.health--;
        this.isStunned = true;
        
        // Visual feedback
        const originalColor = 0x00ff00;
        const hitColor = 0xff0000;
        
        // Flash red when hit
        this.sprite.fillColor = hitColor;

        const direction = this.sprite.scaleX;
        // Knockback animation
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 5,
            x: this.sprite.x - (direction * 5),
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