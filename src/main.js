
let config = {
    type: Phaser.AUTO,
    render: {
        pixelArt: true
    },
    width: 320,
    height: 240,
    zoom: 2,
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [ Load, Cell, Map ]
}

// define game
const game = new Phaser.Game(config)

// define globals
let centerX = game.config.width / 2;
let centerY = game.config.height / 2;
let game_width = game.config.width;
let game_height = game.config.height;

let keyR;
let keyPeriod;
let keyComma;
let map;
let waveTable