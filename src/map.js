class Map extends Phaser.Scene{
    constructor() {
        super("Map")
    }

    create() {
        map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 20, height: 15 });

        const tileset = map.addTilesetImage('tiles', null, 16, 16, 0, 0);
        const layer = map.createBlankLayer("WFC Layer", tileset);
        const waveTable = []
        const defaultTable = [0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38]

        for (let i = 0; i < map.height; i++) {
            waveTable[i] = [];
            for (let j = 0; j < map.width; j++) {
              waveTable[i][j] = new Cell(defaultTable.length, defaultTable, j, i)
            }
          }

        const tileData = {
            0: { name: "plainGrass", edges: { top: "green", right: "green", bottom: "green", left: "green" }},
            1: { name: "detailGrass", edges: { top: "green", right: "green", bottom: "green", left: "green" }},
            2: { name: "flowerGrass", edges: { top: "green", right: "green", bottom: "green", left: "green" }},
            12: { name: "leftUCornerRoad", edges: { top: "green", right: "Gdirt", bottom: "Gdirt", left: "green" }},
            13: { name: "topRoad", edges: { top: "green", right: "Gdirt", bottom: "dirt", left: "Gdirt" }},
            14: { name: "rightUCornerRoad", edges: { top: "green", right: "green", bottom: "Gdirt", left: "Gdirt" }},
            24: { name: "leftRoad", edges: { top: "Gdirt", right: "dirt", bottom: "Gdirt", left: "green" }},
            25: { name: "centerRoad", edges: { top: "dirt", right: "dirt", bottom: "dirt", left: "dirt" }},
            26: { name: "rightRoad", edges: { top: "Gdirt", right: "green", bottom: "Gdirt", left: "dirt" }},
            36: { name: "leftBCornerRoad", edges: { top: "Gdirt", right: "Gdirt", bottom: "green", left: "green" }},
            37: { name: "bottomRoad", edges: { top: "dirt", right: "Gdirt", bottom: "green", left: "Gdirt" }},
            38: { name: "rightBCornerRoad", edges: { top: "Gdirt", right: "green", bottom: "green", left: "Gdirt" }},
        }

        // Place start tile
        const startTileIndex = defaultTable[Math.floor(Math.random() * defaultTable.length)]
        const startX = Math.floor(Math.random() * map.width)
        const startY = Math.floor(Math.random() * map.height)
        //console.log("starting index: " + startTileIndex)
        //console.log(startX, startY)
        const startCell = waveTable[startY][startX]
        startCell.entropy = 1
        startCell.possibilities = [startTileIndex]
        layer.putTileAt(startTileIndex, startX, startY)


        //Get neighbors
        const neighbors = this.getNeighbors(startX, startY, map.width, map.height)

        
        //Update possibilities and entropy of neighbors
        for (const neighbor of neighbors){
            const cell = waveTable[neighbor.y][neighbor.x]
            const validCells = cell.possibilities.filter(possibleId => {
                const possibleTile = tileData[possibleId]
                const placedTile = tileData[startTileIndex]
                return this.edgesMatch(possibleTile, placedTile, neighbor.dir);
            })
            cell.possibilities = validCells
            cell.entropy = validCells.length
            //console.log("Cell " + neighbor.x +  ", " + neighbor.y + ":" + cell.possibilities + "Dir: " + neighbor.dir)
        }

        //Find next cell
        const possibleNextCell = []
        let leastEntropy = waveTable[neighbors[0].y][neighbors[0].x].entropy
        for (const neighbor of neighbors){
            const cell = waveTable[neighbor.y][neighbor.x]
            if (cell.entropy <= leastEntropy){
                leastEntropy = cell.entropy
            }
        }

        for (const neighbor of neighbors){
            const cell = waveTable[neighbor.y][neighbor.x]
            if (cell.entropy == leastEntropy && cell.entropy > 1){
                possibleNextCell.push({cell, x: neighbor.x, y:neighbor.y})
            }
        }

        if (possibleNextCell.length > 0){
            const picked = Math.floor(Math.random() * possibleNextCell.length)
            const {cell, x, y} = possibleNextCell[picked]
            
            const tileIndex = cell.possibilities[Math.floor(Math.random() * cell.possibilities.length)]

            cell.possibilities = [tileIndex]
            cell.entropy = 1;
            layer.putTileAt(tileIndex, x, y)     
        }

    }


    update(){

    }

    edgesMatch(neighborTile, placedTile, direction) {
        const opposite = { top: "bottom", right: "left", bottom: "top", left: "right" };
        const placedEdge = placedTile.edges[direction];
        const neighborEdge = neighborTile.edges[opposite[direction]];

        return placedEdge === neighborEdge;
    }

    getNeighbors(x, y, mapWidth, mapHeight) {
        const neighbors = [];
    
        if (y > 0) neighbors.push({ x: x, y: y - 1, dir: "top" });
        if (y < mapHeight - 1) neighbors.push({ x: x, y: y + 1, dir: "bottom" });
        if (x > 0) neighbors.push({ x: x - 1, y: y, dir: "left" });
        if (x < mapWidth - 1) neighbors.push({ x: x + 1, y: y, dir: "right" });
        
        return neighbors;
    }
}