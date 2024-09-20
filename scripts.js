let tiles = [], emptyTile, positions = [], gridSize = 3, currentImageUrl = "";
let moves = 0, timer, seconds = 0, bestTime = Infinity, bestMoves = Infinity;

// Fetch a random cat image and generate the puzzle
const fetchCatImage = async () => {
    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search');
        currentImageUrl = (await response.json())[0].url;
        generatePuzzle(gridSize);
        resetGame();
    } catch (error) {
        console.error('Error fetching cat image:', error);
    }
};

// Generate the puzzle grid
const generatePuzzle = (size) => {
    const puzzleContainer = document.getElementById('puzzleContainer');
    puzzleContainer.style.gridTemplate = `repeat(${size}, 100px) / repeat(${size}, 100px)`;
    puzzleContainer.innerHTML = '';
    tiles = [];
    positions = [...Array(size * size).keys()];

    for (let i = 0; i < size * size - 1; i++) {
        const tile = createTile(i, size);
        tiles.push(tile);
        puzzleContainer.appendChild(tile);
    }

    emptyTile = createEmptyTile(size);
    puzzleContainer.appendChild(emptyTile);
    shuffle(size);
};

// Create a tile element
const createTile = (index, size) => {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.position = index;
    tile.style.backgroundImage = `url(${currentImageUrl})`;
    tile.style.backgroundSize = `${size * 100}px ${size * 100}px`;
    tile.style.backgroundPosition = `${-100 * (index % size)}px ${-100 * Math.floor(index / size)}px`;
    tile.style.gridArea = `${Math.floor(index / size) + 1} / ${index % size + 1}`;
    tile.addEventListener('click', () => {
        const clickedPos = parseInt(tile.dataset.position);
        const emptyPos = parseInt(emptyTile.dataset.position);
        if (isAdjacent(clickedPos, emptyPos)) {
            swapTiles(tile, emptyTile);
            updateMoves();
        }
    });
    return tile;
};

// Create an empty tile
const createEmptyTile = (size) => {
    const emptyTile = document.createElement('div');
    emptyTile.classList.add('empty');
    emptyTile.dataset.position = size * size - 1;
    emptyTile.style.gridArea = `${size} / ${size}`;
    return emptyTile;
};

// Check if the tile is adjacent to the empty tile
const isAdjacent = (pos1, pos2) => {
    const [row1, col1] = [Math.floor(pos1 / gridSize), pos1 % gridSize];
    const [row2, col2] = [Math.floor(pos2 / gridSize), pos2 % gridSize];
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
};

// Swap tiles
const swapTiles = (tile, emptyTile) => {
    const clickedPos = parseInt(tile.dataset.position);
    const emptyPos = parseInt(emptyTile.dataset.position);
    [tile.style.gridArea, emptyTile.style.gridArea] = [emptyTile.style.gridArea, tile.style.gridArea];
    [tile.dataset.position, emptyTile.dataset.position] = [emptyPos, clickedPos];
    [positions[clickedPos], positions[emptyPos]] = [positions[emptyPos], positions[clickedPos]];
};

// Shuffle the tiles
const shuffle = (size) => {
    let shuffled;
    do {
        shuffled = positions.slice(0, size * size - 1).sort(() => Math.random() - 0.5).concat(size * size - 1);
    } while (!isSolvable(shuffled, size));
  
    shuffled.forEach((pos, idx) => {
        const tile = document.querySelector(`[data-position="${pos}"]`);
        if (tile) {
            tile.dataset.position = idx;
            tile.style.gridArea = `${Math.floor(idx / size) + 1} / ${idx % size + 1}`;
            positions[idx] = pos;
        }
    });

    emptyTile.dataset.position = size * size - 1;
    emptyTile.style.gridArea = `${size} / ${size}`;
};

// Check if the puzzle is solvable
const isSolvable = (array, size) => {
    const inversionCount = countInversions(array.slice(0, -1));
    const emptyRowFromBottom = size - Math.floor(array.indexOf(size * size - 1) / size);
    return (size % 2 === 1) ? (inversionCount % 2 === 0) : (inversionCount % 2 === 0) !== (emptyRowFromBottom % 2 === 0);
};

// Count inversions
const countInversions = (array) => array.reduce((inversions, num, i) => inversions + array.slice(i + 1).filter(n => n < num).length, 0);

// Reveal the full image
const revealImage = () => {
    const revealContainer = document.getElementById('revealContainer');
    revealContainer.style.cssText = `width: ${gridSize * 100 + 20}px; height: ${gridSize * 100 + 20}px; background-image: url(${currentImageUrl}); display: block;`;
    document.getElementById('revealButton').innerText = "Hide Image";
    document.getElementById('revealButton').setAttribute("onclick", "hideImage()");
};

// Hide the full image
const hideImage = () => {
    document.getElementById('revealContainer').style.display = 'none';
    document.getElementById('revealButton').innerText = "Reveal Image";
    document.getElementById('revealButton').setAttribute("onclick", "revealImage()");
};

// Update moves counter
const updateMoves = () => {
    moves++;
    document.getElementById('movesCounter').innerText = moves;
};

// Check if the puzzle is complete
const checkWin = () => {
    const correctOrder = [...Array(gridSize * gridSize).keys()];
    const isComplete = positions.every((pos, i) => parseInt(pos) === correctOrder[i]);
    if (isComplete) {
        clearInterval(timer);
        document.getElementById('completionMessage').innerText = `Congratulations! You completed the image in ${seconds} seconds and ${moves} moves!`;
        document.getElementById('completionMessage').style.display = 'block';
        document.getElementById('playAgainButton').style.display = 'block';
        updateBestPlays();
    } else {
        alert('Sorry, the image is not complete, keep trying!');
    }
};

// Change the grid size based on selected difficulty
const changeDifficulty = () => {
    if (document.getElementById('revealContainer').style.display === 'block') {
        hideImage(); // Hide image if it's revealed
    }
    gridSize = parseInt(document.getElementById('difficulty').value);
    fetchCatImage();
};

// Reset game state
const resetGame = () => {
    moves = 0;
    seconds = 0;
    document.getElementById('movesCounter').innerText = moves;
    document.getElementById('timeCounter').innerText = seconds;
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
    document.getElementById('completionMessage').style.display = 'none';
    document.getElementById('playAgainButton').style.display = 'none';
};

// Update the timer
const updateTimer = () => {
    seconds++;
    document.getElementById('timeCounter').innerText = seconds;
};

// Update best plays
const updateBestPlays = () => {
    if (seconds < bestTime) {
        bestTime = seconds;
        document.getElementById('bestTime').innerText = "Time: " + bestTime + " seconds";
    }
    if (moves < bestMoves) {
        bestMoves = moves;
        document.getElementById('bestMoves').innerText = "Moves: " + bestMoves;
    }
};

// Play again
const playAgain = () => {
    resetGame();
    fetchCatImage();
};

// Fetch a new cat image when the page loads
window.onload = fetchCatImage;
