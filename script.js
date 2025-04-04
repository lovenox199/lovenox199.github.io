document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const boardElement = document.getElementById('sudoku-board');
    const messageArea = document.getElementById('message-area');
    const checkButton = document.getElementById('check-button');
    const newGameButton = document.getElementById('new-game-button');
    
    // Create difficulty buttons
    const difficultyContainer = document.createElement('div');
    difficultyContainer.className = 'difficulty-container';
    difficultyContainer.innerHTML = `
        <button id="easy-button" class="difficulty-button">Easy</button>
        <button id="medium-button" class="difficulty-button active">Medium</button>
        <button id="hard-button" class="difficulty-button">Hard</button>
    `;
    
    // Insert difficulty container before the board
    boardElement.parentNode.insertBefore(difficultyContainer, boardElement);
    
    // Get difficulty buttons
    const easyButton = document.getElementById('easy-button');
    const mediumButton = document.getElementById('medium-button');
    const hardButton = document.getElementById('hard-button');
    
    // Constants
    const BOARD_SIZE = 9;
    const SUBGRID_SIZE = 3;
    const DIFFICULTY_LEVELS = {
        easy: 30,    // 30 empty cells
        medium: 45,  // 45 empty cells
        hard: 55     // 55 empty cells
    };
    
    // Game state
    let gameState = {
        initialBoard: [], // The puzzle board shown to the user
        solutionBoard: [], // The complete solution (generated internally)
        currentBoard: [], // The user's current progress
        selectedCell: null,
        difficulty: DIFFICULTY_LEVELS.medium, // Default difficulty
        currentDifficulty: 'medium', // Keep track of active difficulty
        gameComplete: false
    };

    /**
     * Fisher-Yates Shuffle for randomization
     * @param {Array} array - The array to shuffle
     * @returns {Array} - The shuffled array
     */
    function shuffleArray(array) {
        const arrayCopy = [...array]; // Create a copy to avoid mutating the original
        for (let i = arrayCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]]; // Swap elements
        }
        return arrayCopy;
    }

    /**
     * Find next empty cell in row-major order
     * @param {Array<Array<number>>} board - The Sudoku board
     * @returns {Array<number>|null} - [row, col] of empty cell or null if none
     */
    function findEmpty(board) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null; // No empty cells
    }

    /**
     * Check if a number is valid in a given position
     * @param {Array<Array<number>>} board - The Sudoku board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} - Whether the number is valid
     */
    function isValid(board, row, col, num) {
        // Check Row
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[row][c] === num && c !== col) return false;
        }
        
        // Check Column
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (board[r][col] === num && r !== row) return false;
        }
        
        // Check 3x3 Subgrid
        const startRow = Math.floor(row / SUBGRID_SIZE) * SUBGRID_SIZE;
        const startCol = Math.floor(col / SUBGRID_SIZE) * SUBGRID_SIZE;
        
        for (let r = startRow; r < startRow + SUBGRID_SIZE; r++) {
            for (let c = startCol; c < startCol + SUBGRID_SIZE; c++) {
                if (board[r][c] === num && (r !== row || c !== col)) return false;
            }
        }
        
        return true; // Number is valid
    }

    /**
     * Solve the Sudoku board using backtracking
     * @param {Array<Array<number>>} board - The Sudoku board to solve
     * @returns {boolean} - Whether the board was solved
     */
    function solveBoard(board) {
        const emptySpot = findEmpty(board);
        if (!emptySpot) {
            return true; // Board is full (solved)
        }
        
        const [row, col] = emptySpot;
        const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]); // Randomize number order

        for (const num of numbers) {
            if (isValid(board, row, col, num)) {
                board[row][col] = num; // Try the number

                if (solveBoard(board)) {
                    return true; // If it leads to a solution, we're done
                }

                board[row][col] = 0; // Backtrack: reset cell if it didn't lead to a solution
            }
        }

        return false; // Trigger backtracking
    }

    /**
     * Create a puzzle by removing numbers from a solved board
     * @param {Array<Array<number>>} board - The solved board
     * @param {number} emptyCellsCount - Number of cells to empty
     * @returns {Array<Array<number>>} - The puzzle with empty cells
     */
    function createPuzzle(board, emptyCellsCount) {
        // Create a deep copy of the board
        const puzzle = board.map(row => [...row]);
        
        // Get all cell coordinates
        let cells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                cells.push([r, c]);
            }
        }
        
        // Shuffle cells for random removal
        cells = shuffleArray(cells);

        // Remove numbers to create the puzzle
        let removedCount = 0;
        for (let i = 0; i < cells.length && removedCount < emptyCellsCount; i++) {
            const [r, c] = cells[i];
            const temp = puzzle[r][c];
            puzzle[r][c] = 0; // Remove the number
            
            // TODO: For a more robust generator, check if the puzzle still has a unique solution
            removedCount++;
        }
        
        return puzzle;
    }

    /**
     * Generate a new Sudoku puzzle
     * @returns {Object} - Object containing initialBoard and solutionBoard
     */
    function generateSudoku() {
        console.log(`Generating new Sudoku... (Difficulty: ${gameState.currentDifficulty})`);
        
        // 1. Create an empty board
        const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));

        // 2. Fill the board completely using the backtracking solver
        if (!solveBoard(board)) {
            console.error("Failed to generate a full Sudoku solution!");
            return null;
        }
        
        // 3. Store the complete solution
        const solutionBoard = board.map(row => [...row]);
        
        // 4. Create the puzzle by removing numbers
        const initialBoard = createPuzzle(board, gameState.difficulty);
        
        console.log("New puzzle generated.");
        return { initialBoard, solutionBoard };
    }

    /**
     * Update the active difficulty button
     * @param {string} difficulty - The selected difficulty
     */
    function updateDifficultyUI(difficulty) {
        // Remove active class from all buttons
        easyButton.classList.remove('active');
        mediumButton.classList.remove('active');
        hardButton.classList.remove('active');
        
        // Add active class to selected button
        switch (difficulty) {
            case 'easy':
                easyButton.classList.add('active');
                break;
            case 'medium':
                mediumButton.classList.add('active');
                break;
            case 'hard':
                hardButton.classList.add('active');
                break;
        }
    }

    /**
     * Set the game difficulty
     * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard')
     */
    function setDifficulty(difficulty) {
        gameState.difficulty = DIFFICULTY_LEVELS[difficulty];
        gameState.currentDifficulty = difficulty;
        updateDifficultyUI(difficulty);
        
        // Update the message to reflect the difficulty change
        showMessage(`Difficulty set to ${difficulty}. Press New Game to start.`, 'info');
    }

    /**
     * Initialize a new game
     */
    function initGame() {
        // Generate the boards
        const result = generateSudoku();
        if (!result) return; // Exit if generation failed
        
        // Update game state
        gameState.initialBoard = result.initialBoard;
        gameState.solutionBoard = result.solutionBoard;
        gameState.currentBoard = gameState.initialBoard.map(row => [...row]);
        gameState.selectedCell = null;
        gameState.gameComplete = false;
        
        // Update UI
        showMessage(`New ${gameState.currentDifficulty} game started!`, 'info');
        renderBoard();
        console.log("New game started!");
    }

    /**
     * Render the Sudoku board in HTML
     */
    function renderBoard() {
        boardElement.innerHTML = ''; // Clear previous board

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                const initialValue = gameState.initialBoard[row][col];
                const currentValue = gameState.currentBoard[row][col];
                
                if (initialValue !== 0) {
                    // Pre-filled cell (part of the puzzle)
                    cell.textContent = initialValue;
                    cell.classList.add('prefilled');
                } else {
                    // Editable cell
                    if (currentValue !== 0) {
                        cell.textContent = currentValue;
                    }
                    
                    cell.classList.add('editable');
                    
                    // Only add event listeners if game is not complete
                    if (!gameState.gameComplete) {
                        cell.addEventListener('click', () => handleCellClick(cell, row, col));
                    }
                }

                // Add thicker grid lines for better visual separation
                if ((col + 1) % SUBGRID_SIZE === 0 && col < BOARD_SIZE - 1) {
                    cell.classList.add('thick-border-right');
                }
                
                if ((row + 1) % SUBGRID_SIZE === 0 && row < BOARD_SIZE - 1) {
                    cell.classList.add('thick-border-bottom');
                }

                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Handle cell selection
     * @param {HTMLElement} cell - The selected cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    function handleCellClick(cell, row, col) {
        // Remove selection from previously selected cell
        if (gameState.selectedCell) {
            gameState.selectedCell.classList.remove('selected');
        }
        
        // Update selected cell
        gameState.selectedCell = cell;
        gameState.selectedCell.classList.add('selected');
        console.log(`Cell selected: Row ${row}, Col ${col}`);
    }

    /**
     * Show a message to the user
     * @param {string} message - The message to show
     * @param {string} type - The type of message ('info', 'success', 'error', 'warning')
     */
    function showMessage(message, type = 'info') {
        messageArea.textContent = message;
        
        // Reset all styles
        messageArea.style.color = '';
        
        // Apply appropriate style based on message type
        switch (type) {
            case 'success':
                messageArea.style.color = 'green';
                break;
            case 'error':
                messageArea.style.color = 'red';
                break;
            case 'warning':
                messageArea.style.color = 'orange';
                break;
            default:
                // Default styling for 'info'
                messageArea.style.color = 'blue';
        }
    }

    /**
     * Check if the current board state is valid according to Sudoku rules
     * @returns {Object} - Object with isComplete and isCorrect properties
     */
    function checkBoardValidity() {
        let isComplete = true;
        let isCorrect = true;

        // Check if board is complete and each placement is valid
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const value = gameState.currentBoard[row][col];
                
                // Check if board is complete
                if (value === 0) {
                    isComplete = false;
                    break;
                }
                
                // Check if the number placed violates any rules
                const originalValue = gameState.currentBoard[row][col];
                gameState.currentBoard[row][col] = 0; // Remove temporarily
                
                if (!isValid(gameState.currentBoard, row, col, originalValue)) {
                    isCorrect = false;
                }
                
                gameState.currentBoard[row][col] = originalValue; // Put it back
                
                if (!isCorrect) break;
            }
            
            if (!isComplete || !isCorrect) break;
        }

        return { isComplete, isCorrect };
    }

    // --- Event Handlers ---

    /**
     * Handle keyboard input for the selected cell
     */
    document.addEventListener('keydown', (event) => {
        // Exit if no cell is selected, cell is not editable, or game is complete
        if (!gameState.selectedCell || 
            !gameState.selectedCell.classList.contains('editable') || 
            gameState.gameComplete) {
            return;
        }

        const key = event.key;
        const row = parseInt(gameState.selectedCell.dataset.row);
        const col = parseInt(gameState.selectedCell.dataset.col);

        if (key >= '1' && key <= '9') {
            const num = parseInt(key);
            
            // Create a temporary board for validation
            const tempBoard = gameState.currentBoard.map(row => [...row]);
            tempBoard[row][col] = num;
            
            // Check if the move is valid
            if (isValid(tempBoard, row, col, num)) {
                // Update game state and UI
                gameState.currentBoard[row][col] = num;
                gameState.selectedCell.textContent = num;
                gameState.selectedCell.classList.remove('invalid');
                showMessage('', 'info'); // Clear any previous messages
            } else {
                // Show invalid move feedback
                gameState.selectedCell.textContent = num;
                gameState.selectedCell.classList.add('invalid');
                showMessage('Invalid move!', 'error');
                
                // Reset visual feedback after delay
                setTimeout(() => {
                    // Check if it's still the same cell
                    if (gameState.selectedCell && 
                        gameState.selectedCell.classList.contains('invalid') && 
                        gameState.selectedCell.dataset.row == row && 
                        gameState.selectedCell.dataset.col == col) {
                        
                        gameState.selectedCell.classList.remove('invalid');
                        // Restore text content based on current board state
                        gameState.selectedCell.textContent = gameState.currentBoard[row][col] === 0 ? '' : gameState.currentBoard[row][col];
                        showMessage('', 'info'); // Clear message
                    }
                }, 500);
                
                console.log(`Invalid move: ${num} at (${row}, ${col})`);
            }
        } else if (key === 'Backspace' || key === 'Delete') {
            // Clear the cell
            gameState.currentBoard[row][col] = 0;
            gameState.selectedCell.textContent = '';
            gameState.selectedCell.classList.remove('invalid');
            showMessage('', 'info'); // Clear any previous messages
        }
    });

    /**
     * Check if the current solution is correct
     */
    checkButton.addEventListener('click', () => {
        const { isComplete, isCorrect } = checkBoardValidity();

        if (!isComplete) {
            showMessage('Board is not complete!', 'warning');
        } else if (!isCorrect) {
            showMessage('Something is wrong... Keep trying!', 'error');
        } else {
            showMessage(`Congratulations! You solved the ${gameState.currentDifficulty} puzzle!`, 'success');
            
            // Mark game as complete
            gameState.gameComplete = true;
            
            // Remove selection and event listeners
            if (gameState.selectedCell) {
                gameState.selectedCell.classList.remove('selected');
            }
            
            gameState.selectedCell = null;
            
            // Make all cells non-editable
            boardElement.querySelectorAll('.editable').forEach(cell => {
                cell.classList.remove('editable');
                // Remove click event listeners
                const newCell = cell.cloneNode(true);
                cell.parentNode.replaceChild(newCell, cell);
            });
        }
        
        console.log(`Check result: Complete=${isComplete}, Correct=${isCorrect}`);
    });

    /**
     * Start a new game
     */
    newGameButton.addEventListener('click', initGame);

    /**
     * Set difficulty to easy
     */
    easyButton.addEventListener('click', () => {
        setDifficulty('easy');
    });

    /**
     * Set difficulty to medium
     */
    mediumButton.addEventListener('click', () => {
        setDifficulty('medium');
    });

    /**
     * Set difficulty to hard
     */
    hardButton.addEventListener('click', () => {
        setDifficulty('hard');
    });

    // Add some basic CSS for the difficulty buttons
    const style = document.createElement('style');
    style.textContent = `
        .difficulty-container {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }
        
        .difficulty-button {
            padding: 8px 16px;
            margin: 0 5px;
            border: 1px solid #ccc;
            background-color: #f5f5f5;
            cursor: pointer;
            border-radius: 4px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .difficulty-button:hover {
            background-color: #e0e0e0;
        }
        
        .difficulty-button.active {
            background-color: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
    `;
    document.head.appendChild(style);

    // --- Initialize the first game on load ---
    initGame();
});
