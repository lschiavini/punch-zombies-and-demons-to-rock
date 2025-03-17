import Phaser from 'phaser';

export class CharacterSelect extends Phaser.Scene {
    constructor() {
        super('CharacterSelect');
    }

    preload() {
        // Load preview images for character selection
        this.load.spritesheet('fighter-preview', 'assets/images/sprites/boys/fighter/Idle.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('shinobi-preview', 'assets/images/sprites/boys/shinobi/Idle.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('samurai-preview', 'assets/images/sprites/boys/samurai/Idle.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        // Add title text
        this.add.text(400, 100, 'Select Your Character', {
            fontSize: '36px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create character selection buttons
        const fighterBtn = this.createCharacterButton(200, 300, 'fighter-preview', 'fighter');
        const shinobiBtn = this.createCharacterButton(400, 300, 'shinobi-preview', 'shinobi');
        const samuraiBtn = this.createCharacterButton(600, 300, 'samurai-preview', 'samurai');
        
        // Add character name labels
        this.add.text(200, 400, 'Fighter', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 400, 'Shinobi', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(600, 400, 'Samurai', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
    }

    createCharacterButton(x, y, spriteKey, characterType) {
        // Create a button with character preview image
        const button = this.add.image(x, y, spriteKey)
            .setInteractive()
            .setScale(2);
            
        // Add hover effect
        button.on('pointerover', () => {
            button.setTint(0xffff00);
        });
        
        button.on('pointerout', () => {
            button.clearTint();
        });
        
        // Start the game with selected character when clicked
        button.on('pointerdown', () => {
            this.scene.start('Game', { characterType: characterType });
        });
        
        return button;
    }
} 