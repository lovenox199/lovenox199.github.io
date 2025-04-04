// --- DOM Element Selection ---
const gridElement = document.getElementById('sudoku-grid');
const numberPalette = document.getElementById('number-palette');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const newGameButton = document.getElementById('new-game-btn');
const eraseButton = document.getElementById('erase-button');
const messageArea = document.getElementById('message-area');
const messageBox = document.getElementById('message-box');
const messageBoxText = document.getElementById('message-box-text');
const messageBoxClose = document.getElementById('message-box-close');

// --- Game Constants and State ---
const N = 9; // Grid size
const K_MAP = { // Number of clues (filled cells) per difficulty
    easy: 45,
    normal: 35,
    hard: 25
};

let currentBoard = []; // Stores the current state of the board (0 for empty)
let solutionBoard = []; // Stores the complete solution
let selectedCell = null; // Stores { row, col, element } of the selected cell
let currentDifficulty = 'normal'; // Default difficulty

// --- Sudoku Generation Class (Backtracking Algorithm) ---
class SudokuGenerator {
    constructor(N = 9) {
        this.N = N; // Size of the grid (e.g., 9)
        this.SRN = Math.sqrt(N); // Square root of N (e.g., 3 for a 9x9 grid)
        this.mat = Array.from({ length: N }, () => Array(N).fill(0)); // The Sudoku grid matrix
        this.solution = null; // To store the fully solved grid
    }

    // Main function to fill the grid completely
    fillValues() {
        if (!this.fillDiagonal()) { // Fill the diagonal 3x3 boxes first
             console.error("SudokuGenerator: Failed during diagonal fill.");
             return false; // Stop if diagonal fill failed
        }
        // *** CHANGED: Start fillRemaining from (0, 0) ***
        if (!this.fillRemaining(0, 0)) { // Fill the remaining cells recursively
             console.error("SudokuGenerator: Failed during remaining fill.");
             return false; // Stop if remaining fill failed
        }

        // Check if filling was successful before assigning solution
        // A more robust check might be needed, but last cell is a basic indicator
        if (this.mat[this.N - 1][this.N - 1] !== 0) {
             this.solution = this.mat.map(row => [...row]); // Save the completed grid as the solution
             return true;
        }
        console.error("SudokuGenerator: Grid fill seemed complete, but validation failed.");
        return false; // Filling failed validation
    }

    // Fill the diagonal SRN x SRN matrices (3x3 for N=9)
    fillDiagonal() {
        for (let i = 0; i < this.N; i = i + this.SRN) {
            if (!this.fillBox(i, i)) { // Fill the box starting at (i, i)
                return false; // Return false if fillBox failed
            }
        }
        return true; // All diagonal boxes filled successfully
    }

    // Fill a 3x3 subgrid with random, non-repeating numbers
    fillBox(row, col) {
        let num;
        let attempts = 0; // Prevent potential infinite loops
        const maxBoxAttempts = this.N * 5; // Increased attempts for box fill safety

        // Create a temporary list of numbers 1-N to shuffle
        let numsToPlace = Array.from({length: this.N}, (_, k) => k + 1);
        this.shuffleArray(numsToPlace); // Shuffle the numbers for randomness

        let numIndex = 0;
        for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                 // Check if cell is already filled (shouldn't happen in fillDiagonal context, but good practice)
                 if (this.mat[row + i][col + j] !== 0) continue;

                 // Try placing shuffled numbers until one works or list exhausted
                 let placed = false;
                 attempts = 0; // Reset attempts for each cell
                 while(numIndex < numsToPlace.length && attempts < maxBoxAttempts) {
                     num = numsToPlace[numIndex];
                     // Check only within the current box being filled
                     if (this.unUsedInBoxStrict(row, col, row + i, col + j, num)) {
                         this.mat[row + i][col + j] = num;
                         placed = true;
                         // Remove the placed number from the list to avoid reuse in this box
                         numsToPlace.splice(numIndex, 1);
                         numIndex = 0; // Reset index to check remaining numbers for next cell
                         break; // Move to the next cell in the box
                     } else {
                         numIndex++; // Try the next number in the shuffled list
                     }
                     attempts++;
                 }

                 if (!placed) {
                      console.error(`SudokuGenerator: Failed to place number in box at [${row+i}, ${col+j}]`);
                      // Could attempt to backtrack within the box fill, but for simplicity, signal failure
                      return false; // Indicate failure to fill the box
                 }
            }
        }
        return true; // Box filled successfully
    }

     // Helper to shuffle an array (Fisher-Yates)
     shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Utility: Generate a random number between 1 and num (inclusive)
    randomGenerator(num) {
        return Math.floor(Math.random() * num + 1);
    }

    // Check if a number is safe to place at cell (i, j) - Considers row, col, and box
    checkIfSafe(i, j, num) {
        return (
            this.unUsedInRow(i, num) && // Check row
            this.unUsedInCol(j, num) && // Check column
            this.unUsedInBox(i - (i % this.SRN), j - (j % this.SRN), num) // Check 3x3 subgrid
        );
    }

    // Check if 'num' is not used in row 'i'
    unUsedInRow(i, num) {
        for (let j = 0; j < this.N; j++) {
            if (this.mat[i][j] === num) {
                return false; // Number found in row
            }
        }
        return true; // Number not found in row
    }

    // Check if 'num' is not used in column 'j'
    unUsedInCol(j, num) {
        for (let i = 0; i < this.N; i++) {
            if (this.mat[i][j] === num) {
                return false; // Number found in column
            }
        }
        return true; // Number not found in column
    }

    // Check if 'num' is not used in the 3x3 box starting at (rowStart, colStart)
    unUsedInBox(rowStart, colStart, num) {
        for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                // Ensure indices are valid before checking
                 if (this.mat[rowStart + i] && typeof this.mat[rowStart + i][colStart + j] !== 'undefined') {
                    if (this.mat[rowStart + i][colStart + j] === num) {
                        return false; // Number found in box
                    }
                 }
            }
        }
        return true; // Number not found in box
    }

    // Stricter check used during initial box fill - only checks within the box itself
    unUsedInBoxStrict(boxRowStart, boxColStart, cellRow, cellCol, num) {
         for (let i = 0; i < this.SRN; i++) {
            for (let j = 0; j < this.SRN; j++) {
                const currentRow = boxRowStart + i;
                const currentCol = boxColStart + j;
                 // Check only cells other than the one we are trying to fill
                 // and ensure the cell has been initialized (value is not undefined)
                 if ( (currentRow !== cellRow || currentCol !== cellCol) &&
                      this.mat[currentRow] && typeof this.mat[currentRow][currentCol] !== 'undefined' )
                 {
                    if (this.mat[currentRow][currentCol] === num) {
                        return false; // Number found in box
                    }
                 }
            }
        }
        return true; // Number not found in box
    }


    // *** REVISED Recursive function to fill the remaining cells ***
    fillRemaining(i, j) {
        // Move to next cell (handle row wrap)
        if (j === this.N) {
            i++;    // Move to next row
            j = 0;    // Reset column to 0
        }

        // Base case: If all rows are filled (i goes beyond the last row index N-1)
        if (i === this.N) {
            return true; // Successfully filled the grid
        }

        // If the current cell (i, j) is already filled (e.g., by fillDiagonal), skip it
        if (this.mat[i][j] !== 0) {
            return this.fillRemaining(i, j + 1); // Move to the next cell
        }

        // Try numbers 1-N for the current empty cell
        // Shuffle numbers to try for potentially better performance/randomness
        let numsToTry = Array.from({length: this.N}, (_, k) => k + 1);
        this.shuffleArray(numsToTry);

        for (let k = 0; k < numsToTry.length; k++) {
             let num = numsToTry[k];
            if (this.checkIfSafe(i, j, num)) { // Check row, column, and box
                this.mat[i][j] = num; // Place the number

                // Recursively try to fill the rest of the grid starting from the next cell
                if (this.fillRemaining(i, j + 1)) {
                    return true; // If successful, propagate true up the stack
                }

                // Backtrack: If the recursive call failed, reset the cell
                this.mat[i][j] = 0;
            }
        }

        // If no number (1-N) works for this cell, trigger backtracking
        return false;
    }


    // Remove 'K' number of digits from the filled grid to create the puzzle
    removeKDigits(K) {
        let count = K; // Number of cells to empty
        let attempts = 0; // Safety break for loop
        const maxAttempts = this.N * this.N * 3; // Increased limit

        if (!this.solution) {
            console.error("SudokuGenerator: Cannot remove digits, solution not generated.");
            return; // Cannot proceed without a valid solution
        }
        // Start removing from the generated solution matrix
        this.mat = this.solution.map(row => [...row]);


        while (count > 0 && attempts < maxAttempts) {
            attempts++;
            // Select a random cell (0 to 80 for 9x9)
            let cellId = this.randomGenerator(this.N * this.N) - 1;
            let i = Math.floor(cellId / this.N); // Calculate row from cellId
            let j = cellId % this.N; // Calculate column from cellId

            // Ensure the cell exists and is not already empty
            if (this.mat[i] && this.mat[i][j] !== 0) {
                let temp = this.mat[i][j]; // Store the number temporarily
                this.mat[i][j] = 0; // Remove the number

                // --- More Robust Check for Unique Solution (Still Heuristic) ---
                // Create a copy of the board state *after* removal
                let tempBoard = this.mat.map(row => [...row]);
                let solutionsFound = 0;
                // Try to solve the board from this state
                // We need a separate solving function or adapt fillRemaining
                // For simplicity here, we stick to the previous basic check:
                // How many numbers *could* fit in the emptied cell based on current board?

                let possibleFits = 0;
                for (let num = 1; num <= this.N; num++) {
                     // Use checkIfSafe on the board *after* removal
                     if (this.isSafeForPuzzleGen(tempBoard, i, j, num)) {
                         possibleFits++;
                     }
                }

                // If removing makes it ambiguous (more than 1 number fits easily), put it back.
                // A value of 0 means the original number was the only fit.
                // A value of 1 means the original number + one other fit (ambiguous).
                // A value > 1 is definitely ambiguous.
                // We want the state where only the original number could fit back (possibleFits = 0 after removal).
                // Let's refine: We want to ensure removing it doesn't *immediately* allow multiple numbers.
                // If possibleFits > 0 (meaning numbers other than 'temp' could fit now), it might lead to ambiguity.
                // A truly robust check requires a full solver. Let's keep the simple heuristic:
                // If more than one number could fit in that specific empty spot now, revert.

                if (possibleFits > 1) { // If more than one number could fit in the spot now
                     this.mat[i][j] = temp; // Restore the number
                } else {
                    count--; // Decrement the count of numbers successfully removed
                }
            }
        }
         if (count > 0) {
             console.warn(`SudokuGenerator: Could not remove all ${K} digits. ${count} remaining.`);
             // Proceeding anyway, might result in an easier puzzle than intended.
         }

         // Edge case: Ensure the top-left cell isn't empty (just for aesthetics/predictability)
         // Check if mat exists and has content before accessing mat[0][0]
         if (this.mat && this.mat[0] && this.mat[0][0] === 0) {
            outer: for (let r = 0; r < this.N; r++) {
                for (let c = 0; c < this.N; c++) {
                    if (this.mat[r] && this.mat[r][c] !== 0) {
                        this.mat[0][0] = this.mat[r][c];
                        this.mat[r][c] = 0;
                        break outer;
                    }
                }
            }
        }
    }

     // Helper for removeKDigits: Check safety on a potentially incomplete board
     isSafeForPuzzleGen(board, i, j, num) {
        // Check row
        if (!board[i]) return false;
        for (let x = 0; x < this.N; x++) {
            if (board[i][x] === num) return false;
        }
        // Check column
        for (let x = 0; x < this.N; x++) {
            if (board[x] && board[x][j] === num) return false;
        }
        // Check 3x3 box
        const startRow = i - (i % this.SRN);
        const startCol = j - (j % this.SRN);
        for (let r = 0; r < this.SRN; r++) {
            for (let c = 0; c < this.SRN; c++) {
                if (board[startRow + r] && typeof board[startRow + r][startCol + c] !== 'undefined') {
                    if (board[startRow + r][startCol + c] === num) return false;
                }
            }
        }
        return true;
    }


    // Generate a complete puzzle with a given difficulty
    generate(difficulty) {
        this.mat = Array.from({ length: N }, () => Array(N).fill(0)); // Reset matrix
        this.solution = null; // Reset solution

        // Retry mechanism for generation
        let success = false;
        let generationAttempts = 0;
        const maxGenerationAttempts = 5; // Try generating a few times if it fails

        while (!success && generationAttempts < maxGenerationAttempts) {
             generationAttempts++;
             console.log(`Generation attempt ${generationAttempts}...`);
             this.mat = Array.from({ length: N }, () => Array(N).fill(0)); // Reset matrix for retry
             success = this.fillValues(); // Try to create a full, valid Sudoku solution
        }


        if (!success || !this.solution) {
            console.error(`SudokuGenerator: Failed to generate a valid solution after ${generationAttempts} attempts.`);
            return null; // Return null if solution generation failed
        }

        // Calculate how many cells to remove based on difficulty
        const cellsToRemove = (this.N * this.N) - (K_MAP[difficulty] || K_MAP['normal']);
        this.removeKDigits(cellsToRemove); // Remove digits to create the puzzle (modifies this.mat)

        // Return both the puzzle (this.mat) and the full solution (this.solution)
        return { puzzle: this.mat, solution: this.solution };
    }
}

// --- UI Functions ---

// Create the HTML grid structure
function createGrid() {
    gridElement.innerHTML = ''; // Clear previous grid cells
    for (let i = 0; i < N * N; i++) {
        const cell = document.createElement('div');
        cell.classList.add('sudoku-cell'); // Add base styling class
        cell.dataset.index = i; // Store linear index
        const row = Math.floor(i / N);
        const col = i % N;
        cell.dataset.row = row; // Store row index
        cell.dataset.col = col; // Store column index

        // Add a span inside the cell to hold the number
        const span = document.createElement('span');
        cell.appendChild(span);

        // Add click listener to each cell
        cell.addEventListener('click', handleCellClick);
        gridElement.appendChild(cell); // Add cell to the grid container
    }
}

// Fill the created grid with numbers from the puzzle
function populateGrid(puzzle) {
    if (!puzzle) { // Check if puzzle data is valid
        if (messageArea) messageArea.textContent = "Error: Could not populate grid - invalid puzzle data.";
        console.error("populateGrid: Received invalid puzzle data.");
        return;
    }
    const cells = gridElement.children;
    if (cells.length !== N * N) {
         if (messageArea) messageArea.textContent = "Error: Grid structure mismatch.";
         console.error("populateGrid: HTML grid cell count mismatch.");
         return;
    }

    for (let i = 0; i < N * N; i++) {
        const cell = cells[i];
        const span = cell.querySelector('span');
        if (!span) continue; // Skip if span not found

        const row = Math.floor(i / N);
        const col = i % N;

        // Defensive check for puzzle array structure
        if (!puzzle[row] || typeof puzzle[row][col] === 'undefined') {
            console.error(`populateGrid: Invalid puzzle data at row ${row}, col ${col}`);
            span.textContent = '?'; // Indicate error on the cell
            cell.classList.add('error-cell');
            continue; // Skip this cell
        }

        const value = puzzle[row][col]; // Get number from the puzzle matrix

        // Display the number or leave empty if 0
        span.textContent = value === 0 ? '' : value;

        // Reset all dynamic classes first
        cell.classList.remove('fixed-cell', 'error-cell', 'selected-cell', 'highlighted-cell', 'same-number-highlight');

        // Add 'fixed-cell' class for pre-filled numbers
        if (value !== 0) {
            cell.classList.add('fixed-cell');
        } else {
            cell.classList.remove('fixed-cell'); // Ensure empty cells are not marked fixed
        }
    }
}

// Handle clicking on a grid cell
function handleCellClick(event) {
    const clickedCellElement = event.currentTarget; // The div cell that was clicked
    if (!clickedCellElement) return;

    const index = parseInt(clickedCellElement.dataset.index);
    const row = Math.floor(index / N);
    const col = index % N;

     // Check if indices are valid
    if (isNaN(index) || isNaN(row) || isNaN(col)) {
        console.error("Invalid cell data:", clickedCellElement.dataset);
        return;
    }

    // If the same cell is clicked again, deselect it
    if (selectedCell && selectedCell.element === clickedCellElement) {
         clearSelectionAndHighlight();
         selectedCell = null;
    } else {
        clearSelectionAndHighlight(); // Clear previous selection/highlight

        // Store the newly selected cell's info
        selectedCell = { row, col, element: clickedCellElement };
        clickedCellElement.classList.add('selected-cell'); // Mark as selected

        // Highlight related cells (row, column, subgrid) and same numbers
        highlightRelatedCells(row, col);
        highlightSameNumbers(clickedCellElement);
    }
}

// Highlight the row, column, and 3x3 subgrid of the selected cell
function highlightRelatedCells(row, col) {
    const cells = gridElement.children;
    if (cells.length !== N * N) return; // Grid not ready

    // Highlight Row & Column
    for (let i = 0; i < N; i++) {
        if (cells[row * N + i]) cells[row * N + i].classList.add('highlighted-cell'); // Highlight row cells
        if (cells[i * N + col]) cells[i * N + col].classList.add('highlighted-cell'); // Highlight column cells
    }

    // Highlight Subgrid
    const startRow = row - (row % 3); // Calculate starting row of the 3x3 box
    const startCol = col - (col % 3); // Calculate starting column of the 3x3 box
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cellIndex = (startRow + i) * N + (startCol + j);
            if (cells[cellIndex]) cells[cellIndex].classList.add('highlighted-cell'); // Highlight box cells
        }
    }

    // Re-apply selected class as it might be overwritten by highlight
     if(selectedCell && selectedCell.element) {
         selectedCell.element.classList.add('selected-cell');
     }
}

// Highlight all cells containing the same number as the selected cell
function highlightSameNumbers(selectedElement) {
    if (!selectedElement || !selectedElement.querySelector) return; // Element not valid
    const numberSpan = selectedElement.querySelector('span');
    if (!numberSpan) return; // Span not found

    const number = numberSpan.textContent; // Get the number in the selected cell
    if (!number) return; // Don't highlight if the cell is empty

    const cells = gridElement.children;
    if (cells.length !== N * N) return; // Grid not ready

    for (let i = 0; i < N * N; i++) {
         const currentCell = cells[i];
         if (!currentCell) continue;
         const currentSpan = currentCell.querySelector('span');
         if (currentSpan && currentSpan.textContent === number) {
             currentCell.classList.add('same-number-highlight'); // Add highlight class
         }
    }
    // Re-apply selected class if it got overwritten by same-number highlight
     if (selectedCell && selectedCell.element === selectedElement) {
         selectedElement.classList.add('selected-cell');
     }
}

// Clear all selection and highlight classes from all cells
function clearSelectionAndHighlight() {
    const cells = gridElement.children;
    if (cells.length !== N * N) return; // Grid not ready
    for (let i = 0; i < N * N; i++) {
        if (cells[i]) { // Check if cell exists
             cells[i].classList.remove('selected-cell', 'highlighted-cell', 'same-number-highlight');
        }
    }
}

// Handle clicking on a number in the number palette
function handleNumberInput(event) {
    // Ensure a cell is selected and it's not a fixed (pre-filled) cell
    if (!selectedCell || !selectedCell.element || selectedCell.element.classList.contains('fixed-cell')) {
        return;
    }

    const number = parseInt(event.target.dataset.number); // Get the number clicked
    if (isNaN(number)) return; // Invalid number

    const { row, col, element } = selectedCell;
    const span = element.querySelector('span');
    if (!span) return; // Span not found

    // Update the internal board state
    if (currentBoard[row]) {
        currentBoard[row][col] = number;
    } else {
         console.error("Board state error: Row does not exist", row);
         return;
    }
    // Update the UI
    span.textContent = number;

    // Validate the board and highlight any errors
    validateAndHighlightErrors();
    // Re-highlight cells with the same number as the one just entered
    highlightSameNumbers(element);

    // Check if the board is full and valid (win condition)
    if (isBoardFull() && isBoardValid()) {
         showWinMessage();
    }
}

// Handle clicking the erase button
function handleErase() {
     // Ensure a cell is selected and it's not a fixed cell
     if (!selectedCell || !selectedCell.element || selectedCell.element.classList.contains('fixed-cell')) {
        return;
    }
     const { row, col, element } = selectedCell;
     const span = element.querySelector('span');
     if (!span) return; // Span not found


     // Update the internal board state (0 represents empty)
     if (currentBoard[row]) {
        currentBoard[row][col] = 0;
     } else {
         console.error("Board state error: Row does not exist", row);
         return;
     }
     // Update the UI
     span.textContent = '';
     element.classList.remove('error-cell'); // Remove error state if the cell was erased

     // Re-validate the board after erasing
     validateAndHighlightErrors();
     // Clear highlights and re-apply selection/related highlights for the now-empty cell
     clearSelectionAndHighlight();
     element.classList.add('selected-cell');
     highlightRelatedCells(row, col);
}

// --- Validation Functions ---

// Check if placing 'num' at (row, col) is valid according to Sudoku rules within the current board state
function isValid(board, row, col, num) {
    // Check row for conflicts (excluding the cell itself)
    if (!board[row]) return false; // Row doesn't exist
    for (let x = 0; x < N; x++) {
        if (x !== col && board[row][x] === num) return false;
    }
    // Check column for conflicts (excluding the cell itself)
    for (let x = 0; x < N; x++) {
        // Ensure row exists before checking column cell
        if (x !== row && board[x] && board[x][col] === num) return false;
    }
    // Check 3x3 subgrid for conflicts (excluding the cell itself)
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
             const currentRow = startRow + i;
             const currentCol = startCol + j;
             // Ensure row exists before checking cell
             if (board[currentRow]) {
                 // Check only other cells in the box
                 if (currentRow !== row || currentCol !== col) {
                     if (board[currentRow][currentCol] === num) {
                        return false;
                     }
                 }
             }
        }
    }
    return true; // No conflicts found
}

// Iterate through the board, check each user-entered number, and highlight errors
function validateAndHighlightErrors() {
     const cells = gridElement.children;
     if (cells.length !== N * N) return false; // Grid not ready

     let hasErrors = false;

     // Clear previous error highlights
     for (let i = 0; i < N * N; i++) {
         if (cells[i]) cells[i].classList.remove('error-cell');
     }

     // Check each cell on the board
     for (let r = 0; r < N; r++) {
         for (let c = 0; c < N; c++) {
             // Ensure row exists in board data
             if (!currentBoard[r]) continue;

             const num = currentBoard[r][c]; // Get the number in the cell
             const cellIndex = r * N + c;
             const cellElement = cells[cellIndex];

             // Only validate non-empty, non-fixed cells
             if (num !== 0 && cellElement && !cellElement.classList.contains('fixed-cell')) {
                 if (!isValid(currentBoard, r, c, num)) { // If the number violates Sudoku rules
                     cellElement.classList.add('error-cell'); // Add error class
                     hasErrors = true;
                 }
             }
         }
     }
     // Update the message area based on whether errors were found
     // Only update if messageArea exists
     if (messageArea) {
        // Clear previous color styling
        messageArea.style.color = ''; // Reset to default color
        messageArea.textContent = hasErrors ? "Conflicts detected in the grid." : "";
        if (hasErrors) {
             messageArea.style.color = 'orange'; // Use orange for conflict warning
        }
     }
     return !hasErrors; // Return true if the board is currently valid, false otherwise
}

// Check if all cells on the board are filled (non-zero)
 function isBoardFull() {
     if (!currentBoard || currentBoard.length !== N) return false; // Board not initialized
     for (let r = 0; r < N; r++) {
        if (!currentBoard[r] || currentBoard[r].length !== N) return false; // Row invalid
         for (let c = 0; c < N; c++) {
             if (currentBoard[r][c] === 0) {
                 return false; // Found an empty cell
             }
         }
     }
     return true; // No empty cells found
 }

// Check if the entire board is valid (no rule violations)
 function isBoardValid() {
      if (!currentBoard || currentBoard.length !== N) return false; // Board not initialized
     // Reuse the validation logic: check every cell
     for (let r = 0; r < N; r++) {
        if (!currentBoard[r] || currentBoard[r].length !== N) return false; // Row invalid
         for (let c = 0; c < N; c++) {
             const num = currentBoard[r][c];
              // If a cell has a number and it's invalidly placed
              if (num !== 0 && !isValid(currentBoard, r, c, num)) {
                  return false; // Found an invalid placement
              }
         }
     }
     return true; // No errors found across the board
 }

// --- Game Flow Functions ---

// Start a new game with the specified difficulty
function startNewGame(difficulty) {
    // Ensure messageArea exists before trying to update it
    if (messageArea) {
        messageArea.textContent = `Generating ${difficulty} puzzle... Please wait.`; // Update status message
        messageArea.style.color = ''; // Reset color
    } else {
        console.log(`Generating ${difficulty} puzzle... Please wait.`);
    }
    currentDifficulty = difficulty; // Store the selected difficulty
    selectedCell = null; // Reset selected cell
    clearSelectionAndHighlight(); // Clear any existing highlights

    // Use setTimeout to allow the UI to update before potentially heavy generation starts
    setTimeout(() => {
        try {
            console.log("Attempting to generate puzzle..."); // Console log
            const generator = new SudokuGenerator(N); // Create a generator instance
            const generatedData = generator.generate(difficulty); // Generate puzzle and solution

            if (!generatedData || !generatedData.puzzle || !generatedData.solution) {
                 throw new Error("Puzzle generation failed or returned invalid data."); // Throw error
            }
            const { puzzle, solution } = generatedData;

            console.log("Puzzle generated. Creating grid..."); // Console log

            // Deep copy the puzzle to currentBoard to track user changes
            currentBoard = puzzle.map(row => [...row]);
            solutionBoard = solution; // Store the full solution

            createGrid(); // Create the HTML grid elements
            console.log("Grid created. Populating grid..."); // Console log

            populateGrid(currentBoard); // Fill the grid with the generated puzzle

             console.log("Grid populated. Game ready."); // Console log
             if (messageArea) { // Update status only if messageArea exists
                 messageArea.textContent = `New ${difficulty} game started! Select a cell.`;
             }

        } catch (error) {
            console.error("Error starting new game:", error);
            if (messageArea) { // Display error in the UI if possible
                messageArea.textContent = `Error starting game: ${error.message}. Please try refreshing.`;
                messageArea.style.color = 'red'; // Make error message stand out
            }
            // Optionally clear the grid or show a specific error state visually
            if (gridElement) gridElement.innerHTML = '<p class="text-red-600 p-4 text-center">Failed to load game board.<br>Please try refreshing the page.</p>';
        }
    }, 50); // Small delay (50ms)
}

 // Show the win message using the custom message box
 function showWinMessage() {
     if (messageBox && messageBoxText) {
        messageBoxText.textContent = "Congratulations! You solved the Sudoku!";
        messageBox.style.display = 'block'; // Make the message box visible
     } else {
        alert("Congratulations! You solved the Sudoku!"); // Fallback
     }
 }

 // Close the custom message box when the OK button is clicked
 if (messageBoxClose) {
    messageBoxClose.addEventListener('click', () => {
        if (messageBox) messageBox.style.display = 'none'; // Hide the message box
    });
 }


// --- Event Listeners Setup ---

// Add listeners to difficulty buttons
if (difficultyButtons) {
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
             if (e.target.dataset.difficulty) {
                startNewGame(e.target.dataset.difficulty); // Start new game with clicked difficulty
             }
        });
    });
}

// Add listener to the "New Game" button
if (newGameButton) {
    newGameButton.addEventListener('click', () => {
        startNewGame(currentDifficulty); // Start new game with the *current* difficulty setting
    });
}

// Add listener to the number palette (using event delegation)
if (numberPalette) {
    numberPalette.addEventListener('click', (e) => {
        // Check if a number button was clicked (and not the erase button)
        if (e.target.classList.contains('number-button') && e.target.dataset.number) {
            handleNumberInput(e); // Handle number input
        }
    });
}

// Add listener to the erase button
if (eraseButton) {
    eraseButton.addEventListener('click', handleErase);
}

// Add keyboard support for number input and deletion
document.addEventListener('keydown', (e) => {
    // Ignore if no cell is selected or if the selected cell is fixed
    if (!selectedCell || !selectedCell.element || selectedCell.element.classList.contains('fixed-cell')) return;

    const key = parseInt(e.key);
    // Handle number keys 1-9
    if (!isNaN(key) && key >= 1 && key <= 9) {
        // Find the corresponding button in the palette and simulate a click event
        const button = numberPalette ? numberPalette.querySelector(`.number-button[data-number="${key}"]`) : null;
        if (button) {
            // Prevent default browser action for number keys if used for input
            e.preventDefault();
            handleNumberInput({ target: button }); // Pass a simulated event object
        }
    }
    // Handle Backspace or Delete keys for erasing
    else if (e.key === 'Backspace' || e.key === 'Delete') {
         // Prevent default browser action (like navigating back)
         e.preventDefault();
         handleErase();
    }
});

// --- Initialisation ---
// Ensure DOM is fully loaded before starting the game
document.addEventListener('DOMContentLoaded', () => {
     // Check if essential elements exist before starting
     if (!gridElement || !messageArea) {
         console.error("Essential DOM elements not found. Cannot start game.");
         if(document.body) { // Try to display error in body if messageArea is missing
             const errorMsg = document.createElement('p');
             errorMsg.textContent = "Error: Could not find game elements. HTML structure might be incorrect.";
             errorMsg.style.color = 'red';
             errorMsg.style.textAlign = 'center';
             errorMsg.style.padding = '20px';
             document.body.prepend(errorMsg);
         }
         return; // Stop initialization
     }
     console.log("DOM fully loaded. Starting initial game.");
     // Start a game with the default difficulty when the page loads
     startNewGame(currentDifficulty);
});
