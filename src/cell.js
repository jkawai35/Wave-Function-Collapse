
class Cell extends Phaser.Scene {
    constructor(entropy, possibilities, x, y) {
        super('Cell')
        this.entropy = entropy;
        this.possibilities = possibilities
    }
}
