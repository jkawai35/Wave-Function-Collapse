class Map extends Phaser.Scene {
    constructor() {
        super("Map");
    }

    create() {
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 20, height: 15 });
        tileset = map.addTilesetImage('tiles', null, 16, 16, 0, 0);
        ground = map.createBlankLayer("WFC Layer", tileset);
        decoration = map.createBlankLayer("Decoration Layer", tileset);

        waveTable = [];
        defaultTable = [0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43];

        this.initializeWaveTable(waveTable, defaultTable, map.width, map.height);

        tileData = {
            0: { name: "plainGrass", weight: 20, edges: { top: "GGG", right: "GGG", bottom: "GGG", left: "GGG" }},
            1: { name: "detailGrass", weight: 15, edges: { top: "GGG", right: "GGG", bottom: "GGG", left: "GGG" }},
            2: { name: "flowerGrass", weight: 10, edges: { top: "GGG", right: "GGG", bottom: "GGG", left: "GGG" }},
            12: { name: "leftUCornerRoad", weight: 1, edges: { top: "GGG", right: "GDD", bottom: "GDD", left: "GGG" }},
            13: { name: "topRoad", weight: 1, edges: { top: "GGG", right: "GDD", bottom: "DDD", left: "GDD" }},
            14: { name: "rightUCornerRoad", weight: 1, edges: { top: "GGG", right: "GGG", bottom: "DDG", left: "GDD" }},
            24: { name: "leftRoad", weight: 1, edges: { top: "GDD", right: "DDD", bottom: "GDD", left: "GGG" }},
            25: { name: "centerRoad", weight: 1, edges: { top: "DDD", right: "DDD", bottom: "DDD", left: "DDD" }},
            26: { name: "rightRoad", weight: 1, edges: { top: "DDG", right: "GGG", bottom: "DDG", left: "DDD" }},
            36: { name: "leftBCornerRoad", weight: 1, edges: { top: "GDD", right: "DDG", bottom: "GGG", left: "GGG" }},
            37: { name: "bottomRoad", weight: 1, edges: { top: "DDD", right: "DDG", bottom: "GGG", left: "DDG" }},
            38: { name: "rightBCornerRoad", weight: 1, edges: { top: "DDG", right: "GGG", bottom: "GGG", left: "DDG" }},
            39: { name: "allRoad1", weight: 1, edges: { top: "DDD", right: "DDD", bottom: "DDD", left: "DDD" }},
            40: { name: "allRoad2", weight: 1, edges: { top: "DDD", right: "DDD", bottom: "DDD", left: "DDD" }},
            41: { name: "allRoad3", weight: 1, edges: { top: "DDD", right: "DDD", bottom: "DDD", left: "DDD" }},
            42: { name: "allRoad4", weight: 1, edges: { top: "DDD", right: "DDD", bottom: "DDD", left: "DDD" }},
            43: { name: "grassStone", weight: 2, edges: { top: "GGG", right: "GGG", bottom: "GGG", left: "GGG" }},
        };
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(keyS)) {
            if (!started) {
                this.WFC(waveTable, tileData, map_width, map_height, ground);
                // this.WFCLexical(waveTable, tileData, map_width, map_height, ground);
                this.placeDecorations(map_width, map_height, decoration);
                started = true;
            }
        }
    }

    defineBiomes(width, height) {
        const biomeMap = [];
        for (let y = 0; y < height; y++) {
            biomeMap[y] = [];
            for (let x = 0; x < width; x++) {
                if (x < width / 2) {
                    biomeMap[y][x] = "grass";
                } else if (y < height / 2) {
                    biomeMap[y][x] = "road";
                } else {
                    biomeMap[y][x] = "stone";
                }
            }
        }
        return biomeMap;
    }

    initializeWaveTable(waveTable, defaultTable, width, height) {
        const biomeMap = this.defineBiomes(width, height);
        for (let y = 0; y < height; y++) {
            waveTable[y] = [];
            for (let x = 0; x < width; x++) {
                let allowed;
                const biome = biomeMap[y][x];

                if (biome === "grass") {
                    allowed = [0, 1, 2, 43];  // grassy tiles
                } else if (biome === "road") {
                    allowed = [12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42];  // road tiles
                } else if (biome === "stone") {
                    allowed = [43, 0];  // mostly stone, some grass
                } else {
                    allowed = defaultTable;
                }

                waveTable[y][x] = {
                    collapsed: false,
                    options: allowed.slice()
                };
            }
        }
    }
}
