class Map extends Phaser.Scene{
    constructor() {
        super("Map")
    }

    create() {

        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
        keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)



        map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 20, height: 15 });

        tileset = map.addTilesetImage('tiles', null, 16, 16, 0, 0);
        ground = map.createBlankLayer("WFC Layer", tileset);
        decoration = map.createBlankLayer("Decoration Layer", tileset)
        waveTable = []
        defaultTable = [0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43]

        this.initializeWaveTable(waveTable, defaultTable, map.width, map.height)

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

        }
    }

    update(delta) {

        if (Phaser.Input.Keyboard.JustDown(keyS)){
            if (!started){
                WFCselection = "entropy"
                this.WFC(waveTable, tileData, map_width, map_height, ground)
                started = true
            }
            
        }
        if (Phaser.Input.Keyboard.JustDown(keyL)){
            if (!started){
                WFCselection = "lexical"
                this.WFC(waveTable, tileData, map_width, map_height, ground)
                started = true
            }
            
        }

        if (Phaser.Input.Keyboard.JustDown(keyD)){
            if (!started){
                WFCselection = "random"
                this.WFC(waveTable, tileData, map_width, map_height, ground)
                started = true
            }
            
        }

        if (Phaser.Input.Keyboard.JustDown(keyW)){
            if (!started){
                const startTime = performance.now()

                this.OGWFC(waveTable, tileData, map_width, map_height, ground)
                WFCselection = "ogwfc"

                const endTime = performance.now()
                console.log("OG WFC ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
        }

        if (Phaser.Input.Keyboard.JustDown(keyE)){
            if (!started){
                const startTime = performance.now()
                
                //PUT FASTER WFC FUNCTION HERE
                WFCselection = "fastwfc"

                const endTime = performance.now()
                console.log("Faster WFC ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
        }

        if (Phaser.Input.Keyboard.JustDown(keyR)){
            if (WFCselection == "ogwfc") {
                const startTime = performance.now()

                this.clearDecorations(decoration, map_width, map_height)
                this.initializeWaveTable(waveTable, defaultTable, map_width, map_height)
                this.OGWFC(waveTable, tileData, map_width, map_height, ground)

                const endTime = performance.now()
                console.log("OG WFC ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }else if (WFCselection == "fastwfc"){
                const startTime = performance.now()

                this.clearDecorations(decoration, map_width, map_height)
                this.initializeWaveTable(waveTable, defaultTable, map_width, map_height)
                //PUT FAST WFC FUNCTION HERE

                const endTime = performance.now()
                console.log("OG WFC ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
            else {
                this.clearDecorations(decoration, map_width, map_height)
                this.initializeWaveTable(waveTable, defaultTable, map_width, map_height)
                this.WFC(waveTable, tileData, map_width, map_height, ground)
                wfcActive = true
            }  
        }

        if (wfcActive) {
            let cell = null
            wfcTimer += delta;

            if (wfcTimer >= wfcDelay) {
                wfcTimer = 0;

                if (WFCselection == "entropy"){
                    cell = this.findLowestEntropyCell(waveTable)
                } else if (WFCselection == "lexical"){
                    cell = this.findLexicalCell(waveTable)
                }else{
                    cell = this.findRandomCell(waveTable)
                }
                if (cell) {
                    const tileIndex = this.weightedPick(cell.possibilities, tileData)
                    cell.possibilities = [tileIndex]
                    cell.entropy = 0
                    cell.collapsed = true
                    ground.putTileAt(tileIndex, cell.x, cell.y)
    
                    const success = this.propagate(waveTable, tileData, cell, ground);
                    if (!success) {
                        console.warn("Contradiction encountered. Resetting...");
                        
                        //Try again if contradiction
                        this.initializeWaveTable(waveTable, defaultTable, width, height)
                        
                        const newX = Math.floor(Math.random() * width)
                        const newY = Math.floor(Math.random() * height)
                        const newTile = grasstiles[Math.floor(Math.random() * grasstiles.length)]
                        
                        const newStart = waveTable[newY][newX]
                        newStart.possibilities = [newTile]
                        newStart.entropy = 0
                        newStart.collapsed = true

                        layer.putTileAt(newTile, newX, newY)
                        this.propagate(waveTable, tileData, newStart, layer)   
                    }
                } else {
                    wfcActive = false;
                    this.placeDecorations(map_width, map_height, decoration)
                }
                
            }
        }
    }

    edgesMatch(neighborTile, placedTile, direction) {
        const opposite = { top: "bottom", right: "left", bottom: "top", left: "right" };
        const placedEdge = placedTile.edges[direction];
        const neighborEdge = neighborTile.edges[opposite[direction]];

        for (let i = 0; i < placedEdge.length; i++) {
            if (placedEdge[i] !== neighborEdge[i]) {
                return false;
            }
        }
    
        return true;
    }

    getNeighbors(x, y, waveTable) {
        const neighbors = [];
    
        if (y > 0) neighbors.push({ cell: waveTable[y - 1][x], dir: "top" });
        if (y < waveTable.length - 1) neighbors.push({ cell: waveTable[y + 1][x], dir: "bottom" });
        if (x > 0) neighbors.push({cell: waveTable[y][x - 1], dir: "left" });
        if (x < waveTable[0].length - 1) neighbors.push({ cell: waveTable[y][x + 1], dir: "right" });
        
        return neighbors;
    }

    findLowestEntropyCell(waveTable) {
        let leastEntropy = Infinity;
        let possibleNextCell = null;
    
        // Scan the entire grid to find the lowest entropy cell
        for (let row of waveTable) {
            for (let cell of row) {
                if (!cell.collapsed && cell.entropy > 1) {  
                    if (cell.entropy < leastEntropy) {
                        leastEntropy = cell.entropy;
                        possibleNextCell = cell; 
                    }
                }
            }
        }
    
        // Return the cell with the least entropy (or null if no such cell exists)
        return possibleNextCell;
    } 
    
    findLexicalCell(waveTable) {
        for (let row of waveTable) {
            for (let cell of row) {
                if (!cell.collapsed && cell.entropy > 1) {
                    return cell;
                }
            }
        }
        return null;
    }

    findRandomCell(waveTable) {
        const candidates = [];

        for (let row of waveTable) {
            for (let cell of row) {
                if (!cell.collapsed && cell.entropy > 1) {
                    candidates.push(cell);
                }
            }
        }
        if (candidates.length > 0) {
            const index = Math.floor(Math.random() * candidates.length);
            return candidates[index];
        }
        return null;
    }
    
    propagate(waveTable, tileData, collapsedCell, layer){
        const queue = [collapsedCell]

        while (queue.length > 0){
            const cell = queue.shift()
            const neighborData = this.getNeighbors(cell.x, cell.y, waveTable)

            for (const {cell: neighbor, dir} of  neighborData){
                if (neighbor.collapsed) continue
    
                
                const validCells = neighbor.possibilities.filter(possibleId => {
                    const possibleTile = tileData[possibleId]

                    return cell.possibilities.some(cellId => {
                        const placedTile = tileData[cellId]
                        return this.edgesMatch(possibleTile, placedTile, dir);
                    })
                })

                if (validCells.length == 0){
                    console.warn("contradiction at", neighbor.x, neighbor.y, layer)
                    return false
                }
    
                if (validCells.length < neighbor.possibilities.length){
                    neighbor.possibilities = validCells
                    neighbor.entropy = validCells.length

                    if (neighbor.entropy == 1 && !neighbor.collapsed){
                        const tileIndex = validCells[0]
                        neighbor.collapsed = true
                        neighbor.possibilities = [tileIndex]
                        layer.putTileAt(tileIndex, neighbor.x, neighbor.y);

                        queue.push(neighbor)
                    }else {
                        queue.push(neighbor)
                    }
                    
                }
            }
 
        }

        return true
    }

    weightedPick(possibilities, tileData) {
        const weightedPool = [];
    
        for (let id of possibilities) {
            const weight = tileData[id].weight || 1;
            for (let i = 0; i < weight; i++) {
                weightedPool.push(id);
            }
        }
    
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        return weightedPool[randomIndex];
    }

    initializeWaveTable(waveTable, defaultTable, width, height){
        for (let i = 0; i < height; i++) {
            waveTable[i] = [];
            for (let j = 0; j < width; j++) {
                waveTable[i][j] = new Cell(defaultTable.length, defaultTable.slice(), j, i)
            }
        }
    }

    WFC(waveTable, tileData, width, height, layer){
        if (WFCselection != "lexical"){
            // Place start tile
            const grasstiles = [0, 1, 2]
            const startTileIndex = grasstiles[Math.floor(Math.random() * grasstiles.length)]
            const startX = Math.floor(Math.random() * width)
            const startY = Math.floor(Math.random() * height)

            const startCell = waveTable[startY][startX]
            startCell.possibilities = [startTileIndex]
            startCell.entropy = 0
            startCell.collapsed = true
            layer.putTileAt(startTileIndex, startX, startY)
            this.propagate(waveTable, tileData, startCell)
            wfcActive = true
        } else{
            wfcActive = true
        }
    }

    
    OGWFC(waveTable, tileData, width, height, layer){


        // Place start tile
        const grasstiles = [0, 1, 2]
        const startTileIndex = grasstiles[Math.floor(Math.random() * grasstiles.length)]
        const startX = Math.floor(Math.random() * width)
        const startY = Math.floor(Math.random() * height)

        //console.log("starting index: " + startTileIndex)
        //console.log(startX, startY)
        const startCell = waveTable[startY][startX]
        startCell.possibilities = [startTileIndex]
        startCell.entropy = 0
        startCell.collapsed = true
        layer.putTileAt(startTileIndex, startX, startY)
        this.propagate(waveTable, tileData, startCell)

        let current = startCell
        
        // Keep track of how many cells have been collapsed to avoid infinite loops
        let currentTries = 1;
        const maxTries = width * height;

        while (currentTries <= maxTries) {

            let nextCell = this.findLowestEntropyCell(waveTable);
            if (!nextCell) {
                break
            }

            // Collapse: pick one of the possible tiles
            const tileIndex = this.weightedPick(nextCell.possibilities, tileData)
            nextCell.possibilities = [tileIndex]
            nextCell.entropy = 0
            currentTries++

            // Place on map
            layer.putTileAt(tileIndex, nextCell.x, nextCell.y);
            nextCell.collapsed = true


            // Propagate constraints from this new tile
            //this.propagate(waveTable, tileData, nextCell);

            let success = this.propagate(waveTable, tileData, nextCell, layer);
            if (!success) {
                // Remove the tried tile from possibilities
                this.initializeWaveTable(waveTable, defaultTable, width, height)
                
                const newX = Math.floor(Math.random() * width)
                const newY = Math.floor(Math.random() * height)
                const newTile = grasstiles[Math.floor(Math.random() * grasstiles.length)]
                
                const newStart = waveTable[newY][newX]
                newStart.possibilities = [newTile]
                newStart.entropy = 0
                newStart.collapsed = true

                layer.putTileAt(newTile, newX, newY)
                this.propagate(waveTable, tileData, newStart, layer)

                current = newStart

                currentTries++

                continue
            }

            
            // Move on
            current = nextCell;
            //console.log(current.neighbors)

        }    
        //this.checkAllCollapsed(waveTable, width, height)
    }

    placeDecorations(width, height){
        const possibleDecorations = [27, 28, 29, 94, 106]

        for (let i = 0; i < width; i++){
            for (let j = 0; j < height; j++){
                let tile = ground.getTileAt(i, j)
                if (tile.index == 0 || tile.index == 1 || tile.index == 2){
                    if (Math.random() < .05){
                        decoration.putTileAt(possibleDecorations[Math.floor(Math.random() * possibleDecorations.length)], i, j)
                    }
                }

                if (tile.index == 25 || tile.index == 39 || tile.index == 40 || tile.index == 41 || tile.index == 42){
                    if (Math.random() < .2){
                        decoration.putTileAt(95, i, j)
                    }
                }
            }
        }
    }

    clearDecorations(layer, width, height){
        for (let i = 0; i < width; i++){
            for (let j = 0; j < height; j++){
                let tile = layer.getTileAt(i, j)
                if (tile){
                        map.removeTile(tile, decoration)
                }
            }
        }
    }
}