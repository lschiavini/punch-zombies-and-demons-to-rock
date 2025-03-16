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
        this.player = new Player(this, 100, 300);

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

        // Add colliders
        this.physics.add.collider(this.player.sprite, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player.sprite, this.enemies);
        
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
        // Create 3 enemies at random positions within the walls
        for (let i = 0; i < 3; i++) {
            // Calculate spawn area based on wall positions
            const spawnMargin = 20; // Keep enemies away from walls
            const minX = 400 - this.levelWidth/2 + spawnMargin;
            const maxX = 400 + this.levelWidth/2 - spawnMargin;
            const minY = 200 + spawnMargin; // Top wall y position
            const maxY = 400 - spawnMargin; // Bottom wall y position

            const x = Phaser.Math.Between(minX, maxX);
            const y = Phaser.Math.Between(minY, maxY);
            const zombie = new Zombie(this, x, y);
            this.enemies.add(zombie.sprite);
        }
    }

    handlePlayerAttack(hitbox, enemy) {
        if (this.player.isAttacking && enemy.zombieInstance) {
            enemy.zombieInstance.damage();
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemy) {
        if (enemy.zombieInstance && !this.player.isInvulnerable) {
            this.player.damage(10);
        }
    }

    update(time, delta) {
        console.log('Update called');
        this.player.update(this.keys, time);
        
        // Update all enemies
        for (const enemy of this.enemies.getChildren()) {
            const zombie = enemy.zombieInstance;
            if (zombie) {
                zombie.update(this.player.sprite);
            }
        }
    }
}
