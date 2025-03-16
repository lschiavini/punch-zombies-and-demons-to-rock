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
        this.currentFloor = 1;
        this.maxFloors = 10;
        this.levelWidth = 780;  // Slightly less than game width
        this.levelHeight = 200; // Slightly less than game height
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
        console.log('Gamepad connected:', pad.id);
    });

    // Handle gamepad disconnection
    this.input.gamepad.on('disconnected', (pad) => {
        if (this.gamepad === pad) {
            this.gamepad = null;
        }
    });
    }

    movePlayerMobile () {
        // Create mobile control buttons
        const buttonLeft = this.add.image(0, 0, 'button');
        const buttonRight = this.add.image(140, 0, 'button');
        const buttonJump = this.add.image(1400, 800, 'button');
        const buttonPunch = this.add.image(1300, 900, 'button');
        const buttonStrongAttack = this.add.image(1400, 900, 'button');
        const buttonSpecialItem = this.add.image(1500, 900, 'button');

        // Group movement buttons
        const directionButtons = this.add.container(50, 900, [buttonLeft, buttonRight]);

        // Make all buttons interactive
        buttonLeft.setInteractive();
        buttonRight.setInteractive();
        buttonJump.setInteractive();
        buttonPunch.setInteractive();
        buttonStrongAttack.setInteractive();
        buttonSpecialItem.setInteractive();

        // Movement controls
        buttonLeft.on('pointerdown', () => {
            this.keys.left.isDown = true;
        });
        buttonLeft.on('pointerup', () => {
            this.keys.left.isDown = false;
        });

        buttonRight.on('pointerdown', () => {
            this.keys.right.isDown = true;
        });
        buttonRight.on('pointerup', () => {
            this.keys.right.isDown = false;
        });

        // Action controls
        buttonJump.on('pointerdown', () => {
            this.keys.jump.isDown = true;
        });
        buttonJump.on('pointerup', () => {
            this.keys.jump.isDown = false;
        });

        buttonPunch.on('pointerdown', () => {
            this.keys.punch.isDown = true;
        });
        buttonPunch.on('pointerup', () => {
            this.keys.punch.isDown = false;
        });

        buttonStrongAttack.on('pointerdown', () => {
            this.keys.strongAttack.isDown = true;
        });
        buttonStrongAttack.on('pointerup', () => {
            this.keys.strongAttack.isDown = false;
        });

        buttonSpecialItem.on('pointerdown', () => {
            this.keys.specialItem.isDown = true;
        });
        buttonSpecialItem.on('pointerup', () => {
            this.keys.specialItem.isDown = false;
        });

        // Enable multi-touch
        this.input.addPointer(3); // Support up to 4 simultaneous touches
        directionButtons.on('pointerdown', () => {
            this.keys.left.isDown = true;
        });
        directionButtons.on('pointerup', () => {
            this.keys.left.isDown = false;
        });

        directionButtons.on('pointerdown', () => {
            this.keys.right.isDown = true;
        });
        directionButtons.on('pointerup', () => {
            this.keys.right.isDown = false;
        });

    }

    create ()
    {
        console.log('Game scene created');
        // Create the bordered level
        this.createWorld();

        // Create the player
        this.player = new Player(this, 100, this.levelHeight + 150);

        // Create enemies group
        this.enemies = this.add.group();
        this.createEnemies();

        // Setup camera
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, 800, 600);

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
            this.movePlayerMobile = () => {
                // Assuming you have buttons like buttonLeft, buttonRight, etc.
                buttonLeft.on('pointerdown', () => { this.mobileInput.left = true; });
                buttonLeft.on('pointerup', () => { this.mobileInput.left = false; });
                buttonRight.on('pointerdown', () => { this.mobileInput.right = true; });
                buttonRight.on('pointerup', () => { this.mobileInput.right = false; });
                // Add similar handlers for jump, punch, etc.
                buttonJump.on('pointerdown', () => { this.mobileInput.jump = true; });
                buttonJump.on('pointerup', () => { this.mobileInput.jump = false; });
                buttonPunch.on('pointerdown', () => { this.mobileInput.punch = true; });
                buttonPunch.on('pointerup', () => { this.mobileInput.punch = false; });
                buttonStrongAttack.on('pointerdown', () => { this.mobileInput.strongAttack = true; });
                buttonStrongAttack.on('pointerup', () => { this.mobileInput.strongAttack = false; });
                buttonSpecialItem.on('pointerdown', () => { this.mobileInput.specialItem = true; });
                buttonSpecialItem.on('pointerup', () => { this.mobileInput.specialItem = false; });
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
    }

    createWorld() {
        // Create the walls group
        this.walls = this.physics.add.staticGroup();

        // Create border walls (blue rectangles)
        const wallThickness = 10;
        const wallColor = 0x0000ff;

        // Top wall
        this.walls.add(this.add.rectangle(400, 200, this.levelWidth, wallThickness, wallColor));
        // Bottom wall
        this.walls.add(this.add.rectangle(400, 400, this.levelWidth, wallThickness, wallColor));
        // Left wall
        this.walls.add(this.add.rectangle(400 - this.levelWidth/2, 300, wallThickness, 200, wallColor));
        // Right wall
        this.walls.add(this.add.rectangle(400 + this.levelWidth/2, 300, wallThickness, 200, wallColor));

        // Make walls solid
        for (const wall of this.walls.getChildren()) {
            const body = wall.body;
            body.updateFromGameObject();
        }

        // Add floor number text
        this.add.text(16, 16, `Floor ${this.currentFloor}/${this.maxFloors}`, {
            fontSize: '32px',
            fill: '#fff'
        });
    }

    createEnemies() {
        // Create 3 enemies starting from x=150
        for (let i = 0; i < 3; i++) {
            const x = 450 + (i * 100); // Space enemies 100px apart starting at x=150
            const maxY = 400 - 20; // Bottom wall y position minus margin
            const sizeOfEnemy = -32;
            const y = maxY + sizeOfEnemy; // Place enemies on the ground
            
            const zombie = new Zombie(this, x, y);
            this.enemies.add(zombie.sprite);
        }
    }

    handlePlayerAttack(hitbox, enemy) {
        console.log('Overlap detected with enemy');
        if (this.player.isAttacking && enemy.zombieInstance) {
            console.log('Applying damage to zombie');
            enemy.zombieInstance.damage();
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemy) {
        console.log('Collision detected with player');
        if (enemy.zombieInstance && !this.player.isInvulnerable) {
            console.log('Applying damage to player');
            this.player.damage(10);
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
        }
        this.updateInputState();
        this.player.update(this.inputState, time);
        
        for (const enemy of this.enemies.getChildren()) {
            const zombie = enemy.zombieInstance;
            if (zombie) {
                zombie.update(this.player);
            }
        }
    }
}
