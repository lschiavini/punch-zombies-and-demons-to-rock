import Phaser from 'phaser';
import { Player } from '../js/player.js';
import { Zombie } from '../js/zombie.js';

export class Game extends Phaser.Scene
{
    constructor ()
    {
        super('Game');
    }

    init() {
        this.isGameOver = false;
        this.currentFloor = 1;
        this.maxFloors = 10;
        this.levelWidth = 5000; // Changed from 780 to 2000 for a wider level
        this.levelHeight = 200; // Slightly less than game height
        this.enemiesKilled = 0; 
        this.inputState = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            punch: false,
            strongAttack: false,
            specialItem: false
        };
    }

    preload() {
        this.load.spritesheet('player', 'assets/images/sprites/hooded_character.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    movePlayerDesktop () {
        this.keys = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            jump: this.input.keyboard.addKey('SPACE'),
            punch: this.input.keyboard.addKey('J'),
            strongAttack: this.input.keyboard.addKey('K'),
            specialItem: this.input.keyboard.addKey('L')
        };
    }

    movePlayerGamepad () {
          // Initialize virtual keys for gamepad
          this.gamepadKeys = {
              up: { isDown: false },
              down: { isDown: false },
              left: { isDown: false },
              right: { isDown: false },
              jump: { isDown: false },      // A button
              punch: { isDown: false },     // X button
              strongAttack: { isDown: false }, // Y button
              specialItem: { isDown: false }   // B button
          };

         // Handle gamepad connection
         this.input.gamepad.on('connected', (pad) => {
             this.gamepad = pad;
         });

         // Handle gamepad disconnection
         this.input.gamepad.on('disconnected', (pad) => {
             if (this.gamepad === pad) {
                 this.gamepad = null;
             }
         });
    }

    createMobileButton(x, y, label) {
        // Create a rectangle as the button background
        const button = this.add.rectangle(x, y, 80, 80, 0x6666ff).setInteractive().setScrollFactor(0);
        // Add centered text on top of the rectangle
        const text = this.add.text(x, y, label, { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5) // Center the text
            .setScrollFactor(0); // Keep text fixed with the button
        return button;
    }


    movePlayerMobile() {
        // Create mobile control buttons with adjusted positions (assuming 800x600 canvas)
        this.buttonLeft = this.createMobileButton(50, 500, 'Left');
        this.buttonRight = this.createMobileButton(190, 500, 'Right');
        this.buttonJump = this.createMobileButton(700, 400, 'Jump');
        this.buttonPunch = this.createMobileButton(600, 500, 'Punch');
        this.buttonStrongAttack = this.createMobileButton(700, 500, 'Strong');
        this.buttonSpecialItem = this.createMobileButton(750, 500, 'Item');

        // Movement controls
        this.buttonLeft.on('pointerdown', () => { this.mobileInput.left = true; });
        this.buttonLeft.on('pointerup', () => { this.mobileInput.left = false; });
        this.buttonRight.on('pointerdown', () => { this.mobileInput.right = true; });
        this.buttonRight.on('pointerup', () => { this.mobileInput.right = false; });

        // Action controls
        this.buttonJump.on('pointerdown', () => { this.mobileInput.jump = true; });
        this.buttonJump.on('pointerup', () => { this.mobileInput.jump = false; });
        this.buttonPunch.on('pointerdown', () => { this.mobileInput.punch = true; });
        this.buttonPunch.on('pointerup', () => { this.mobileInput.punch = false; });
        this.buttonStrongAttack.on('pointerdown', () => { this.mobileInput.strongAttack = true; });
        this.buttonStrongAttack.on('pointerup', () => { this.mobileInput.strongAttack = false; });
        this.buttonSpecialItem.on('pointerdown', () => { this.mobileInput.specialItem = true; });
        this.buttonSpecialItem.on('pointerup', () => { this.mobileInput.specialItem = false; });

        this.input.addPointer(3);
    }

    createAnimations() {
        // Row 1: Idle/Still
        this.anims.create({
            key: 'still',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 1] }),
            frameRate: 10,
            repeat: -1
        });

        // Row 2: Alternate Idle/Still
        this.anims.create({
            key: 'still2',
            frames: this.anims.generateFrameNumbers('player', { frames: [8, 9] }),
            frameRate: 10,
            repeat: -1
        });

        // Row 3: Walk
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { frames: [16, 17, 18, 19] }),
            frameRate: 10,
            repeat: -1
        });

        // Row 4: Fast Walk/Run
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { frames: [24, 25, 26, 27, 28, 29, 30, 31] }),
            frameRate: 15,
            repeat: -1
        });

        // Row 5: Dodge
        this.anims.create({
            key: 'dodge',
            frames: this.anims.generateFrameNumbers('player', { frames: [32, 33, 34, 35, 36, 37] }),
            frameRate: 12,
            repeat: 0
        });

        // Row 6: Jump
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('player', { frames: [40, 41, 42, 43, 44, 45, 46, 47] }),
            frameRate: 10,
            repeat: 0
        });

        // Row 7: Disappear
        this.anims.create({
            key: 'disappear',
            frames: this.anims.generateFrameNumbers('player', { frames: [48, 49, 50] }),
            frameRate: 10,
            repeat: 0
        });

        // Row 8: Die
        this.anims.create({
            key: 'die',
            frames: this.anims.generateFrameNumbers('player', { frames: [56, 57, 58, 59, 60, 61, 62, 63] }),
            frameRate: 8,
            repeat: 0
        });

        // Row 9: Attack
        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNumbers('player', { frames: [64, 65, 66, 67, 68, 69, 70, 71] }),
            frameRate: 12,
            repeat: 0
        });
    }

    create () {
        this.createAnimations();
        // Create the bordered level
        this.createWorld();

        // Create the player
        this.player = new Player(this, 100, this.levelHeight + 150);

        // // New player position text, placed below floor text
        // this.playerPosText = this.add.text(16, 60, `X: ${Math.round(this.player.sprite.x)}`, {
        //     fontSize: '32px',
        //     fill: '#fff'
        // });
        // this.playerPosText.setScrollFactor(0);

        // Create enemies group
        this.enemies = this.add.group();
        this.createEnemies();

        // Setup camera
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, this.levelWidth, 600); // Updated bounds to 2000 width

        // Setup input
        this.movePlayerDesktop();
        this.movePlayerGamepad();

        // Add mobile controls if on touch device
        if (this.sys.game.device.input.touch) {
            this.mobileInput = {
                left: false,
                right: false,
                up: false,
                down: false,
                jump: false,
                punch: false,
                strongAttack: false,
                specialItem: false
            };
            this.movePlayerMobile();
        } else {
            this.mobileInput = null;
        }

        // Add colliders
        this.physics.add.collider(this.player.sprite, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        
        // Add solid collision between player and enemies with separation
        this.physics.add.collider(
            this.player.sprite,
            this.enemies,
            null,
            (player, enemy) => {
                // Calculate separation vector
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const direction = Math.sign(dx);
                
                // Immediate position correction to prevent overlap
                const minSeparation = 32; // Width of sprites
                const currentSeparation = Math.abs(dx);
                
                if (currentSeparation < minSeparation) {
                    const correction = (minSeparation - currentSeparation) / 2;
                    player.x += correction * direction;
                    enemy.x -= correction * direction;
                    
                    // Stop horizontal movement
                    player.body.velocity.x = 0;
                    enemy.body.velocity.x = 0;
                }
                return true;
            },
            this
        );
        
        // Add overlap for damage handling
        this.physics.add.overlap(
            this.player.sprite,
            this.enemies,
            this.handlePlayerEnemyCollision,
            null,
            this
        );
        
        // Add overlap between player's attack hitbox and enemies
        this.physics.add.overlap(
            this.player.attackHitbox,
            this.enemies,
            this.handlePlayerAttack,
            null,
            this
        );

         // Create the door
        this.door = this.add.rectangle(this.levelWidth - 100, 300, 50, 100, 0x8B4513);
        this.physics.add.existing(this.door, true);
        // Add collision detection between player and door
        this.physics.add.overlap(
            this.player.sprite,
            this.door,
            this.handleDoorCollision,
            null,
            this
        );
    }

    getCompletionText() {
         if (this.enemiesKilled === 0) {
            return 'LOSER. You skipped the level without killing any enemies!';
        } else if (this.enemiesKilled === 1) {
            return 'Pussy! You only killed 1 enemy!';
        } else if (this.enemiesKilled < 5) {
            return `You killed ${this.enemiesKilled} enemies! Try harder next time!`;
        } else if(this.enemiesKilled < 10) {
            return `I'm sure you could have done better`;
        } else if(this.enemiesKilled < 15) {
            return `You killed ${this.enemiesKilled} enemies! Impressive`;
        }
    }

    // Add this new method
    handleDoorCollision() { // Only show the message once if (!this.levelComplete) { this.levelComplete = true;
            // Create completion text
            const completionText = this.add.text(400, 300,
                this.getCompletionText(), {
                fontSize: '20px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 20, y: 10 }
            });
            completionText.setScrollFactor(0);
            completionText.setOrigin(0.5);

            // Optional: Make the text disappear after a few seconds
            this.time.delayedCall(3000, () => {
                completionText.destroy();
            });
    }

    createWorld() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.levelWidth, 600);
        // Create the walls group
        this.walls = this.physics.add.staticGroup();

        // Create border walls (blue rectangles)
        const wallThickness = 10;
        const wallColor = 0x0000ff;

        // Top wall
        this.walls.add(this.add.rectangle(this.levelWidth / 2, 200, this.levelWidth, wallThickness, wallColor));
        // Bottom wall
        this.walls.add(this.add.rectangle(this.levelWidth / 2, 400, this.levelWidth, wallThickness, wallColor));
        // Left wall (corrected to x = 5)
        this.walls.add(this.add.rectangle(5, 300, wallThickness, 200, wallColor));
        // Right wall (already at x = 4995)
        this.walls.add(this.add.rectangle(this.levelWidth - 5, 300, wallThickness, 200, wallColor));

        // Make walls solid
        for (const wall of this.walls.getChildren()) {
            const body = wall.body;
            body.updateFromGameObject();
        }

        // Add floor number text
        const floorText = this.add.text(16, 16, `Floor ${this.currentFloor}/${this.maxFloors}`, {
            fontSize: '32px',
            fill: '#fff'
        });
        floorText.setScrollFactor(0); // Makes the text follow the camera

        // Create completion text
        this.enemiesText = this.add.text(16, 70,
            '', {
                fontSize: '24px',
                fill: '#fff',
            });
        this.enemiesText.setScrollFactor(0);

    }

    createEnemies() {
        const maxY = 400 - 20; // 380, just above the bottom wall
        const sizeOfEnemy = -32; // Adjusts enemy position upward
        const y = maxY + sizeOfEnemy; // 348, consistent with original placement

        for (let i = 0; i < 18; i++) {
            const x = 200 + (i * 200); // Enemies at x=200, 400, 600, ..., 1800
            const zombie = new Zombie(this, x, y);
            this.enemies.add(zombie.sprite);
        }
    }

    handlePlayerAttack(hitbox, enemy) {
        if (this.player.isAttacking && enemy.zombieInstance) {
            enemy.zombieInstance.damage();
            // Increment kill count when enemy is destroyed
            if (enemy.zombieInstance.health <= 0) {
                this.enemiesKilled++;
                enemy.destroy(); // Add this line to remove the dead enemy
            }
        }
    }

    updateInputState() {
        this.inputState.left = this.keys.left.isDown || this.gamepadKeys.left.isDown || (this.mobileInput ? this.mobileInput.left : false);
        this.inputState.right = this.keys.right.isDown || this.gamepadKeys.right.isDown || (this.mobileInput ? this.mobileInput.right : false);
        this.inputState.up = this.keys.up.isDown || this.gamepadKeys.up.isDown || (this.mobileInput ? this.mobileInput.up : false);
        this.inputState.down = this.keys.down.isDown || this.gamepadKeys.down.isDown || (this.mobileInput ? this.mobileInput.down : false);
        this.inputState.jump = this.keys.jump.isDown || this.gamepadKeys.jump.isDown || (this.mobileInput ? this.mobileInput.jump : false);
        this.inputState.punch = this.keys.punch.isDown || this.gamepadKeys.punch.isDown || (this.mobileInput ? this.mobileInput.punch : false);
        this.inputState.strongAttack = this.keys.strongAttack.isDown || this.gamepadKeys.strongAttack.isDown || (this.mobileInput ? this.mobileInput.strongAttack : false);
        this.inputState.specialItem = this.keys.specialItem.isDown || this.gamepadKeys.specialItem.isDown || (this.mobileInput ? this.mobileInput.specialItem : false);
    }

    update(time, delta) {
        if (this.gamepad) {
            // Read left stick and D-pad for movement
            const leftStickX = this.gamepad.leftStick.x;  // -1 (left) to 1 (right)
            const leftStickY = this.gamepad.leftStick.y;  // -1 (up) to 1 (down)
            const dpadLeft = this.gamepad.buttons[14].pressed;  // D-pad Left
            const dpadRight = this.gamepad.buttons[15].pressed; // D-pad Right
            const dpadUp = this.gamepad.buttons[12].pressed;    // D-pad Up
            const dpadDown = this.gamepad.buttons[13].pressed;  // D-pad Down
        
            // Update movement keys (threshold of 0.5 for stick sensitivity)
            this.gamepadKeys.left.isDown = leftStickX < -0.5 || dpadLeft;
            this.gamepadKeys.right.isDown = leftStickX > 0.5 || dpadRight;
            this.gamepadKeys.up.isDown = leftStickY < -0.5 || dpadUp;
            this.gamepadKeys.down.isDown = leftStickY > 0.5 || dpadDown;
        
            // Update action buttons
            this.gamepadKeys.jump.isDown = this.gamepad.buttons[0].pressed;        // A button
            this.gamepadKeys.punch.isDown = this.gamepad.buttons[2].pressed;       // X button
            this.gamepadKeys.strongAttack.isDown = this.gamepad.buttons[3].pressed; // Y button
            this.gamepadKeys.specialItem.isDown = this.gamepad.buttons[1].pressed;  // B button

            // Restart game if game over and A button is pressed
            if (this.isGameOver && this.gamepad.buttons[0].pressed) {
               this.scene.restart();
            }
        }
        this.updateInputState();
        this.player.update(this.inputState, time);
        
        for (const enemy of this.enemies.getChildren()) {
            const zombie = enemy.zombieInstance;
            if (zombie) {
                zombie.update(this.player);
            }
        }

        if (this.enemiesText) {
            this.enemiesText.setText(`Killed: ${this.enemiesKilled}`);
        }


        const currentHealth = this.player.getHealth();
        if(currentHealth <= 0) {
            this.gameOver();
        }
        // this.playerPosText.setText(`X: ${Math.round(this.player.sprite.x)}`);
    }

    getGameOverText() {
        if (this.enemiesKilled === 0) {
            return 'LOSER. You died without killing any enemies!';
        } else if (this.enemiesKilled === 1) {
            return 'Horrible. You killed 1 enemy!';
        } else if (this.enemiesKilled < 5) {
            return `You killed ${this.enemiesKilled} enemies! Try harder next time!`;
        } else if(this.enemiesKilled < 10) {
            return `I'm sure you could have done better`;
        } else if(this.enemiesKilled < 15) {
            return `You killed ${this.enemiesKilled} enemies! Impressive`;
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.player.sprite.setActive(false);
        // Show game over text
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const gameOverTitle = this.add.text(centerX, centerY, 'Game Over\nPress R(or A) to restart', {
            fontSize: '36px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        gameOverTitle.setScrollFactor(0); // Makes the text follow the camera

        const gameOverText = this.add.text(centerX, centerY+60, this.getGameOverText(),
            {
                fontSize: '24px',
                fill: '#fff',
                align: 'center'
        }).setOrigin(0.5);

        gameOverText.setScrollFactor(0); // Makes the text follow the camera

         // Add key listener for restart
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
            this.isGameOver = false;
        });

        // Add mobile restart button if on touch device
        if (this.sys.game.device.input.touch) {
            const restartButton = this.add.rectangle(
                centerX,
                centerY + 100,
                200,
                80,
                0xff0000
            ).setInteractive().setScrollFactor(0);

            const restartText = this.add.text(
                centerX,
                centerY + 100,
                'Restart',
                { fontSize: '32px', fill: '#fff' }
            ).setOrigin(0.5).setScrollFactor(0);

            restartButton.on('pointerdown', () => {
                this.scene.restart();
            this.isGameOver = false;
            });

        }
    }
}
