window.onload = function () {
    let config = {
        type: Phaser.AUTO,
        parent: 'game-container',
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
    };

    new Phaser.Game(config);
};

// define game

// define globals
let map_height = 15
let map_width = 20

let keyR
let keyS
let keyL
let keyD
let map
let waveTable
let tileData
let ground
let decoration
let defaultTable
let tileset
let started = false
let WFCselection
let wfcActive = false
let wfcTimer = 0
let wfcDelay = 100