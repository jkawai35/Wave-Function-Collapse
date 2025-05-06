// Add these constants at the top of map.js
const TERRAIN_TYPES = {
    GRASS: [0, 1, 2, 43],
    ROAD: [12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42],
    WATER: [3, 4, 5, 15, 16, 17, 27, 28, 29, 30, 31, 32, 33, 34, 35]
};

// Add these new methods to the Map class
generateBiomes(width, height) ;
    // Create a heightmap for biome distribution
    const heightmap = this.createHeightmap(width, height);
    
    // Determine biome for each cell
    const biomeMap = [];
    for (let y = 0; y < height; y++) {
        biomeMap[y] = [];
        for (let x = 0; x < width; x++) {
            const value = heightmap[y][x];
            
            if (value < 0.3) {
                biomeMap[y][x] = 'WATER';
            } else if (value < 0.7) {
                biomeMap[y][x] = 'GRASS';
            } else {
                biomeMap[y][x] = 'ROAD';
            }
        }
    }
    
    return biomeMap;
}

createHeightmap(width, height) {
    // Simple noise-based heightmap
    const heightmap = [];
    const scale = 0.1;
    
    for (let y = 0; y < height; y++) {
        heightmap[y] = [];
        for (let x = 0; x < width; x++) {
            // Simple noise function - replace with Perlin noise for better results
            const value = Math.abs(Math.sin(x * scale) * Math.cos(y * scale));
            heightmap[y][x] = (value + 1) / 2; // Normalize to 0-1
        }
    }
    
    return heightmap;
}

initializeBiomeSeeds(waveTable, biomeMap, tileData) {
    // Place seed tiles for each biome
    for (let y = 0; y < biomeMap.length; y++) {
        for (let x = 0; x < biomeMap[0].length; x++) {
            const biome = biomeMap[y][x];
            const possibleTiles = TERRAIN_TYPES[biome];
            
            // Only initialize if this cell hasn't been processed yet
            if (!waveTable[y][x].collapsed) {
                waveTable[y][x].possibilities = possibleTiles.slice();
                waveTable[y][x].entropy = possibleTiles.length;
            }
        }
    }
}

// Modify your WFC method to use biomes:
WFC(waveTable, tileData, width, height, layer) {
    // First generate biome map
    const biomeMap = this.generateBiomes(width, height);
    
    // Initialize wave table with biome constraints
    this.initializeBiomeSeeds(waveTable, biomeMap, tileData);
    
    // Place initial seed tiles
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    const startBiome = biomeMap[startY][startX];
    const startTileIndex = TERRAIN_TYPES[startBiome][
        Math.floor(Math.random() * TERRAIN_TYPES[startBiome].length)
    ];
    
    const startCell = waveTable[startY][startX];
    startCell.possibilities = [startTileIndex];
    startCell.entropy = 0;
    startCell.collapsed = true;
    layer.putTileAt(startTileIndex, startX, startY);
    this.propagate(waveTable, tileData, startCell, layer);

    // Rest of the WFC algorithm remains the same...
    let current = startCell;
    let currentTries = 1;
    const maxTries = width * height;

    while (currentTries <= maxTries) {
        let nextCell = this.findLowestEntropyCell(waveTable);
        if (!nextCell) break;

        const tileIndex = this.weightedPick(nextCell.possibilities, tileData);
        nextCell.possibilities = [tileIndex];
        nextCell.entropy = 0;
        currentTries++;

        layer.putTileAt(tileIndex, nextCell.x, nextCell.y);
        nextCell.collapsed = true;

        let success = this.propagate(waveTable, tileData, nextCell, layer);
        if (!success) {
            // On contradiction, reset and try again with new seed
            this.initializeWaveTable(waveTable, defaultTable, width, height);
            this.initializeBiomeSeeds(waveTable, biomeMap, tileData);
            
            const newX = Math.floor(Math.random() * width);
            const newY = Math.floor(Math.random() * height);
            const newBiome = biomeMap[newY][newX];
            const newTile = TERRAIN_TYPES[newBiome][
                Math.floor(Math.random() * TERRAIN_TYPES[newBiome].length)
            ];
            
            const newStart = waveTable[newY][newX];
            newStart.possibilities = [newTile];
            newStart.entropy = 0;
            newStart.collapsed = true;

            layer.putTileAt(newTile, newX, newY);
            this.propagate(waveTable, tileData, newStart, layer);

            current = newStart;
            currentTries++;
            continue;
        }

        current = nextCell;
    }
    
    this.checkAllCollapsed(waveTable, width, height);
}