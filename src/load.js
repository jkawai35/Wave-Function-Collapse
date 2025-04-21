
class Load extends Phaser.Scene {
    constructor() {
        super('loadScene')
    }

    preload() {
        // load the visual goodz
        this.load.path = './assets/'
        this.load.image('tiles', "tilemap_packed.png");
    }

    create() {

        // proceed once loading completes
        this.scene.start('Map')
    }
}
