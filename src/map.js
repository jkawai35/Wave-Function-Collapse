class Map extends Phaser.Scene{
    constructor() {
        super("Map")
    }

    create() {
        map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 20, height: 15 });

        const tileset = map.addTilesetImage('tiles', null, 16, 16, 0, 0);
        const layer = map.createBlankLayer("WFC Layer", tileset);
        const waveTable = []
        //const defaultTable = [0, 1, 2]
        const defaultTable = [0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43]

        for (let i = 0; i < map.height; i++) {
            waveTable[i] = [];
            for (let j = 0; j < map.width; j++) {
                waveTable[i][j] = new Cell(defaultTable.length, defaultTable.slice(), j, i)
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
            39: { name: "allRoad1", edges: { top: "dirt", right: "dirt", bottom: "dirt", left: "dirt" }},
            40: { name: "allRoad2", edges: { top: "dirt", right: "dirt", bottom: "dirt", left: "dirt" }},
            41: { name: "allRoad3", edges: { top: "dirt", right: "dirt", bottom: "dirt", left: "dirt" }},
            42: { name: "allRoad4", edges: { top: "dirt", right: "dirt", bottom: "dirt", left: "dirt" }},
            43: { name: "grassStone", edges: { top: "green", right: "green", bottom: "green", left: "green" }},
        }

        // Place start tile
        const grasstiles = [0, 1, 2]
        const startTileIndex = grasstiles[Math.floor(Math.random() * grasstiles.length)]
        const startX = Math.floor(Math.random() * map.width)
        const startY = Math.floor(Math.random() * map.height)

        //console.log("starting index: " + startTileIndex)
        //console.log(startX, startY)
        const startCell = waveTable[startY][startX]
        startCell.possibilities = [startTileIndex]
        startCell.entropy = 1
        startCell.collapsed = true
        layer.putTileAt(startTileIndex, startX, startY)
        this.propagate(waveTable, tileData, startCell)
        
        let current = startCell;

        // Keep track of how many cells have been collapsed to avoid infinite loops
        let collapsedCount = 1;
        const maxTiles = map.width * map.height;

        while (collapsedCount < maxTiles) {

            let nextCell = this.findLowestEntropyCell(waveTable, current);
            if (!nextCell) {
                console.warn("No next cell found — likely stuck or fully collapsed");
                break;
            }

            // Collapse: pick one of the possible tiles
            const tileIndex = nextCell.possibilities[Math.floor(Math.random() * nextCell.possibilities.length)];
            nextCell.possibilities = [tileIndex];
            nextCell.entropy = 1;
            collapsedCount++;

            // Place on map
            layer.putTileAt(tileIndex, nextCell.x, nextCell.y);
            nextCell.collapsed = true


            // Propagate constraints from this new tile
            this.propagate(waveTable, tileData, nextCell);

            // Move on
            current = nextCell;
            //console.log(current.neighbors)

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

    getNeighbors(x, y, waveTable) {
        const neighbors = [];
    
        if (y > 0) neighbors.push({ cell: waveTable[y - 1][x], dir: "top" });
        if (y < waveTable.length - 1) neighbors.push({ cell: waveTable[y + 1][x], dir: "bottom" });
        if (x > 0) neighbors.push({cell: waveTable[y][x - 1], dir: "left" });
        if (x < waveTable[0].length - 1) neighbors.push({ cell: waveTable[y][x + 1], dir: "right" });
        
        return neighbors;
    }

    findLowestEntropyCell(waveTable, current) {
        const neighborData = this.getNeighbors(current.x, current.y, waveTable);
        current.neighbors = neighborData.map(n => n.cell);
    
        let leastEntropy = Infinity;
        let possibleNextCell = [];
    
        for (const neighbor of current.neighbors) {
            if (!neighbor || neighbor.collapsed || neighbor.entropy <= 1) continue;
            if (neighbor.entropy < leastEntropy) {
                leastEntropy = neighbor.entropy;
            }
        }
    
        if (leastEntropy !== Infinity) {
            for (const neighbor of current.neighbors) {
                if (!neighbor || neighbor.collapsed) continue;
                if (neighbor.entropy === leastEntropy) {
                    possibleNextCell.push(neighbor);
                }
            }
    
            if (possibleNextCell.length > 0) {
                const choice = possibleNextCell[Math.floor(Math.random() * possibleNextCell.length)];
                return choice;
            }
        }
    
        // Fallback: scan entire map if local neighbors are fully resolved
        for (let row of waveTable) {
            for (let cell of row) {
                if (!cell.collapsed && cell.entropy > 1) {
                    if (cell.entropy < leastEntropy) {
                        leastEntropy = cell.entropy;
                        possibleNextCell = [cell];
                    } else if (cell.entropy === leastEntropy) {
                        possibleNextCell.push(cell);
                    }
                }
            }
        }
    
        if (possibleNextCell.length === 0) return null;
        const fallbackChoice = possibleNextCell[Math.floor(Math.random() * possibleNextCell.length)];
        return fallbackChoice;
    }
    

    propagate(waveTable, tileData, collapsedCell){
        let history = []

        const neighborData = this.getNeighbors(collapsedCell.x, collapsedCell.y, waveTable)
        const placedTile = tileData[collapsedCell.possibilities[0]]
        collapsedCell.neighbors = neighborData.map(n => n.cell);

        for (const {cell: neighbor, dir} of  neighborData){
            if (neighbor.collapsed) continue

            const validCells = neighbor.possibilities.filter(possibleId => {
                const possibleTile = tileData[possibleId]
                return this.edgesMatch(possibleTile, placedTile, dir);
            })

            if (validCells.length > 0 && validCells.length < neighbor.possibilities.length){
                history.push({x: neighbor.x, y: neighbor.y, prevPossibilities: neighbor.possibilities.slice()})
                neighbor.possibilities = validCells
                neighbor.entropy = validCells.length

                neighbor.neighbors = this.getNeighbors(neighbor.x, neighbor.y, waveTable)
            }else if (validCells.length == 0){
                console.warn("contradiction at", neighbor.x, neighbor.y)
                this.backtrack(waveTable, history)
                return
            }
        }
        //console.log("Cell " + neighbor.x +  ", " + neighbor.y + ":" + cell.possibilities + "Dir: " + neighbor.dir)
    }


    backtrack(waveTable, history){
        const lastState = history.pop()
        if (lastState){
            const {x, y, prevPossibilities} = lastState
            const cell = waveTable[y][x]

            cell.possibilities = prevPossibilities
            cell.entropy = prevPossibilities.length
        }
    }
}