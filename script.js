document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const messageArea = document.getElementById('message-area');
    const checkButton = document.getElementById('check-button');
    const newGameButton = document.getElementById('new-game-button');

    let initialBoard = []; // The puzzle board shown to the user
    let solutionBoard = []; // The complete solution (generated internally)
    let currentBoard = []; // The user's current progress
    let selectedCell = null;
    // --- Difficulty ---
    // Adjust the number of empty cells for difficulty (e.g., 30=Easy, 40=Medium, 50=Hard)
    let difficulty = 45; // Number of cells to make empty (approx)

    // --- Fisher-Yates Shuffle (for randomization) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // --- Find next empty cell (row-major order) ---
    function findEmpty(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    return [r, c];
                }
            }
        }
        return null; // No empty cells
    }

    // --- Check if a number is valid in a given position ---
    // (Same as before, just ensure it's accessible globally within the script)
    function isValid(board, row, col, num) {
        // Check Row
        for (let c = 0; c < 9; c++) {
            if (board[row][c] === num && c !== col) return false;
        }
        // Check Column
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num && r !== row) return false;
        }
        // Check 3x3 Subgrid
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if (board[r][c] === num && (r !== row || c !== col)) return false;
            }
        }
        return true; // Number is valid
    }

    // --- Sudoku Solver/Generator (Backtracking) ---
    function solveBoard(board) {
        const emptySpot = findEmpty(board);
        if (!emptySpot) {
            return true; // Board is full (solved)
        }
        const [row, col] = emptySpot;

        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(numbers); // Randomize number order

        for (let num of numbers) {
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

    // --- Create Puzzle by Removing Numbers ---
    function createPuzzle(board, emptyCellsCount) {
        let attempts = emptyCellsCount;
        const puzzle = board.map(row => [...row]); // Start with the full solution

        // Get all cell coordinates
        let cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push([r, c]);
            }
        }
        shuffleArray(cells); // Shuffle the cell order

        let removedCount = 0;
        for (let i = 0; i < cells.length && removedCount < attempts; i++) {
             const [r, c] = cells[i];

             if (puzzle[r][c] !== 0) {
                 puzzle[r][c] = 0; // Remove the number
                 removedCount++;
                 // Note: A more robust generator would check if the puzzle still has a unique solution here.
                 // This basic version just removes numbers randomly, which might lead to multiple solutions.
             }
        }
        return puzzle;
    }

    // --- Generate a New Sudoku ---
    function generateSudoku() {
        console.log("Generating new Sudoku...");
        // 1. Create an empty board
        let board = Array(9).fill(null).map(() => Array(9).fill(0));

        // 2. Fill the board completely using the backtracking solver
        if (!solveBoard(board)) {
            console.error("Failed to generate a full Sudoku solution!");
            return null; // Should ideally not happen with an empty board start
        }
        solutionBoard = board.map(row => [...row]); // Store the complete solution

        // 3. Create the puzzle by removing numbers
        initialBoard = createPuzzle(board, difficulty);
        currentBoard = initialBoard.map(row => [...row]); // Set the starting state for the player

        console.log("New puzzle generated.");
    }


    // --- Game Initialization ---
    function initGame() {
        generateSudoku(); // Generate the boards
        if (!initialBoard) return; // Exit if generation failed

        selectedCell = null;
        messageArea.textContent = '';
        createBoardHTML(); // Create the visual representation
        console.log("New game started!");
    }

    // --- Create HTML Board ---
    // Renamed from createBoard to avoid conflict with internal board arrays
    function createBoardHTML() {
        boardElement.innerHTML = ''; // Clear previous board

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const value = initialBoard[r][c]; // Use the generated puzzle board
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('prefilled');
                } else {
                    // Display numbers from currentBoard if they exist (e.g., after a mistake and reset)
                    if(currentBoard[r][c] !== 0) {
                        cell.textContent = currentBoard[r][c];
                    }
                    cell.classList.add('editable');
                    cell.addEventListener('click', () => handleCellClick(cell, r, c));
                }

                // Add thicker grid lines
                if ((c + 1) % 3 === 0 && c < 8) cell.classList.add('thick-border-right');
                if ((r + 1) % 3 === 0 && r < 8) cell.classList.add('thick-border-bottom');

                boardElement.appendChild(cell);
            }
        }
    }

    // --- Handle Cell Selection ---
    // (Same as before)
    function handleCellClick(cell, row, col) {
        if (selectedCell) selectedCell.classList.remove('selected');
        selectedCell = cell;
        selectedCell.classList.add('selected');
        console.log(`Cell selected: Row ${row}, Col ${col}`);
    }

    // --- Handle Keyboard Input ---
    // (Modified slightly to use currentBoard for validation context)
    document.addEventListener('keydown', (event) => {
        if (!selectedCell || !selectedCell.classList.contains('editable')) return;

        const key = event.key;
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        if (key >= '1' && key <= '9') {
            const num = parseInt(key);
            // Create a temporary board representing the *next* state for validation
            let tempBoard = currentBoard.map(row => [...row]);
            tempBoard[row][col] = num; // Place the number hypothetically

             // Check validity based on the hypothetical placement
            if (isValid(tempBoard, row, col, num)) {
                currentBoard[row][col] = num; // Update the actual game state
                selectedCell.textContent = num;
                selectedCell.classList.remove('invalid');
                messageArea.textContent = '';
            } else {
                // Visual feedback for invalid move
                selectedCell.textContent = num; // Show invalid number briefly
                selectedCell.classList.add('invalid');
                messageArea.textContent = 'Invalid move!';
                messageArea.style.color = 'red';
                // Reset visual feedback after delay
                setTimeout(() => {
                     if (selectedCell && selectedCell.classList.contains('invalid') && selectedCell.dataset.row == row && selectedCell.dataset.col == col) { // Ensure it's still the same cell
                         selectedCell.classList.remove('invalid');
                         // Restore text content based on the actual currentBoard state (which wasn't updated for the invalid move)
                         selectedCell.textContent = currentBoard[row][col] === 0 ? '' : currentBoard[row][col];
                         messageArea.textContent = '';
                     }
                }, 500);
                console.log(`Invalid move: ${num} at (${row}, ${col})`);
            }
        } else if (key === 'Backspace' || key === 'Delete') {
            currentBoard[row][col] = 0;
            selectedCell.textContent = '';
            selectedCell.classList.remove('invalid');
            messageArea.textContent = '';
        }
    });


    // --- Check Solution ---
    // (Modified to check against rules, not just completion)
    checkButton.addEventListener('click', () => {
        let isComplete = true;
        let isCorrect = true;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const value = currentBoard[r][c];
                if (value === 0) {
                    isComplete = false;
                    break; // Incomplete
                }
                 // Check if the number placed violates any rules *in its current position*
                 // Temporarily remove it to check validity against the rest of the board
                 const originalValue = currentBoard[r][c];
                 currentBoard[r][c] = 0; // Remove temporarily
                 if (!isValid(currentBoard, r, c, originalValue)) {
                    isCorrect = false;
                 }
                 currentBoard[r][c] = originalValue; // Put it back

                if (!isCorrect) break; // Found an error
            }
             if (!isComplete || !isCorrect) break;
        }

        if (!isComplete) {
            messageArea.textContent = 'Board is not complete!';
            messageArea.style.color = 'orange';
        } else if (!isCorrect) {
            messageArea.textContent = 'Something is wrong... Keep trying!';
            messageArea.style.color = 'red';
        } else {
            messageArea.textContent = 'Congratulations! You solved it!';
            messageArea.style.color = 'green';
            if (selectedCell) selectedCell.classList.remove('selected');
            selectedCell = null;
            boardElement.querySelectorAll('.editable').forEach(cell => {
                 cell.classList.remove('editable');
                 cell.removeEventListener('click', handleCellClick); // Optional: remove listeners
            });
        }
         console.log(`Check result: Complete=${isComplete}, Correct=${isCorrect}`);
    });


    // --- New Game Button ---
    // Now calls initGame which includes generation
    newGameButton.addEventListener('click', initGame);

    // --- Initial Setup ---
    initGame(); // Start the first game on load
});
