export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create the player sprite as a red rectangle
        this.sprite = scene.add.rectangle(x, y, 32, 48, 0xff0000);
        scene.physics.add.existing(this.sprite);
        
        // Physics properties
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(300);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setFriction(1, 1);
        this.sprite.body.setDrag(100, 0);
        this.sprite.body.setMaxVelocity(300, 600);
        
        // Player properties
        this.health = 100;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.ATTACK_COOLDOWN_TIME = 300; // ms
        this.isInvulnerable = false;
        this.INVULNERABILITY_TIME = 1000; // ms
        this.strongAttackCooldown = 0;
        this.STRONG_ATTACK_COOLDOWN_TIME = 1000; // ms
        this.specialItemCooldown = 0;
        this.SPECIAL_ITEM_COOLDOWN_TIME = 5000; // ms
        
        // Create attack hitbox (invisible by default)
        this.attackHitbox = scene.add.rectangle(0, 0, 30, 30, 0xff0000, 0);
        scene.physics.add.existing(this.attackHitbox, true);
        this.attackHitbox.visible = false;

        // Add health text
        this.healthText = scene.add.text(16, 50, `Health: ${this.health}`, {
            fontSize: '24px',
            fill: '#fff'
        });
    }

    update(keys, time) {
        if (!this.sprite.active) return;

        // Get nearby enemies to check for blocked directions
        const nearbyEnemies = this.scene.enemies.getChildren();
        const blockedDirections = this.getBlockedDirections(nearbyEnemies);

        // Movement
        if (keys.left.isDown) {
            if (!blockedDirections.left) {
                this.sprite.body.setVelocityX(-160);
                this.sprite.scaleX = -1; // Flip the rectangle
            } else {
                this.sprite.body.setVelocityX(0);
            }
        } else if (keys.right.isDown) {
            if (!blockedDirections.right) {
                this.sprite.body.setVelocityX(160);
                this.sprite.scaleX = 1;
            } else {
                this.sprite.body.setVelocityX(0);
            }
        } else {
            this.sprite.body.setVelocityX(0);
        }

        // Jumping (both W and spacebar)
        if ((keys.up.isDown || keys.jump.isDown) && this.sprite.body.touching.down) {
            this.sprite.body.setVelocityY(-330);
            this.animateJump();
        }

        // Regular punch (J)
        if (keys.punch.isDown && time > this.attackCooldown) {
            this.punch();
            this.attackCooldown = time + this.ATTACK_COOLDOWN_TIME;
        }

        // Strong attack (K)
        if (keys.strongAttack.isDown && time > this.strongAttackCooldown) {
            this.strongAttack();
            this.strongAttackCooldown = time + this.STRONG_ATTACK_COOLDOWN_TIME;
        }

        // Special item (L)
        if (keys.specialItem.isDown && time > this.specialItemCooldown) {
            this.useSpecialItem();
            this.specialItemCooldown = time + this.SPECIAL_ITEM_COOLDOWN_TIME;
        }

        // Update attack hitbox position
        const direction = this.sprite.scaleX;
        this.attackHitbox.x = this.sprite.x + (40 * direction);
        this.attackHitbox.y = this.sprite.y;

        // Update health text
        this.healthText.setText(`Health: ${this.health}`);
    }

    getBlockedDirections(enemies) {
        const blockedDirections = {
            left: false,
            right: false
        };

        const BLOCKING_DISTANCE = 40; // Distance at which enemies block movement

        for (const enemy of enemies) {
            const dx = enemy.x - this.sprite.x;
            const dy = Math.abs(enemy.y - this.sprite.y);
            
            // Only consider enemies at roughly the same height
            if (dy < 40) {
                if (dx > 0 && dx < BLOCKING_DISTANCE) {
                    blockedDirections.right = true;
                } else if (dx < 0 && Math.abs(dx) < BLOCKING_DISTANCE) {
                    blockedDirections.left = true;
                }
            }
        }

        return blockedDirections;
    }

    punch() {
        this.isAttacking = true;
        
        // Visual feedback for attack
        const originalColor = 0xff0000;
        const attackColor = 0xff6666;
        this.sprite.fillColor = attackColor;
        
        // Show and position attack hitbox
        this.attackHitbox.visible = true;

        // Reset after attack
        this.scene.time.delayedCall(150, () => {
            this.isAttacking = false;
            this.sprite.fillColor = originalColor;
            this.attackHitbox.visible = false;
        });
    }

    strongAttack() {
        this.isAttacking = true;
        
        // Visual feedback for strong attack
        const originalColor = 0xff0000;
        const strongAttackColor = 0xff0000;
        this.sprite.fillColor = strongAttackColor;
        
        // Show and position attack hitbox with larger area
        this.attackHitbox.width = 45; // Larger attack area
        this.attackHitbox.visible = true;

        // Reset after attack
        this.scene.time.delayedCall(300, () => {
            this.isAttacking = false;
            this.sprite.fillColor = originalColor;
            this.attackHitbox.visible = false;
            this.attackHitbox.width = 30; // Reset to normal size
        });
    }

    useSpecialItem() {
        // Visual feedback for special item use
        const originalColor = 0xff0000;
        const specialColor = 0x00ffff;
        this.sprite.fillColor = specialColor;
        
        // Add special effect (example: temporary invulnerability)
        this.isInvulnerable = true;
        
        // Reset after duration
        this.scene.time.delayedCall(2000, () => {
            this.sprite.fillColor = originalColor;
            this.isInvulnerable = false;
        });
    }

    damage(amount) {
        if (this.isInvulnerable) return;
        
        this.health -= amount;
        this.isInvulnerable = true;

        // Visual feedback for damage
        this.animateDamage();

        if (this.health <= 0) {
            this.die();
        } else {
            // Reset invulnerability after delay
            this.scene.time.delayedCall(this.INVULNERABILITY_TIME, () => {
                this.isInvulnerable = false;
                this.sprite.alpha = 1;
            });
        }
    }

    animateDamage() {
        // Flash red and white
        const flashCount = 4;
        const flashDuration = this.INVULNERABILITY_TIME / (flashCount * 2);
        
        for (let i = 0; i < flashCount; i++) {
            this.scene.time.delayedCall(i * flashDuration * 2, () => {
                this.sprite.alpha = 0.5;
            });
            this.scene.time.delayedCall((i * flashDuration * 2) + flashDuration, () => {
                this.sprite.alpha = 1;
            });
        }
    }

    animateJump() {
        // Squash and stretch animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleY: [0.8, 1.2, 1],
            scaleX: [1.2, 0.8, 1],
            duration: 300,
            ease: 'Power1'
        });
    }

    die() {
        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleY: 0,
            scaleX: 2,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.setActive(false);
                // Show game over text
                const centerX = this.scene.cameras.main.centerX;
                const centerY = this.scene.cameras.main.centerY;
                this.scene.add.text(centerX, centerY, 'Game Over\nPress R to restart', {
                    fontSize: '48px',
                    fill: '#fff',
                    align: 'center'
                }).setOrigin(0.5);

                // Add key listener for restart
                this.scene.input.keyboard.once('keydown-R', () => {
                    this.scene.scene.restart();
                });
            }
        });
    }
} 