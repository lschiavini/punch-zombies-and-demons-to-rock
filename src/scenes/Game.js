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
        this.keys = {
            // Movement
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            // Actions
            jump: this.input.keyboard.addKey('SPACE'),
            punch: this.input.keyboard.addKey('J'),
            strongAttack: this.input.keyboard.addKey('K'),
            specialItem: this.input.keyboard.addKey('L')
        };

        // Add mobile controls if on touch device
        if (this.sys.game.device.input.touch) {
            // Create movement buttons
            const buttonSize = 64;
            const padding = 20;
            const y = this.cameras.main.height - buttonSize - padding;
            
            // Left button
            const leftBtn = this.add.circle(-padding - buttonSize/2, y, buttonSize/2, 0x888888, 0.5)
                .setScrollFactor(0)
                .setInteractive();
            leftBtn.on('pointerdown', () => { this.keys.left.isDown = true; });
            leftBtn.on('pointerup', () => { this.keys.left.isDown = false; });
            leftBtn.on('pointerout', () => { this.keys.left.isDown = false; });
            
            // Right button
            const rightBtn = this.add.circle(-padding - buttonSize*1.75, y, buttonSize/2, 0x888888, 0.5)
                .setScrollFactor(0)
                .setInteractive();
            rightBtn.on('pointerdown', () => { this.keys.right.isDown = true; });
            rightBtn.on('pointerup', () => { this.keys.right.isDown = false; });
            rightBtn.on('pointerout', () => { this.keys.right.isDown = false; });

            // Jump button
            const jumpBtn = this.add.circle(this.cameras.main.width + padding + buttonSize*2.5, y, buttonSize/2, 0x888888, 0.5)
                .setScrollFactor(0)
                .setInteractive();
            jumpBtn.on('pointerdown', () => { this.keys.jump.isDown = true; });
            jumpBtn.on('pointerup', () => { this.keys.jump.isDown = false; });
            jumpBtn.on('pointerout', () => { this.keys.jump.isDown = false; });

            // Attack button  
            const attackBtn = this.add.circle(this.cameras.main.width + padding + buttonSize*1.25, y, buttonSize/2, 0x888888, 0.5)
                .setScrollFactor(0)
                .setInteractive();
            attackBtn.on('pointerdown', () => { this.keys.punch.isDown = true; });
            attackBtn.on('pointerup', () => { this.keys.punch.isDown = false; });
            attackBtn.on('pointerout', () => { this.keys.punch.isDown = false; });

            // Enable multi-touch
            this.input.addPointer(3); // Support up to 4 simultaneous touches

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

    update(time, delta) {
        this.player.update(this.keys, time);
        
        for (const enemy of this.enemies.getChildren()) {
            const zombie = enemy.zombieInstance;
            if (zombie) {
                zombie.update(this.player);
            }
        }
    }
}
