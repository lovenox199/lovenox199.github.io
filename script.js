    // --- DOM Element Selection ---
    const boardContainer = document.getElementById('sudoku-board-container');
    const numberPalette = document.getElementById('number-palette');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const eraseButton = document.getElementById('erase-button');
    const messageArea = document.getElementById('message-area');
    const messageBox = document.getElementById('message-box');
    const messageBoxText = document.getElementById('message-box-text');
    const messageBoxClose = document.getElementById('message-box-close');
    const timerElement = document.getElementById('timer');
    const undoButton = document.getElementById('undo-button');
    const hintButton = document.getElementById('hint-button');
    const hintCountElement = document.getElementById('hint-count');
    const difficultyDisplayElement = document.getElementById('difficulty-display');

    // --- Game Constants and State ---
    const N = 9;
    const SQRT_N = 3;
    const K_MAP = { easy: 45, normal: 35, hard: 25 };
    const MAX_HINTS = 3;
    // *** MODIFIED: Changed color intensity to 400 ***
    const DIFFICULTY_TEXT_COLORS = {
        easy: 'text-green-400',
        normal: 'text-yellow-400',
        hard: 'text-red-400'
    };
    // Store previous color class to remove it easily
    let currentDifficultyColorClass = DIFFICULTY_TEXT_COLORS.normal; // Default

    let currentBoard = [];
    let solutionBoard = [];
    let selectedTile = null;
    let currentDifficulty = 'normal';
    let tileElements = [];

    // Timer variables
    let timerInterval = null;
    let startTime = 0;
    let elapsedTime = 0;

    // Move History for Undo
    let moveHistory = [];

    // Hint counter variable
    let hintsRemaining = MAX_HINTS;

    // --- Sudoku Generation Class (Minified - No changes needed) ---
    class SudokuGenerator {constructor(t=9){this.N=t,this.SRN=Math.sqrt(t),this.mat=Array.from({length:t},()=>Array(t).fill(0)),this.solution=null}fillValues(){if(!this.fillDiagonal())return!1;if(!this.fillRemaining(0,0))return!1;if(this.mat[this.N-1][this.N-1]!==0)return this.solution=this.mat.map(t=>[...t]),!0;return console.error("SudokuGenerator: Grid fill seemed complete, but validation failed."),!1}fillDiagonal(){for(let t=0;t<this.N;t=t+this.SRN)if(!this.fillBox(t,t))return!1;return!0}fillBox(t,e){let o,i=0;const s=this.N*5;let l=Array.from({length:this.N},(t,e)=>e+1);this.shuffleArray(l);let r=0;for(let n=0;n<this.SRN;n++)for(let h=0;h<this.SRN;h++){if(this.mat[t+n][e+h]!==0)continue;let c=!1;for(i=0;r<l.length&&i<s;){if(o=l[r],this.unUsedInBoxStrict(t,e,t+n,e+h,o)){this.mat[t+n][e+h]=o,c=!0,l.splice(r,1),r=0;break}r++,i++}if(!c)return console.error(`SudokuGenerator: Failed to place number in box at [${t+n}, ${e+h}]`),!1}return!0}shuffleArray(t){for(let e=t.length-1;e>0;e--){const o=Math.floor(Math.random()*(e+1));[t[e],t[o]]=[t[o],t[e]]}}randomGenerator(t){return Math.floor(Math.random()*t+1)}checkIfSafe(t,e,o){return this.unUsedInRow(t,o)&&this.unUsedInCol(e,o)&&this.unUsedInBox(t-t%this.SRN,e-e%this.SRN,o)}unUsedInRow(t,e){for(let o=0;o<this.N;o++)if(this.mat[t][o]===e)return!1;return!0}unUsedInCol(t,e){for(let o=0;o<this.N;o++)if(this.mat[o][t]===e)return!1;return!0}unUsedInBox(t,e,o){for(let i=0;i<this.SRN;i++)for(let s=0;s<this.SRN;s++)if(this.mat[t+i]&&typeof this.mat[t+i][e+s]!="undefined"&&this.mat[t+i][e+s]===o)return!1;return!0}unUsedInBoxStrict(t,e,o,i,s){for(let l=0;l<this.SRN;l++)for(let r=0;r<this.SRN;r++){const n=t+l,h=e+r;if((n!==o||h!==i)&&this.mat[n]&&typeof this.mat[n][h]!="undefined"&&this.mat[n][h]===s)return!1}return!0}fillRemaining(t,e){if(e===this.N&&(t++,e=0),t===this.N)return!0;if(this.mat[t][e]!==0)return this.fillRemaining(t,e+1);let o=Array.from({length:this.N},(t,e)=>e+1);this.shuffleArray(o);for(let i=0;i<o.length;i++){let s=o[i];if(this.checkIfSafe(t,e,s)){if(this.mat[t][e]=s,this.fillRemaining(t,e+1))return!0;this.mat[t][e]=0}}return!1}removeKDigits(t){let e=t,o=0;const i=this.N*this.N*3;if(!this.solution)return void console.error("SudokuGenerator: Cannot remove digits, solution not generated.");for(this.mat=this.solution.map(t=>[...t]);e>0&&o<i;){o++;let t=this.randomGenerator(this.N*this.N)-1,s=Math.floor(t/this.N),l=t%this.N;if(this.mat[s]&&this.mat[s][l]!==0){let t=this.mat[s][l];this.mat[s][l]=0;let r=this.mat.map(t=>[...t]),n=0;for(let t=1;t<=this.N;t++)this.isSafeForPuzzleGen(r,s,l,t)&&n++;n>1?this.mat[s][l]=t:e--}}if(e>0&&console.warn(`SudokuGenerator: Could not remove all ${t} digits. ${e} remaining.`),this.mat&&this.mat[0]&&this.mat[0][0]===0){t:for(let t=0;t<this.N;t++)for(let e=0;e<this.N;e++)if(this.mat[t]&&this.mat[t][e]!==0){this.mat[0][0]=this.mat[t][e],this.mat[t][e]=0;break t}}}isSafeForPuzzleGen(t,e,o,i){if(!t[e])return!1;for(let s=0;s<this.N;s++)if(t[e][s]===i)return!1;for(let s=0;s<this.N;s++)if(t[s]&&t[s][o]===i)return!1;const s=e-e%this.SRN,l=o-o%this.SRN;for(let e=0;e<this.SRN;e++)for(let o=0;o<this.SRN;o++)if(t[s+e]&&typeof t[s+e][l+o]!="undefined"&&t[s+e][l+o]===i)return!1;return!0}generate(t){this.mat=Array.from({length:N},()=>Array(N).fill(0)),this.solution=null;let e=!1,o=0;const i=5;for(;!e&&o<i;)o++,console.log(`Generation attempt ${o}...`),this.mat=Array.from({length:N},()=>Array(N).fill(0)),e=this.fillValues();if(!e||!this.solution)return console.error(`SudokuGenerator: Failed to generate a valid solution after ${o} attempts.`),null;const s=this.N*this.N-(K_MAP[t]||K_MAP.normal);return this.removeKDigits(s),{puzzle:this.mat,solution:this.solution}}}

    // --- Timer Functions ---
    function formatTime(seconds) { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`; }
    function updateTimerDisplay() { if (!timerElement) return; elapsedTime = Math.floor((Date.now() - startTime) / 1000); timerElement.textContent = formatTime(elapsedTime); }
    function startTimer() { if (timerInterval) clearInterval(timerInterval); startTime = Date.now(); elapsedTime = 0; if (timerElement) timerElement.textContent = formatTime(0); timerInterval = setInterval(updateTimerDisplay, 1000); console.log("Timer started"); }
    function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; console.log("Timer stopped"); } }

    // --- Undo Function ---
    function handleUndo() {
        if (moveHistory.length === 0) { if (messageArea) messageArea.textContent = "Nothing to undo."; return; }
        const lastMove = moveHistory.pop();
        console.log("Undoing move:", lastMove);
        const tile = tileElements[lastMove.index];
        if (tile && currentBoard[lastMove.row]) {
            currentBoard[lastMove.row][lastMove.col] = lastMove.prevValue;
            const span = tile.querySelector('span');
            if (span) span.textContent = lastMove.prevValue === 0 ? '' : lastMove.prevValue;
            tile.classList.remove('error-cell', 'hint-reveal');
            validateAndHighlightErrors();
            clearSelectionAndHighlight();
            selectedTile = null;
            if (messageArea) messageArea.textContent = "Last move undone.";
        } else { console.error("Undo: Could not find tile or board row for move", lastMove); }
    }

    // --- Hint Functions ---
    function isPossible(board, r, c, num) { /* ... unchanged ... */
        for (let x = 0; x < N; x++) { if (board[r][x] === num) return false; }
        for (let x = 0; x < N; x++) { if (board[x][c] === num) return false; }
        const startRow = r - (r % SQRT_N); const startCol = c - (c % SQRT_N);
        for (let i = 0; i < SQRT_N; i++) { for (let j = 0; j < SQRT_N; j++) { if (board[startRow + i][startCol + j] === num) return false; } }
        return true;
    }
    function findHint() { /* ... unchanged ... */
        for (let r = 0; r < N; r++) { for (let c = 0; c < N; c++) { if (currentBoard[r][c] === 0) { const tile = tileElements[r * N + c]; if (tile && !tile.classList.contains('fixed-cell')) { let possibleNumbers = []; for (let num = 1; num <= N; num++) { if (isPossible(currentBoard, r, c, num)) { possibleNumbers.push(num); } } if (possibleNumbers.length === 1) { console.log(`Hint found for [${r},${c}]: ${possibleNumbers[0]}`); return { row: r, col: c, value: possibleNumbers[0] }; } } } } } console.log("No obvious hint found."); return null;
    }
    function updateHintButtonDisplay() { /* ... unchanged ... */
        if (!hintButton || !hintCountElement) return; hintCountElement.textContent = hintsRemaining; hintButton.title = `Get a Hint (${hintsRemaining} left)`; if (hintsRemaining <= 0) { hintCountElement.style.display = 'none'; hintButton.disabled = true; hintButton.classList.add('opacity-50', 'cursor-not-allowed'); hintButton.classList.remove('hover:bg-yellow-600'); } else { hintCountElement.style.display = 'flex'; hintButton.disabled = false; hintButton.classList.remove('opacity-50', 'cursor-not-allowed'); hintButton.classList.add('hover:bg-yellow-600'); }
    }
    function handleHint() { /* ... unchanged ... */
        if (hintsRemaining <= 0) { if (messageArea) messageArea.textContent = "No hints remaining!"; console.log("Hint requested but none remaining."); return; } if (!validateAndHighlightErrors()) { if (messageArea) messageArea.textContent = "Please fix errors before getting a hint."; return; } const hint = findHint(); if (hint === null) { if (messageArea) messageArea.textContent = "No obvious hint available."; return; } const { row, col, value } = hint; const tile = tileElements[row * N + col]; if (tile && currentBoard[row]) { hintsRemaining--; const previousValue = currentBoard[row][col]; moveHistory.push({ index: row * N + col, row: row, col: col, prevValue: previousValue, newValue: value, isHint: true }); console.log("Hint recorded:", moveHistory[moveHistory.length - 1]); currentBoard[row][col] = value; const span = tile.querySelector('span'); if (span) span.textContent = value; tile.classList.add('hint-reveal'); setTimeout(() => { tile.classList.remove('hint-reveal'); }, 800); validateAndHighlightErrors(); updateHintButtonDisplay(); if (isBoardFull() && isBoardValid()) { stopTimer(); showWinMessage(); } if (messageArea) messageArea.textContent = `Hint applied for cell (${row + 1}, ${col + 1}).`; } else { console.error("Hint: Could not find tile or board row for hint", hint); }
    }

    // --- UI Functions ---
    function createGrid() { /* ... unchanged ... */
        if (!boardContainer) return; boardContainer.innerHTML = ''; tileElements = []; const board = document.createElement('div'); board.id = 'sudoku-board'; for (let sr = 0; sr < SQRT_N; sr++) { for (let sc = 0; sc < SQRT_N; sc++) { const section = document.createElement('div'); section.classList.add('sudoku-section'); for (let tr = 0; tr < SQRT_N; tr++) { for (let tc = 0; tc < SQRT_N; tc++) { const tile = document.createElement('div'); tile.classList.add('sudoku-tile'); const r = sr * SQRT_N + tr; const c = sc * SQRT_N + tc; const i = r * N + c; tile.dataset.index = i; tile.dataset.row = r; tile.dataset.col = c; tile.dataset.sectionRow = sr; tile.dataset.sectionCol = sc; const span = document.createElement('span'); tile.appendChild(span); tile.addEventListener('click', handleTileClick); section.appendChild(tile); tileElements[i] = tile; } } board.appendChild(section); } } boardContainer.appendChild(board); console.log("Nested grid created", tileElements.length, "tiles.");
     }
    function populateGrid(puzzle) { /* ... unchanged ... */
        console.log("Populating grid tiles..."); if (!puzzle || tileElements.length !== N * N) return; let cellsPopulated = 0; for (let i = 0; i < N * N; i++) { const tile = tileElements[i]; if (!tile) continue; const span = tile.querySelector('span'); if (!span) continue; const row = parseInt(tile.dataset.row); const col = parseInt(tile.dataset.col); if (isNaN(row) || isNaN(col) || !puzzle[row] || typeof puzzle[row][col] === 'undefined') continue; const value = puzzle[row][col]; span.textContent = value === 0 ? '' : value; if (value !== 0) cellsPopulated++; tile.classList.remove('fixed-cell', 'error-cell', 'selected-cell', 'highlighted-cell', 'same-number-highlight'); if (value !== 0) tile.classList.add('fixed-cell'); else tile.classList.remove('fixed-cell'); } console.log(`Finished populating grid. ${cellsPopulated} tiles filled.`);
     }
    function handleTileClick(event) { /* ... unchanged ... */
        const clickedTileElement = event.currentTarget; if (!clickedTileElement || !clickedTileElement.dataset) return; const index = parseInt(clickedTileElement.dataset.index); const row = parseInt(clickedTileElement.dataset.row); const col = parseInt(clickedTileElement.dataset.col); if (isNaN(index) || isNaN(row) || isNaN(col)) return; if (selectedTile && selectedTile.element === clickedTileElement) { clearSelectionAndHighlight(); selectedTile = null; } else { clearSelectionAndHighlight(); selectedTile = { row, col, element: clickedTileElement }; clickedTileElement.classList.add('selected-cell'); highlightRelatedCells(row, col); highlightSameNumbers(clickedTileElement); }
     }
    function highlightRelatedCells(row, col) { /* ... unchanged ... */
        if (tileElements.length !== N * N) return; const sectionRow = Math.floor(row / SQRT_N); const sectionCol = Math.floor(col / SQRT_N); for(let i = 0; i < N * N; i++) { const tile = tileElements[i]; if (!tile || !tile.dataset) continue; const r = parseInt(tile.dataset.row); const c = parseInt(tile.dataset.col); const sr = parseInt(tile.dataset.sectionRow); const sc = parseInt(tile.dataset.sectionCol); if (r === row || c === col || (sr === sectionRow && sc === sectionCol)) { tile.classList.add('highlighted-cell'); } } if(selectedTile && selectedTile.element) { selectedTile.element.classList.add('selected-cell'); }
     }
    function highlightSameNumbers(selectedElement) { /* ... unchanged ... */
        if (!selectedElement || !selectedElement.querySelector) return; const numberSpan = selectedElement.querySelector('span'); if (!numberSpan) return; const number = numberSpan.textContent; if (!number || tileElements.length !== N * N) return; for (let i = 0; i < N * N; i++) { const currentTile = tileElements[i]; if (!currentTile) continue; const currentSpan = currentTile.querySelector('span'); if (currentSpan && currentSpan.textContent === number) { currentTile.classList.add('same-number-highlight'); } } if (selectedTile && selectedTile.element === selectedElement) { selectedElement.classList.add('selected-cell'); }
     }
    function clearSelectionAndHighlight() { /* ... unchanged ... */
        if (tileElements.length !== N * N) return; for (let i = 0; i < N * N; i++) { if (tileElements[i]) { tileElements[i].classList.remove('selected-cell', 'highlighted-cell', 'same-number-highlight'); } }
     }
    function handleNumberInput(event) { /* ... unchanged ... */
        if (!selectedTile || !selectedTile.element || selectedTile.element.classList.contains('fixed-cell')) return; const number = parseInt(event.target.dataset.number); if (isNaN(number)) return; const { row, col, element } = selectedTile; const span = element.querySelector('span'); if (!span || !currentBoard[row]) return; const previousValue = currentBoard[row][col]; if (previousValue === number) return; moveHistory.push({ index: row * N + col, row: row, col: col, prevValue: previousValue, newValue: number, isHint: false }); console.log("Move recorded:", moveHistory[moveHistory.length-1]); currentBoard[row][col] = number; span.textContent = number; validateAndHighlightErrors(); highlightSameNumbers(element); if (isBoardFull() && isBoardValid()) { stopTimer(); showWinMessage(); }
     }
    function handleErase() { /* ... unchanged ... */
         if (!selectedTile || !selectedTile.element || selectedTile.element.classList.contains('fixed-cell')) return; const { row, col, element } = selectedTile; const span = element.querySelector('span'); if (!span || !currentBoard[row]) return; const previousValue = currentBoard[row][col]; if (previousValue === 0) return; moveHistory.push({ index: row * N + col, row: row, col: col, prevValue: previousValue, newValue: 0, isHint: false }); console.log("Erase recorded:", moveHistory[moveHistory.length-1]); currentBoard[row][col] = 0; span.textContent = ''; element.classList.remove('error-cell'); validateAndHighlightErrors(); clearSelectionAndHighlight(); element.classList.add('selected-cell'); highlightRelatedCells(row, col);
     }

    // --- Validation Functions ---
    function isValid(board,row,col,num){if(!board[row])return!1;for(let t=0;t<N;t++)if(t!==col&&board[row][t]===num)return!1;for(let t=0;t<N;t++)if(t!==row&&board[t]&&board[t][col]===num)return!1;const t=row-row%SQRT_N,e=col-col%SQRT_N;for(let o=0;o<SQRT_N;o++)for(let i=0;i<SQRT_N;i++){const s=t+o,l=e+i;if(board[s]&&(s!==row||l!==col)&&board[s][l]===num)return!1}return!0}
    function isBoardFull(){if(!currentBoard||currentBoard.length!==N)return!1;for(let t=0;t<N;t++){if(!currentBoard[t]||currentBoard[t].length!==N)return!1;for(let e=0;e<N;e++)if(currentBoard[t][e]===0)return!1}return!0}
    function isBoardValid(){if(!currentBoard||currentBoard.length!==N)return!1;for(let t=0;t<N;t++){if(!currentBoard[t]||currentBoard[t].length!==N)return!1;for(let e=0;e<N;e++){const o=currentBoard[t][e];if(o!==0&&!isValid(currentBoard,t,e,o))return!1}}return!0}
    function validateAndHighlightErrors() { /* ... unchanged ... */
         if (tileElements.length !== N * N) return false; let hasErrors = false; for (let i = 0; i < N * N; i++) { if (tileElements[i]) tileElements[i].classList.remove('error-cell'); } for (let r = 0; r < N; r++) { for (let c = 0; c < N; c++) { if (!currentBoard[r]) continue; const num = currentBoard[r][c]; const tileIndex = r * N + c; const tileElement = tileElements[tileIndex]; if (num !== 0 && tileElement && !tileElement.classList.contains('fixed-cell')) { if (!isValid(currentBoard, r, c, num)) { tileElement.classList.add('error-cell'); hasErrors = true; } } } } if (messageArea) { messageArea.textContent = hasErrors ? "Conflicts detected in the grid." : ""; messageArea.style.color = hasErrors ? 'orange' : ''; } return !hasErrors;
     }

    // --- Game Flow Functions ---
    function updateDifficultyDisplay() {
        if (!difficultyDisplayElement) return;
        const difficultyText = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
        difficultyDisplayElement.textContent = difficultyText;

        // Remove previous color class before adding new one
        difficultyDisplayElement.classList.remove(currentDifficultyColorClass);
        // Get and add new color class
        const colorClass = DIFFICULTY_TEXT_COLORS[currentDifficulty] || 'text-gray-800';
        difficultyDisplayElement.classList.add(colorClass);
        // Store the currently applied class so it can be removed next time
        currentDifficultyColorClass = colorClass;
    }

    function startNewGame(difficulty) { /* ... unchanged ... */
        if (messageArea) { messageArea.textContent = `Generating ${difficulty} puzzle... Please wait.`; messageArea.style.color = ''; } currentDifficulty = difficulty; selectedTile = null; stopTimer(); moveHistory = []; console.log("Move history cleared."); hintsRemaining = MAX_HINTS; updateHintButtonDisplay(); updateDifficultyDisplay(); clearSelectionAndHighlight(); setTimeout(() => { try { console.log("Attempting to generate puzzle..."); const generator = new SudokuGenerator(N); const generatedData = generator.generate(difficulty); if (!generatedData || !generatedData.puzzle || !generatedData.solution) throw new Error("Puzzle generation failed."); console.log("Puzzle generated."); currentBoard = generatedData.puzzle.map(row => [...row]); solutionBoard = generatedData.solution; createGrid(); if (tileElements.length === N * N) { console.log("Grid created. Populating grid..."); populateGrid(currentBoard); console.log("Grid populated. Game ready."); if (messageArea) messageArea.textContent = `New ${difficulty} game started! Select a tile.`; startTimer(); } else { throw new Error("Grid creation failed."); } } catch (error) { console.error("Error starting new game:", error); if (messageArea) { messageArea.textContent = `Error starting game: ${error.message}. Please try refreshing.`; messageArea.style.color = 'red'; } if (boardContainer) boardContainer.innerHTML = '<p class="text-red-600 p-4 text-center">Failed to load game board.<br>Please try refreshing the page.</p>'; } }, 50);
     }

     function showWinMessage() { /* ... unchanged ... */
         if (messageBox && messageBoxText) { messageBoxText.textContent = `Congratulations! You solved it in ${formatTime(elapsedTime)}!`; messageBox.style.display = 'block'; } else { alert(`Congratulations! You solved it in ${formatTime(elapsedTime)}!`); }
     }

     if (messageBoxClose) { /* ... unchanged ... */
        messageBoxClose.addEventListener('click', () => { if (messageBox) messageBox.style.display = 'none'; });
     }

    // --- Event Listeners Setup ---
    if (difficultyButtons) { /* ... unchanged ... */
        difficultyButtons.forEach(button => { button.addEventListener('click', (e) => { if (e.target.dataset.difficulty) { startNewGame(e.target.dataset.difficulty); } }); });
     }
    if (numberPalette) { /* ... unchanged ... */
        numberPalette.addEventListener('click', (e) => { if (e.target.classList.contains('number-button') && e.target.dataset.number) { handleNumberInput(e); } });
     }
    if (eraseButton) { /* ... unchanged ... */
        eraseButton.addEventListener('click', handleErase);
     }
    if (undoButton) { /* ... unchanged ... */
        undoButton.addEventListener('click', handleUndo);
     } else { console.error("Undo button not found."); }
    if (hintButton) { /* ... unchanged ... */
        hintButton.addEventListener('click', handleHint);
    } else { console.error("Hint button not found."); }

    document.addEventListener('keydown', (e) => { /* ... unchanged ... */
        if (!selectedTile || !selectedTile.element || selectedTile.element.classList.contains('fixed-cell')) return; const key = parseInt(e.key); if (!isNaN(key) && key >= 1 && key <= 9) { const button = numberPalette ? numberPalette.querySelector(`.number-button[data-number="${key}"]`) : null; if (button) { e.preventDefault(); handleNumberInput({ target: button }); } } else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); handleErase(); } else if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
     });

    // --- Initialisation ---
    document.addEventListener('DOMContentLoaded', () => { /* ... unchanged ... */
         if (!boardContainer || !messageArea || !timerElement || !undoButton || !hintButton || !hintCountElement || !difficultyDisplayElement) { // Check difficulty display too
             console.error("Essential DOM elements not found. Cannot start game.");
             // Error display as before...
             return;
         }
         console.log("DOM fully loaded. Starting initial game.");
         startNewGame(currentDifficulty);
         updateDifficultyDisplay(); // Set initial display
    });
    