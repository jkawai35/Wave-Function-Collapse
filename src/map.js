class Cell {
    constructor(entropy, possibilities, x, y) { 
        this.x = x;
        this.y = y;
        this.possibilities = possibilities; 
        this.entropy = entropy;             
        this.collapsed = false;
    }
}

class PriorityQueue {
    constructor(compareFn) {
        this.heap = [];
        this.compare = compareFn || ((a, b) => a.entropy - b.entropy); 
        this.cellMap = new globalThis.Map();
    }

    _parent(i) { return Math.floor((i - 1) / 2); }
    _leftChild(i) { return 2 * i + 1; }
    _rightChild(i) { return 2 * i + 2; }

    _swap(i, j) {
        const cellI = this.heap[i];
        const cellJ = this.heap[j];
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
        this.cellMap.set(cellI, j); 
        this.cellMap.set(cellJ, i); 
    }

    _siftUp(i) {
        let currentIndex = i;
        if (currentIndex >= this.heap.length) return;
        while (currentIndex > 0 && this.compare(this.heap[currentIndex], this.heap[this._parent(currentIndex)]) < 0) {
            this._swap(currentIndex, this._parent(currentIndex));
            currentIndex = this._parent(currentIndex);
        }
    }

    _siftDown(i) {
        let currentIndex = i;
        if (currentIndex >= this.heap.length) return;
        let minIndex = i; 

        const left = this._leftChild(currentIndex);
        if (left < this.heap.length && this.compare(this.heap[left], this.heap[minIndex]) < 0) {
            minIndex = left;
        }

        const right = this._rightChild(currentIndex);
        if (right < this.heap.length && this.compare(this.heap[right], this.heap[minIndex]) < 0) {
            minIndex = right;
        }

        if (currentIndex !== minIndex) {
            this._swap(currentIndex, minIndex);
            this._siftDown(minIndex);
        }
    }

    insert(cell) {
        if (this.cellMap.has(cell)) { 
            this.update(cell); 
            return;
        }
        this.heap.push(cell);
        const index = this.heap.length - 1;
        this.cellMap.set(cell, index);
        this._siftUp(index);
    }

    extractMin() {
        if (this.isEmpty()) return null;

        const minCell = this.heap[0];
        this.cellMap.delete(minCell); 

        if (this.heap.length === 1) {
            this.heap.pop();
            return minCell;
        }

        this.heap[0] = this.heap.pop(); 
        if(this.heap.length > 0) {
            this.cellMap.set(this.heap[0], 0); 
            this._siftDown(0);
        }
        return minCell;
    }

    update(cell) { 
        if (!this.cellMap.has(cell)) { 
            return;
        }
        const index = this.cellMap.get(cell);

        if (index === undefined || index < 0 || index >= this.heap.length || this.heap[index] !== cell) {
            return; 
        }

        this._siftUp(index); 
    }
    
    remove(cell) {
        if (!this.cellMap.has(cell)) {
            return;
        }
        const indexToRemove = this.cellMap.get(cell);

        if (indexToRemove === undefined || indexToRemove < 0 || indexToRemove >= this.heap.length || this.heap[indexToRemove] !== cell) {
            this.cellMap.delete(cell);
            return; 
        }

        this.cellMap.delete(cell); // Remove from map first.

        if (indexToRemove === this.heap.length - 1) {
            this.heap.pop();
            return;
        }

        // If heap becomes empty after this removal (was only one element).
        if (this.heap.length === 1 && indexToRemove === 0) {
             this.heap.pop();
             return;
        }
        
        // Replace the cell to remove with the last element from the heap.
        if (this.heap.length > 0) { 
            this.heap[indexToRemove] = this.heap.pop(); // Pop last and place it at indexToRemove.
            this.cellMap.set(this.heap[indexToRemove], indexToRemove); // Update the moved cell's index in cellMap.

            // Compare with parent: if smaller, sift up.
            if (indexToRemove > 0 && this.compare(this.heap[indexToRemove], this.heap[this._parent(indexToRemove)]) < 0) {
                this._siftUp(indexToRemove);
            } else {
                // Otherwise, sift down.
                this._siftDown(indexToRemove);
            }
        } else {
            console.warn("Remove: Heap is unexpectedly empty/inconsistent.");
        }
    }

    isEmpty() { return this.heap.length === 0; }

    buildHeap(cells) {
        this.heap = [...cells]; 
        this.cellMap.clear();
        for(let i = 0; i < this.heap.length; i++) {
            this.cellMap.set(this.heap[i], i);
        }
        for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
            this._siftDown(i);
        }
    }

    contains(cell) {
        return this.cellMap.has(cell);
    }
}

class Map extends Phaser.Scene{
    constructor() {
        super("Map")

        this.keyS = null;
        this.keyR = null;
        this.keyL = null;
        this.keyD = null;
        this.keyW = null;
        this.keyE = null;

        this.tilemap = null;
        this.tileset = null;
        this.groundLayer = null;
        this.decorationLayer = null;
        this.waveTable = [];
        this.defaultTable = [];
        this.tileData = {};

        this.WFCselection = "";
        this.started = false;
        this.wfcActive = false;
        this.wfcTimer = 0;
        this.wfcDelay = 50; // Assuming a default, adjust if defined elsewhere or passed

        this.grasstiles = [0, 1, 2];
    }

    create() {

        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
        this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)

        this.tilemap = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 100, height: 100 });

        this.tileset = this.tilemap.addTilesetImage('tiles', null, 16, 16, 0, 0);
        this.groundLayer = this.tilemap.createBlankLayer("WFC Layer", this.tileset);
        this.decorationLayer = this.tilemap.createBlankLayer("Decoration Layer", this.tileset)
        this.waveTable = [] // Re-initialize if create is called multiple times
        this.defaultTable = [0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43]

        this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height)

        this.tileData = {         
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

        if (Phaser.Input.Keyboard.JustDown(this.keyS)){
            if (!this.started){
                this.WFCselection = "entropy"
                // Ensure waveTable is initialized before WFC call if not already fresh
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height);
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height);
                this.WFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.started = true
            }
            
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyL)){
            if (!this.started){
                this.WFCselection = "lexical"
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height);
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height);
                this.WFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.started = true
            }
            
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyD)){
            if (!this.started){
                this.WFCselection = "random"
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height);
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height);
                this.WFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.started = true
            }
            
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyW)){
            if (!this.started){
                const startTime = performance.now()
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height);
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height);
                this.OGWFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.WFCselection = "ogwfc"
                this.started = true;

                const endTime = performance.now()
                console.log("OG WFC ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyE)){
            if (!this.started){
                const startTime = performance.now()
                
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height); 
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height); 
                this.FASTWFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer, this.decorationLayer);
                this.WFCselection = "fastwfc";
                this.started = true;

                const endTime = performance.now()
                console.log("Faster WFC (FASTWFC) ran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyR)){
            this.started = false; // Allow re-running by reseting started flag
            this.wfcActive = false; // Stop any ongoing step-by-step WFC

            if (this.WFCselection == "ogwfc") {
                const startTime = performance.now()
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height)
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height)
                this.OGWFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.started = true;
                const endTime = performance.now()
                console.log("OG WFC reran in: " + ((endTime - startTime) / 1000) + " seconds")
            } else if (this.WFCselection == "fastwfc"){
                const startTime = performance.now()
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height)
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height)
                this.FASTWFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer, this.decorationLayer)
                this.started = true;
                const endTime = performance.now()
                console.log("Faster WFC (FASTWFC) reran in: " + ((endTime - startTime) / 1000) + " seconds")
            }
            else { // For entropy, lexical, random (step-by-step WFC)
                this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height)
                this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height)
                this.WFC(this.waveTable, this.tileData, this.tilemap.width, this.tilemap.height, this.groundLayer)
                this.started = true; 
            }  
        }

        if (this.wfcActive) {
            let cell = null
            this.wfcTimer += delta;

            if (this.wfcTimer >= this.wfcDelay) {
                this.wfcTimer = 0;

                if (this.WFCselection == "entropy"){
                    cell = this.findLowestEntropyCell(this.waveTable)
                } else if (this.WFCselection == "lexical"){
                    cell = this.findLexicalCell(this.waveTable)
                }else{ // random
                    cell = this.findRandomCell(this.waveTable)
                }
                if (cell) {
                    const tileIndex = this.weightedPick(cell.possibilities, this.tileData)
                    cell.possibilities = [tileIndex]
                    cell.entropy = 1 
                    cell.collapsed = true
                    this.groundLayer.putTileAt(tileIndex, cell.x, cell.y)
    
                    const success = this.propagate(this.waveTable, this.tileData, cell, this.groundLayer);
                    if (!success) {
                        console.warn("Contradiction encountered during step-by-step WFC. Resetting...");
                        
                        this.initializeWaveTable(this.waveTable, this.defaultTable, this.tilemap.width, this.tilemap.height)
                        this.clearDecorations(this.decorationLayer, this.tilemap.width, this.tilemap.height); // Clear decorations on reset
                        

                        this.wfcActive = false;
                        this.started = false;
                    }
                } else {
                    this.wfcActive = false;
                    this.placeDecorations(this.tilemap.width, this.tilemap.height, this.groundLayer, this.decorationLayer)
                    this.started = false; // Allow new WFC process to start after completion
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
        // waveTable.length = 0; // Clear the array while keeping the reference FOR THIS INSTANCE
        this.waveTable.length = 0; // Operate on instance waveTable

        for (let i = 0; i < height; i++) {
            this.waveTable[i] = [];
            for (let j = 0; j < width; j++) {
                // Ensure Cell class is defined and accessible
                // For now, assuming Cell is a global class or defined elsewhere in the project
                this.waveTable[i][j] = new Cell(defaultTable.length, defaultTable.slice(), j, i);
            }
        }
    }

    WFC(waveTable, tileData, width, height, layer){
        this.wfcActive = false; 
        this.started = true; 

        if (this.WFCselection !== "lexical"){
            const startTileIndex = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)]
            const startX = Math.floor(Math.random() * width)
            const startY = Math.floor(Math.random() * height)

            const startCell = this.waveTable[startY][startX] 
            startCell.possibilities = [startTileIndex]
            startCell.entropy = 1 
            startCell.collapsed = true
            layer.putTileAt(startTileIndex, startX, startY)
            this.propagate(this.waveTable, tileData, startCell, layer) 
        }
        this.wfcActive = true 
    }

    
    OGWFC(waveTable, tileData, width, height, layer){
        const startTileIndex = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)]
        const startX = Math.floor(Math.random() * width)
        const startY = Math.floor(Math.random() * height)
        const startCell = this.waveTable[startY][startX]
        startCell.possibilities = [startTileIndex]
        startCell.entropy = 1 
        startCell.collapsed = true
        layer.putTileAt(startTileIndex, startX, startY)
        this.propagate(this.waveTable, tileData, startCell, layer)

        let currentTries = 1; 
        const maxCells = width * height;

        while (currentTries < maxCells) { 
            let nextCell = this.findLowestEntropyCell(this.waveTable);
            if (!nextCell) { 
                break 
            }

            const tileIndex = this.weightedPick(nextCell.possibilities, tileData)
            nextCell.possibilities = [tileIndex]
            nextCell.entropy = 1 
            nextCell.collapsed = true
            currentTries++
            layer.putTileAt(tileIndex, nextCell.x, nextCell.y);

            let success = this.propagate(this.waveTable, tileData, nextCell, layer);
            if (!success) {
                console.warn("OGWFC: Contradiction encountered. Resetting...");
                this.clearDecorations(this.decorationLayer, width, height);
                this.initializeWaveTable(this.waveTable, this.defaultTable, width, height)
                
                const newX = Math.floor(Math.random() * width)
                const newY = Math.floor(Math.random() * height)
                const newTile = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)]
                
                const newStart = this.waveTable[newY][newX]
                newStart.possibilities = [newTile]
                newStart.entropy = 1
                newStart.collapsed = true
                layer.putTileAt(newTile, newX, newY)
                this.propagate(this.waveTable, tileData, newStart, layer) 

                currentTries = 1 
                continue 
            }
        }    
        this.placeDecorations(width, height, layer, this.decorationLayer);
    }

    propagateForFastWFC(waveTable, tileData, initialCellToPropagateFrom, layer, priorityQueue) {
        const propagationQueue = [initialCellToPropagateFrom]; 

        while (propagationQueue.length > 0) {
            const cell = propagationQueue.shift();
            const neighborData = this.getNeighbors(cell.x, cell.y, waveTable);

            for (const { cell: neighbor, dir } of neighborData) {
                if (neighbor.collapsed) continue;

                const originalPossibilitiesLength = neighbor.possibilities.length;

                const validNextPossibilities = neighbor.possibilities.filter(possibleId => {
                    const possibleTile = tileData[possibleId];
                    return cell.possibilities.some(cellId => {
                        const placedTile = tileData[cellId];
                        return this.edgesMatch(possibleTile, placedTile, dir);
                    });
                });

                if (validNextPossibilities.length === 0) {
                    return false; 
                }

                if (validNextPossibilities.length < originalPossibilitiesLength) {
                    // The neighbor's possible patterns have been reduced due to collapsing.
                    neighbor.possibilities = validNextPossibilities;
                    // Update the neighbor's entropy to reflect the new number of possibilities.
                    neighbor.entropy = validNextPossibilities.length;

                    // Check if the neighbor only has one remaining possibility.
                    if (neighbor.entropy === 1 && !neighbor.collapsed) { 
                        const determinedTileIndex = neighbor.possibilities[0];
                        neighbor.collapsed = true; // If so, mark as collapsed.
                        layer.putTileAt(determinedTileIndex, neighbor.x, neighbor.y);
                        
                        // If this newly determined cell was still in the priority queue, remove it.
                        // It no longer needs to be considered for lowest entropy selection.
                        if (priorityQueue.contains(neighbor)) {
                           priorityQueue.remove(neighbor); 
                        }

                        // The collapsed neighbor's constraints must also be propagated.
                        // If not already present, add it to the propagation queue.
                        if (!propagationQueue.some(pCell => pCell.x === neighbor.x && pCell.y === neighbor.y)) { 
                            propagationQueue.push(neighbor);
                        }
                    } else if (neighbor.entropy > 1) { 
                        // If the neighbor is not yet fully determined but its entropy has changed,
                        // Update its position in the priority queue, if it's already in it.
                        if (priorityQueue.contains(neighbor)) {
                           priorityQueue.update(neighbor); 
                        }
                        // Otherwise, add it to the queue, since its changes have may affect its own neighbors.
                        if (!propagationQueue.some(pCell => pCell.x === neighbor.x && pCell.y === neighbor.y)) {
                             propagationQueue.push(neighbor); 
                        }
                    }
                }
            }
        }
        return true; 
    }

    FASTWFC(waveTable, tileData, width, height, groundLayer, decorationLayer) {
        const priorityQueue = new PriorityQueue((a, b) => a.entropy - b.entropy);

        const allCellsForPQ = [];
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (!this.waveTable[r][c].collapsed) { 
                    allCellsForPQ.push(this.waveTable[r][c]);
                }
            }
        }
        priorityQueue.buildHeap(allCellsForPQ);
        
        const startTileIndex = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)];
        let startX = Math.floor(Math.random() * width);
        let startY = Math.floor(Math.random() * height);
        let startCell = this.waveTable[startY][startX];

        let attempts = 0;
        while(startCell.collapsed && attempts < width * height) {
            startX = Math.floor(Math.random() * width);
            startY = Math.floor(Math.random() * height);
            startCell = this.waveTable[startY][startX];
            attempts++;
        }
        if (startCell.collapsed) {
            console.error("FASTWFC: Could not find an uncollapsed starting cell.");
            this.placeDecorations(width, height, groundLayer, decorationLayer);
            return; 
        }

        startCell.possibilities = [startTileIndex];
        startCell.entropy = 1; 
        startCell.collapsed = true;
        groundLayer.putTileAt(startTileIndex, startX, startY);
        if (priorityQueue.contains(startCell)) { priorityQueue.remove(startCell); }

        let success = this.propagateForFastWFC(this.waveTable, tileData, startCell, groundLayer, priorityQueue);
        
        let initialPropagationFailed = false;
        if (!success) {
            console.warn("FASTWFC: Contradiction after placing initial tile. Resetting...");
            initialPropagationFailed = true; 
        }
        
        if (initialPropagationFailed) {
            this.clearDecorations(decorationLayer, width, height);
            this.initializeWaveTable(this.waveTable, this.defaultTable, width, height);
            
            const freshCellsForPQ_init = [];
            for (let r = 0; r < height; r++) { for (let c = 0; c < width; c++) { if (!this.waveTable[r][c].collapsed) freshCellsForPQ_init.push(this.waveTable[r][c]); }}
            priorityQueue.buildHeap(freshCellsForPQ_init);
            
            let nStartX = Math.floor(Math.random() * width);
            let nStartY = Math.floor(Math.random() * height);
            let nStartCell = this.waveTable[nStartY][nStartX];
            attempts = 0;
            while(nStartCell.collapsed && attempts < width * height){
                 nStartX = Math.floor(Math.random() * width);
                 nStartY = Math.floor(Math.random() * height);
                 nStartCell = this.waveTable[nStartY][nStartX];
                 attempts++;
            }
            if(nStartCell.collapsed) { console.error("FASTWFC: Failed to find non-collapsed cell for restart."); return;}

            const nStartTile = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)];
            nStartCell.possibilities = [nStartTile];
            nStartCell.entropy = 1;
            nStartCell.collapsed = true;
            groundLayer.putTileAt(nStartTile, nStartCell.x, nStartCell.y);
            if(priorityQueue.contains(nStartCell)) priorityQueue.remove(nStartCell);
            success = this.propagateForFastWFC(this.waveTable, tileData, nStartCell, groundLayer, priorityQueue);
            if (!success) {
                 console.error("FASTWFC: Contradiction even after reset on initial propagation. Aborting.");
                 this.placeDecorations(width, height, groundLayer, decorationLayer);
                 return;
            }
        }

        let collapsedCount = 0;
        for (let r = 0; r < height; r++) { for (let c = 0; c < width; c++) { if (this.waveTable[r][c].collapsed) collapsedCount++; }}
        
        const totalCells = width * height;

        while (collapsedCount < totalCells && !priorityQueue.isEmpty()) {
            let nextCell = priorityQueue.extractMin();

            if (!nextCell) break; 
            if (nextCell.collapsed) continue; 

            const tileIndex = this.weightedPick(nextCell.possibilities, tileData);
            nextCell.possibilities = [tileIndex];
            nextCell.entropy = 1; 
            nextCell.collapsed = true;
            groundLayer.putTileAt(tileIndex, nextCell.x, nextCell.y);
            collapsedCount++;

            success = this.propagateForFastWFC(this.waveTable, tileData, nextCell, groundLayer, priorityQueue);
            if (!success) {
                console.warn("FASTWFC: Contradiction during main loop. Resetting and trying again.");
                this.clearDecorations(decorationLayer, width, height);
                this.initializeWaveTable(this.waveTable, this.defaultTable, width, height);
                
                const freshCellsForPQ_loop = [];
                for (let r = 0; r < height; r++) { for (let c = 0; c < width; c++) { if (!this.waveTable[r][c].collapsed) freshCellsForPQ_loop.push(this.waveTable[r][c]); }}
                priorityQueue.buildHeap(freshCellsForPQ_loop);

                let rStartX = Math.floor(Math.random() * width);
                let rStartY = Math.floor(Math.random() * height);
                let rStart = this.waveTable[rStartY][rStartX];
                attempts = 0;
                while(rStart.collapsed && attempts < width*height){
                    rStartX = Math.floor(Math.random() * width);
                    rStartY = Math.floor(Math.random() * height);
                    rStart = this.waveTable[rStartY][rStartX];
                    attempts++;
                }
                if(rStart.collapsed){
                    console.error("FASTWFC: Failed to find non-collapsed cell after reset in loop. Aborting.");
                    this.placeDecorations(width, height, groundLayer, decorationLayer);
                    return;
                }

                const rTile = this.grasstiles[Math.floor(Math.random() * this.grasstiles.length)];
                rStart.possibilities = [rTile];
                rStart.entropy = 1;
                rStart.collapsed = true;
                groundLayer.putTileAt(rTile, rStart.x, rStart.y);
                if(priorityQueue.contains(rStart)) priorityQueue.remove(rStart); 

                success = this.propagateForFastWFC(this.waveTable, tileData, rStart, groundLayer, priorityQueue);
                if (!success) {
                    console.error("FASTWFC: Contradiction even after reset in main loop. Aborting.");
                    this.placeDecorations(width, height, groundLayer, decorationLayer);
                    return; 
                }
                collapsedCount = 0; 
                for (let r = 0; r < height; r++) { for (let c = 0; c < width; c++) { if (this.waveTable[r][c].collapsed) collapsedCount++; }}
                continue; 
            }
        }
        
        this.placeDecorations(width, height, groundLayer, decorationLayer);
    }


    placeDecorations(width, height, groundLayer, decorationLayer){
        const possibleDecorations = [27, 28, 29, 94, 106]

        for (let i = 0; i < width; i++){
            for (let j = 0; j < height; j++){
                let tile = groundLayer.getTileAt(i, j) 
                if (tile && (tile.index == 0 || tile.index == 1 || tile.index == 2)){
                    if (Math.random() < .05){
                        decorationLayer.putTileAt(possibleDecorations[Math.floor(Math.random() * possibleDecorations.length)], i, j)
                    }
                }

                if (tile && (tile.index == 25 || tile.index == 39 || tile.index == 40 || tile.index == 41 || tile.index == 42)){
                    if (Math.random() < .2){
                        decorationLayer.putTileAt(95, i, j)
                    }
                }
            }
        }
    }

    clearDecorations(layer, width, height){
        if (!layer) return; // Guard if layer is not yet created or passed as null
        for (let i = 0; i < width; i++){
            for (let j = 0; j < height; j++){
                const tile = layer.getTileAt(i,j);
                if (tile){ 
                    layer.removeTileAt(i,j); 
                }
            }
        }
    }
}

