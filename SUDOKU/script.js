(function() {
    'use strict';

    const CONSTANTS = {
        STORAGE_KEY_PREFIX: 'sudokuMultiBoard_en_v1_',
        BOARD_SIZE: 9,
        BOX_SIZE: 3,
        DIFFICULTY_LEVELS: { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' },
        BOARD_COUNTS: { easy: 1, medium: 2, hard: 4 },
        DIFFICULTY_CELLS_TO_REMOVE: { easy: 38, medium: 46, hard: 54 },
        DIFFICULTY_HINTS_COUNT: { easy: 3, medium: 5, hard: 8 },
        
        CSS_CLASSES: {
            INVALID_MOVE: 'invalid-move', CORRECT_FLASH: 'correct-flash', INCORRECT_FLASH: 'incorrect-flash',
            FILLED_CELL: 'filled', CELL: 'cell', BOARD: 'sudoku-board',
            MEDIUM_WRAPPER: 'medium-wrapper', HARD_WRAPPER: 'hard-wrapper', OUTER_BORDER: 'has-outer-border',
            LOADING_INDICATOR: 'loading-indicator', 
            TOAST_NOTIFICATION: 'toast-notification',
            TOAST_SHOW: 'show',
            TOAST_SUCCESS: 'success', TOAST_ERROR: 'error', TOAST_INFO: 'info', TOAST_WARNING: 'warning'
        },
        
        DATA_ATTRIBUTES: {
            BOARD_INDEX: 'data-board-index', ROW: 'data-row', COLUMN: 'data-column', CELL_ID: 'data-cell-id'
        },
        
        DOM_IDS: {
            GAME_AREA: 'game-area', RESET_BUTTON: 'reset-button', CHECK_BUTTON: 'check-button',
            HINT_BUTTON: 'hint-button', HINT_COUNTER: 'hint-counter', DIFFICULTY_RADIOS_NAME: 'difficulty',
            TIMER_SPAN: 'timer', START_TIMER_BUTTON: 'start-timer-button'
        },
        
        TIMING: { // Zamanlama sabitleri
            FLASH_ANIMATION_DURATION: 2000, // ms cinsinden (CSS ile senkronize)
            CHECK_ANSWER_FEEDBACK_DELAY: 300, // ms
            TOAST_DURATION: 3000 // ms
        },
        
        ERROR_MESSAGES: {
            CRITICAL_HTML_MISSING: "Critical Error: Required HTML elements not found!",
            GENERAL_CREATION_ERROR: "An error occurred while creating the game",
            SOLUTION_GENERATION_FAILED: "Sudoku solution could not be generated",
            PUZZLE_CREATION_INVALID_SOLUTION: "createPuzzle function received an invalid solution.",
            HINT_GENERATION_FAILED: "Error: Hint Could Not Be Generated",
            UNIQUE_HINT_NOT_FOUND: "Unique hint could not be found",
            SAVE_ERROR: "Error saving game state:", LOAD_ERROR: "Error loading game state:",
            DELETE_ERROR: "Error deleting game state record:",
            CORRUPT_SAVE_DATA: "Game state data in LocalStorage is corrupt or invalid. Record is being deleted.",
            INCONSISTENT_STATE: "Game state data to be saved is inconsistent, save operation cancelled.",
            DATA_NOT_FOUND: "data not found for.", INVALID_ID: "Invalid board or cell location ID",
            NO_EMPTY_CELLS_FOR_HINT: "Congratulations, no empty cells left to fill!"
        }
    };

    const STORAGE_KEY = CONSTANTS.STORAGE_KEY_PREFIX + 'gameState';
    
    class SudokuUtils { //Sudoku yardımcı fonksiyonları için bir sınıf. Çoğunlukla statik metotlar içerir
        static shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        static parseCellId(cellId) {
            if (!cellId || typeof cellId !== 'string') return null;
            const parts = cellId.split('-');
            if (parts.length !== 3) return null;
            const [boardIndex, row, column] = parts.map(Number);
            if (isNaN(boardIndex) || isNaN(row) || isNaN(column)) return null;
            return { boardIndex, row, column };
        }
        static isValidMove(grid, row, column, number) {
            const { BOARD_SIZE, BOX_SIZE } = CONSTANTS;
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (x !== column && grid[row][x] === number) return false;
                if (x !== row && grid[x][column] === number) return false;
            }
            const startRow = row - (row % BOX_SIZE);
            const startColumn = column - (column % BOX_SIZE);
            for (let i = 0; i < BOX_SIZE; i++) {
                for (let j = 0; j < BOX_SIZE; j++) {
                    const rCheck = startRow + i;
                    const cCheck = startColumn + j;
                    if ((rCheck !== row || cCheck !== column) && grid[rCheck][cCheck] === number) {
                        return false;
                    }
                }
            }
            return true;
        }
        static fillSudokuGrid(grid) {
            const { BOARD_SIZE } = CONSTANTS;
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (grid[i][j] === 0) {
                        const numbers = Array.from({ length: BOARD_SIZE }, (_, k) => k + 1);
                        SudokuUtils.shuffleArray(numbers);
                        for (const number of numbers) {
                            if (SudokuUtils.isValidMove(grid, i, j, number)) {
                                grid[i][j] = number;
                                if (SudokuUtils.fillSudokuGrid(grid)) return true;
                                grid[i][j] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }
        static generateSudokuSolution() {
            const { BOARD_SIZE } = CONSTANTS;
            const grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
            if (SudokuUtils.fillSudokuGrid(grid)) {
                const testGrid = grid.map(row => [...row]);
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        const val = testGrid[r][c];
                        if (val === 0) {
                            console.error("Generated solution has an empty cell (final check)!");
                            return null;
                        }
                        testGrid[r][c] = 0;
                        if (!SudokuUtils.isValidMove(testGrid, r, c, val)) {
                            console.error(`Generated solution is invalid (final check): Row ${r + 1}, Col ${c + 1} = ${val}`);
                            return null;
                        }
                        testGrid[r][c] = val;
                    }
                }
                return grid;
            } else {
                console.error(CONSTANTS.ERROR_MESSAGES.SOLUTION_GENERATION_FAILED);
                return null;
            }
        }
        static createPuzzle(solution, cellsToRemove) {
            const { BOARD_SIZE } = CONSTANTS;
            if (!solution || !Array.isArray(solution) || solution.length !== BOARD_SIZE || !solution.every(r => Array.isArray(r) && r.length === BOARD_SIZE)) {
                throw new Error(CONSTANTS.ERROR_MESSAGES.PUZZLE_CREATION_INVALID_SOLUTION);
            }
            const puzzle = solution.map(r => [...r]);
            let removedCount = 0;
            const cellCoordinates = [];
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    cellCoordinates.push([i, j]);
                }
            }
            SudokuUtils.shuffleArray(cellCoordinates);
            let coordIndex = 0;
            while (removedCount < cellsToRemove && coordIndex < cellCoordinates.length) {
                const [r, c] = cellCoordinates[coordIndex];
                if (puzzle[r][c] !== 0) {
                    puzzle[r][c] = 0;
                    removedCount++;
                }
                coordIndex++;
            }
            if (removedCount < cellsToRemove) {
                console.warn(`Targeted ${cellsToRemove} cells to remove, but only ${removedCount} cells were removed.`);
            }
            return puzzle;
        }
    }
    
    
    class HintManager { // İpucu üretimi ve yönetimi ile ilgili fonksiyonları içeren sınıf.
        constructor(gameState) { this.gameState = gameState; }
        formatEquation(a, b, c) {
            const terms = [];
            if (a !== 0) {
                if (a === 1) terms.push('x²');
                else if (a === -1) terms.push('-x²');
                else terms.push(`${a}x²`);
            }
            if (b !== 0) {
                const sign = (terms.length > 0 && b > 0) ? '+ ' : (b < 0) ? '- ' : '';
                const absB = Math.abs(b);
                const bTerm = (absB === 1) ? 'x' : `${absB}x`;
                terms.push(`${sign}${bTerm}`);
            }
            if (c !== 0) {
                const sign = (terms.length > 0 && c > 0) ? '+ ' : (c < 0) ? '- ' : '';
                terms.push(`${sign}${Math.abs(c)}`);
            }
            if (terms.length === 0) return "0 = 0";
            let equation = terms.join(' ').trim();
            if (equation.startsWith('+ ')) {
                equation = equation.substring(2).trim();
            }
            equation = equation.replace(/- \x78/g, '-x');
            return `${equation} = 0`;
        }
        generateQuadraticEquationHint(correctNumber) {
            let a, b, c;
            let root1 = correctNumber;
            let root2;
            const maxAttempts = 25;
            let attempts = 0;
            let found = false;
            const possibleAs = [1, -1, 2, -2];
            let possibleRoot2s = Array.from({ length: 19 }, (_, i) => i - 9).filter(val => val !== 0 && val !== root1);
            while (attempts < maxAttempts && !found) {
                attempts++;
                a = possibleAs[Math.floor(Math.random() * possibleAs.length)];
                if (possibleRoot2s.length > 0) {
                    SudokuUtils.shuffleArray(possibleRoot2s);
                    root2 = possibleRoot2s[0];
                } else {
                    do { root2 = Math.floor(Math.random() * 19) - 9; }
                    while (root2 === root1 || root2 === 0);
                }
                b = -a * (root1 + root2);
                c = a * root1 * root2;
                if (Math.abs(b) <= 100 && Math.abs(c) <= 100 && (a !== 0 || b !== 0 || c !== 0)) {
                    let positiveRootCountInSudokuRange = 0;
                    for (let xTest = 1; xTest <= 9; xTest++) {
                        if (Math.abs(a * xTest * xTest + b * xTest + c) < 0.001) {
                            positiveRootCountInSudokuRange++;
                        }
                    }
                    if (positiveRootCountInSudokuRange === 1 && Math.abs(a * root1 * root1 + b * root1 + c) < 0.001) {
                        found = true;
                    }
                }
            }
            if (!found) { a = 0; b = 1; c = -correctNumber; }
            return this.formatEquation(a, b, c);
        }
        generateUniqueHint(correctNumber, maxRetryAttempts = 20) {
            let hint = null;
            let attempts = 0;
            do {
                attempts++;
                hint = this.generateQuadraticEquationHint(correctNumber);
                if (hint && hint !== "0 = 0" && !this.gameState.usedEquations.has(hint)) {
                    this.gameState.usedEquations.add(hint);
                    return hint;
                }
            } while (attempts < maxRetryAttempts);
            console.warn(`${CONSTANTS.ERROR_MESSAGES.UNIQUE_HINT_NOT_FOUND} (Number: ${correctNumber}, ${maxRetryAttempts} attempts made).`);
            if (hint && hint !== "0 = 0") {
                if (!this.gameState.usedEquations.has(hint)) this.gameState.usedEquations.add(hint);
                return hint;
            } else {
                const simpleHint = this.formatEquation(0, 1, -correctNumber);
                if (!this.gameState.usedEquations.has(simpleHint)) this.gameState.usedEquations.add(simpleHint);
                return simpleHint;
            }
        }
    }

    class Timer { // Oyun zamanlayıcısı fonksiyonlarını içeren sınıf.
        constructor(timerSpanElement, startTimerButtonElement, gameState) {
            this.timerSpan = timerSpanElement;
            this.startTimerButton = startTimerButtonElement;
            this.gameState = gameState;
            this.timerIntervalId = null;
        }
        updateDisplay() {
            if (!this.timerSpan) return;
            const hours = Math.floor(this.gameState.elapsedTimeSeconds / 3600);
            const minutes = Math.floor((this.gameState.elapsedTimeSeconds % 3600) / 60);
            const seconds = this.gameState.elapsedTimeSeconds % 60;
            this.timerSpan.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        start() {
            if (this.gameState.timerActive && !this.timerIntervalId) {
                this.timerIntervalId = setInterval(() => {
                    this.gameState.elapsedTimeSeconds++;
                    this.updateDisplay();
                }, 1000);
                if (this.startTimerButton) {
                    this.startTimerButton.disabled = true;
                    this.startTimerButton.textContent = "Timer Running";
                }
            }
        }
        stop() {
            if (this.timerIntervalId) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
            }
        }
        reset() {
            this.stop();
            this.gameState.elapsedTimeSeconds = 0;
            this.gameState.timerActive = false;
            this.updateDisplay();
            if (this.startTimerButton) {
                this.startTimerButton.disabled = false;
                this.startTimerButton.textContent = "Start Timer";
            }
        }
        getIntervalId() { return this.timerIntervalId; }
    }

    class StorageManager { // Oyun durumunun LocalStorage'a kaydedilmesi ve yüklenmesinden sorumludur.
        constructor(storageKey, gameState) {
            this.storageKey = storageKey;
            this.gameState = gameState;
        }
        save() {
            if (!this.gameState.currentPuzzles || !this.gameState.currentSolutions || !this.gameState.initialPuzzles ||
                this.gameState.currentPuzzles.length !== this.gameState.boardCount ||
                this.gameState.currentSolutions.length !== this.gameState.boardCount ||
                this.gameState.initialPuzzles.length !== this.gameState.boardCount) {
                console.warn(CONSTANTS.ERROR_MESSAGES.INCONSISTENT_STATE);
                return;
            }
            try {
                const stateToSave = {
                    boardCount: this.gameState.boardCount, puzzles: this.gameState.currentPuzzles,
                    initialPuzzles: this.gameState.initialPuzzles, solutions: this.gameState.currentSolutions,
                    hints: this.gameState.cellHints, remainingHints: this.gameState.remainingHints,
                    usedEquationsList: Array.from(this.gameState.usedEquations),
                    elapsedTimeSeconds: this.gameState.elapsedTimeSeconds, timerActive: this.gameState.timerActive
                };
                localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
            } catch (e) { console.error(CONSTANTS.ERROR_MESSAGES.SAVE_ERROR, e); }
        }
        load() {
            const jsonData = localStorage.getItem(this.storageKey);
            if (!jsonData) return null;
            try {
                const loaded = JSON.parse(jsonData);
                const { BOARD_SIZE } = CONSTANTS;
                const isValidGridArray = (arr, expectedLength) =>
                    Array.isArray(arr) && arr.length === expectedLength &&
                    arr.every(p => Array.isArray(p) && p.length === BOARD_SIZE &&
                                  p.every(r => Array.isArray(r) && r.length === BOARD_SIZE &&
                                            r.every(cell => typeof cell === 'number')));
                if (loaded && typeof loaded === 'object' &&
                    typeof loaded.boardCount === 'number' && loaded.boardCount > 0 &&
                    isValidGridArray(loaded.puzzles, loaded.boardCount) &&
                    isValidGridArray(loaded.initialPuzzles, loaded.boardCount) &&
                    isValidGridArray(loaded.solutions, loaded.boardCount) &&
                    typeof loaded.hints === 'object' && loaded.hints !== null &&
                    typeof loaded.remainingHints === 'number' && loaded.remainingHints >= 0 &&
                    Array.isArray(loaded.usedEquationsList) &&
                    typeof loaded.elapsedTimeSeconds === 'number' &&
                    typeof loaded.timerActive === 'boolean') {
                    console.log("Valid saved game state found and loaded.");
                    Object.assign(this.gameState, {
                        ...loaded,
                        usedEquations: new Set(loaded.usedEquationsList)
                    });
                    return true;
                } else {
                    console.warn(CONSTANTS.ERROR_MESSAGES.CORRUPT_SAVE_DATA);
                    this.clear(); return null;
                }
            } catch (e) {
                console.error(CONSTANTS.ERROR_MESSAGES.LOAD_ERROR, e);
                this.clear(); return null;
            }
        }
        clear() {
            try { localStorage.removeItem(this.storageKey); console.log("Game state record in LocalStorage deleted."); }
            catch (e) { console.error(CONSTANTS.ERROR_MESSAGES.DELETE_ERROR, e); }
        }
    }

    class UIManager { // DOM manipülasyonu ve UI güncellemelerinden sorumludur.
        constructor(domElements, gameState, hintManager) {
            this.dom = domElements;
            this.gameState = gameState;
            this.hintManager = hintManager;
            this.gameInstance = null;
            this.activeToastTimeout = null;
            document.documentElement.style.setProperty('--flash-duration', `${CONSTANTS.TIMING.FLASH_ANIMATION_DURATION / 1000}s`);

        }
        setGameInstance(instance) { this.gameInstance = instance; }

        showToast(message, type = CONSTANTS.CSS_CLASSES.TOAST_INFO) {
            if (this.activeToastTimeout) {
                clearTimeout(this.activeToastTimeout);
                const existingToast = document.querySelector(`.${CONSTANTS.CSS_CLASSES.TOAST_NOTIFICATION}`);
                if (existingToast) existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `${CONSTANTS.CSS_CLASSES.TOAST_NOTIFICATION} ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                 setTimeout(() => toast.classList.add(CONSTANTS.CSS_CLASSES.TOAST_SHOW), 10);
            });


            this.activeToastTimeout = setTimeout(() => {
                toast.classList.remove(CONSTANTS.CSS_CLASSES.TOAST_SHOW);
                toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                this.activeToastTimeout = null;
            }, CONSTANTS.TIMING.TOAST_DURATION);
        }

        showLoadingIndicator() {
            if (!this.dom.gameArea) return;
            this.hideLoadingIndicator();
            const indicator = document.createElement('div');
            indicator.className = CONSTANTS.CSS_CLASSES.LOADING_INDICATOR;
            indicator.textContent = 'Loading...';
            this.dom.gameArea.appendChild(indicator);
        }

        hideLoadingIndicator() {
            if (!this.dom.gameArea) return;
            const indicator = this.dom.gameArea.querySelector(`.${CONSTANTS.CSS_CLASSES.LOADING_INDICATOR}`);
            if (indicator) indicator.remove();
        }


        initialHtmlCheck() {
            const { DOM_IDS, ERROR_MESSAGES } = CONSTANTS;
            const requiredElements = {
                gameArea: DOM_IDS.GAME_AREA, resetButton: DOM_IDS.RESET_BUTTON, checkButton: DOM_IDS.CHECK_BUTTON,
                hintButton: DOM_IDS.HINT_BUTTON, hintCounterSpan: DOM_IDS.HINT_COUNTER, timerSpan: DOM_IDS.TIMER_SPAN,
                startTimerButton: DOM_IDS.START_TIMER_BUTTON
            };
            for (const key in requiredElements) {
                if (!this.dom[key]) {
                    console.error(`${ERROR_MESSAGES.CRITICAL_HTML_MISSING} ID: ${requiredElements[key]}`);
                    return false;
                }
            }
            if (!this.dom.difficultyRadios || this.dom.difficultyRadios.length === 0) {
                console.error(`${ERROR_MESSAGES.CRITICAL_HTML_MISSING} Element: input[name="${DOM_IDS.DIFFICULTY_RADIOS_NAME}"]`);
                return false;
            }
            return true;
        }
        clearBoardDOM() {
            if (this.dom.gameArea) {
                this.dom.gameArea.innerHTML = '';
                this.dom.gameArea.removeAttribute('style');
                this.dom.gameArea.className = '';
            }
        }
        updateHintDisplay() {
            if (this.dom.hintCounterSpan) this.dom.hintCounterSpan.textContent = `Hints: ${this.gameState.remainingHints}`;
            if (this.dom.hintButton) this.dom.hintButton.disabled = this.gameState.remainingHints <= 0;
        }
        showHintTooltip(event) {
            const input = event.target;
            const id = input.getAttribute(CONSTANTS.DATA_ATTRIBUTES.CELL_ID);
            if (input.value === '' && this.gameState.cellHints[id] && this.gameState.cellHints[id] !== CONSTANTS.ERROR_MESSAGES.HINT_GENERATION_FAILED) {
                input.title = `Hint: ${this.gameState.cellHints[id]}`;
            } else { input.title = ''; }
        }
        hideHintTooltip(event) { event.target.title = ''; }
        clearAllFlashes() {
            if (!this.dom.gameArea) return;
            this.dom.gameArea.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.CELL}`).forEach(cell => {
                cell.classList.remove(CONSTANTS.CSS_CLASSES.CORRECT_FLASH, CONSTANTS.CSS_CLASSES.INCORRECT_FLASH);
            });
        }
        showCellAccuracy(cellElement, status) {
            cellElement.classList.remove(CONSTANTS.CSS_CLASSES.CORRECT_FLASH, CONSTANTS.CSS_CLASSES.INCORRECT_FLASH);
            setTimeout(() => {
                if (status === 'correct') cellElement.classList.add(CONSTANTS.CSS_CLASSES.CORRECT_FLASH);
                else if (status === 'incorrect') cellElement.classList.add(CONSTANTS.CSS_CLASSES.INCORRECT_FLASH);
            }, 10);
        }
        getCellElement(boardIndex, row, column) {
            if (!this.dom.gameArea) return null;
            const board = this.dom.gameArea.querySelector(`.${CONSTANTS.CSS_CLASSES.BOARD}[${CONSTANTS.DATA_ATTRIBUTES.BOARD_INDEX}="${boardIndex}"]`);
            if (!board) return null;
            return board.querySelector(`.${CONSTANTS.CSS_CLASSES.CELL}[${CONSTANTS.DATA_ATTRIBUTES.ROW}="${row}"][${CONSTANTS.DATA_ATTRIBUTES.COLUMN}="${column}"]`);
        }
        updateCellValidityStatus(inputElement) {
            const id = inputElement.getAttribute(CONSTANTS.DATA_ATTRIBUTES.CELL_ID);
            const coordinates = SudokuUtils.parseCellId(id);
            if (!coordinates) return;
            const { boardIndex, row, column } = coordinates;
            const cellElement = inputElement.closest(`.${CONSTANTS.CSS_CLASSES.CELL}`);
            if (!cellElement) return;
            const valueStr = inputElement.value;
            const value = valueStr === '' ? 0 : parseInt(valueStr, 10);
            if (valueStr !== '' && (isNaN(value) || value < 1 || value > 9)) {
                cellElement.classList.add(CONSTANTS.CSS_CLASSES.INVALID_MOVE); return;
            }
            if (value === 0) {
                cellElement.classList.remove(CONSTANTS.CSS_CLASSES.INVALID_MOVE); return;
            }
            const controlBoard = this.gameState.currentPuzzles[boardIndex].map(r => [...r]);
            controlBoard[row][column] = 0;
            if (SudokuUtils.isValidMove(controlBoard, row, column, value)) {
                cellElement.classList.remove(CONSTANTS.CSS_CLASSES.INVALID_MOVE);
            } else { cellElement.classList.add(CONSTANTS.CSS_CLASSES.INVALID_MOVE); }
        }
        createInputCell(id, boardIndex, r, c, currentValue, correctValue) {
            const input = document.createElement('input');
            input.type = 'number'; input.min = '1'; input.max = '9';
            input.setAttribute(CONSTANTS.DATA_ATTRIBUTES.CELL_ID, id);
            input.setAttribute('aria-label', `Board ${boardIndex + 1} Row ${r + 1} Column ${c + 1}`);
            if (currentValue !== 0 && currentValue !== undefined) input.value = currentValue;
            if (this.gameState.cellHints[id] === undefined && correctValue !== undefined && correctValue >= 1 && correctValue <=9) {
                const hint = this.hintManager.generateUniqueHint(correctValue);
                this.gameState.cellHints[id] = hint || CONSTANTS.ERROR_MESSAGES.HINT_GENERATION_FAILED;
                if (!hint) console.error(`Unique hint could not be generated for cell ${id} (Correct Value: ${correctValue})`);
            }
            input.addEventListener('mouseenter', this.showHintTooltip.bind(this));
            input.addEventListener('mouseleave', this.hideHintTooltip.bind(this));
            input.addEventListener('input', (event) => this.gameInstance.handleInput(event));
            input.addEventListener('focus', this.hideHintTooltip.bind(this));
            return input;
        }
        createStaticCell(value) {
            const span = document.createElement('span');
            span.textContent = value;
            return span;
        }
        createCellContent(boardIndex, r, c) {
            const id = `${boardIndex}-${r}-${c}`;
            const initialValue = this.gameState.initialPuzzles[boardIndex]?.[r]?.[c];
            const currentValue = this.gameState.currentPuzzles[boardIndex]?.[r]?.[c];
            const correctValue = this.gameState.currentSolutions[boardIndex]?.[r]?.[c];
            if (initialValue === 0) return this.createInputCell(id, boardIndex, r, c, currentValue, correctValue);
            else return this.createStaticCell(initialValue);
        }
        addBoardCells(boardElement, boardIndex) {
            const { BOARD_SIZE } = CONSTANTS;
            if (!this.gameState.initialPuzzles[boardIndex] || !this.gameState.currentPuzzles[boardIndex] || !this.gameState.currentSolutions[boardIndex]) {
                console.error(`Board ${boardIndex + 1} ${CONSTANTS.ERROR_MESSAGES.DATA_NOT_FOUND}`);
                boardElement.innerHTML = `<p style="color:red;">Board ${boardIndex + 1} data could not be loaded.</p>`;
                return;
            }
            const fragment = document.createDocumentFragment();
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add(CONSTANTS.CSS_CLASSES.CELL);
                    cell.setAttribute(CONSTANTS.DATA_ATTRIBUTES.BOARD_INDEX, String(boardIndex));
                    cell.setAttribute(CONSTANTS.DATA_ATTRIBUTES.ROW, String(r));
                    cell.setAttribute(CONSTANTS.DATA_ATTRIBUTES.COLUMN, String(c));
                    const content = this.createCellContent(boardIndex, r, c);
                    cell.appendChild(content);
                    if (content.tagName !== 'INPUT') cell.classList.add(CONSTANTS.CSS_CLASSES.FILLED_CELL);
                    else if (content.value !== '') this.updateCellValidityStatus(content);
                    fragment.appendChild(cell);
                }
            }
            boardElement.appendChild(fragment);
        }
        drawBoardsOnScreen() {
            this.clearBoardDOM();
            if (this.dom.gameArea) this.dom.gameArea.style.padding = '10px';
            let boardContainer = this.dom.gameArea;
            let wrapperClass = '';
            if (this.gameState.boardCount === CONSTANTS.BOARD_COUNTS.medium) wrapperClass = CONSTANTS.CSS_CLASSES.MEDIUM_WRAPPER;
            else if (this.gameState.boardCount === CONSTANTS.BOARD_COUNTS.hard) wrapperClass = CONSTANTS.CSS_CLASSES.HARD_WRAPPER;
            if (wrapperClass && this.dom.gameArea) {
                const wrapper = document.createElement('div');
                wrapper.classList.add(wrapperClass);
                this.dom.gameArea.appendChild(wrapper);
                boardContainer = wrapper;
            }
            for (let i = 0; i < this.gameState.boardCount; i++) {
                const boardElement = document.createElement('div');
                boardElement.classList.add(CONSTANTS.CSS_CLASSES.BOARD);
                boardElement.setAttribute(CONSTANTS.DATA_ATTRIBUTES.BOARD_INDEX, String(i));
                if (this.gameState.boardCount === CONSTANTS.BOARD_COUNTS.easy) boardElement.classList.add(CONSTANTS.CSS_CLASSES.OUTER_BORDER);
                this.addBoardCells(boardElement, i);
                if (boardContainer) boardContainer.appendChild(boardElement);
            }
        }
    }

    class SudokuGame { // Ana oyun sınıfı. Oyun mantığını, durumunu ve etkileşimlerini yönetir.
        constructor() {
            const { DOM_IDS } = CONSTANTS;
            this.dom = {
                gameArea: document.getElementById(DOM_IDS.GAME_AREA), resetButton: document.getElementById(DOM_IDS.RESET_BUTTON),
                checkButton: document.getElementById(DOM_IDS.CHECK_BUTTON), hintButton: document.getElementById(DOM_IDS.HINT_BUTTON),
                hintCounterSpan: document.getElementById(DOM_IDS.HINT_COUNTER),
                difficultyRadios: document.querySelectorAll(`input[name="${DOM_IDS.DIFFICULTY_RADIOS_NAME}"]`),
                timerSpan: document.getElementById(DOM_IDS.TIMER_SPAN), startTimerButton: document.getElementById(DOM_IDS.START_TIMER_BUTTON),
            };
            this.gameState = {
                boardCount: CONSTANTS.BOARD_COUNTS.easy, currentSolutions: [], currentPuzzles: [], initialPuzzles: [],
                cellHints: {}, remainingHints: CONSTANTS.DIFFICULTY_HINTS_COUNT.easy, usedEquations: new Set(),
                elapsedTimeSeconds: 0, timerActive: false,
            };
            this.timer = new Timer(this.dom.timerSpan, this.dom.startTimerButton, this.gameState);
            this.hintManager = new HintManager(this.gameState);
            this.storageManager = new StorageManager(STORAGE_KEY, this.gameState);
            this.uiManager = new UIManager(this.dom, this.gameState, this.hintManager);
            this.uiManager.setGameInstance(this);
        }
        init() {
            if (!this.uiManager.initialHtmlCheck()) {
                if (this.dom.gameArea) this.dom.gameArea.innerHTML = `<p style="color:red; font-weight:bold;">${CONSTANTS.ERROR_MESSAGES.CRITICAL_HTML_MISSING} Game could not be started. Check HTML structure.</p>`;
                return;
            }
            this.attachEventListeners();
            this.loadOrCreateGame();
        }
        attachEventListeners() {
            if (this.dom.resetButton) this.dom.resetButton.addEventListener('click', () => this.loadOrCreateGame(true));
            if (this.dom.checkButton) this.dom.checkButton.addEventListener('click', this.checkAnswers.bind(this));
            if (this.dom.hintButton) this.dom.hintButton.addEventListener('click', this.getHint.bind(this));
            if (this.dom.startTimerButton) {
                this.dom.startTimerButton.addEventListener('click', () => {
                    if (!this.gameState.timerActive) {
                        this.gameState.timerActive = true;
                        this.timer.start();
                        this.storageManager.save();
                    }
                });
            }
            window.addEventListener('beforeunload', () => { this.storageManager.save(); });
            if (this.dom.difficultyRadios) {
                this.dom.difficultyRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            console.log(`Difficulty level changed to: ${e.target.value}, starting new game...`);
                            this.loadOrCreateGame(true);
                        }
                    });
                });
            }
        }
        isCellInputPlacementValid(boardIndex, row, column, value) {
            const tempBoard = this.gameState.currentPuzzles[boardIndex].map(r => [...r]);
            tempBoard[row][column] = 0;
            return SudokuUtils.isValidMove(tempBoard, row, column, value);
        }
        handleInput(event) {
            const input = event.target;
            const id = input.getAttribute(CONSTANTS.DATA_ATTRIBUTES.CELL_ID);
            const coordinates = SudokuUtils.parseCellId(id);
            if (!coordinates) return;
            const { boardIndex, row, column } = coordinates;
            let valueStr = input.value.replace(/[^1-9]/g, '');
            if (valueStr.length > 1) valueStr = valueStr.charAt(0);
            input.value = valueStr;
            const value = valueStr === '' ? 0 : parseInt(valueStr, 10);
            if (this.gameState.currentPuzzles[boardIndex]?.[row] !== undefined) {
                this.gameState.currentPuzzles[boardIndex][row][column] = value;
                this.uiManager.updateCellValidityStatus(input);
                this.storageManager.save();
            } else { console.error(`${CONSTANTS.ERROR_MESSAGES.INVALID_ID}: ${id}`); }
            this.uiManager.hideHintTooltip(event);
        }

        async createNewGameData() {
            this.uiManager.showLoadingIndicator();
            await new Promise(resolve => setTimeout(resolve, 50));

            this.storageManager.clear();
            let difficulty = CONSTANTS.DIFFICULTY_LEVELS.EASY;
            if (this.dom.difficultyRadios) {
                const selectedRadio = document.querySelector(`input[name="${CONSTANTS.DOM_IDS.DIFFICULTY_RADIOS_NAME}"]:checked`);
                if (selectedRadio) difficulty = selectedRadio.value;
            }

            const boardCount = CONSTANTS.BOARD_COUNTS[difficulty] || CONSTANTS.BOARD_COUNTS.easy;
            const cellsToRemoveCount = CONSTANTS.DIFFICULTY_CELLS_TO_REMOVE[difficulty] || CONSTANTS.DIFFICULTY_CELLS_TO_REMOVE.easy;
            const remainingHints = CONSTANTS.DIFFICULTY_HINTS_COUNT[difficulty] || CONSTANTS.DIFFICULTY_HINTS_COUNT.easy;
            const initialCellCount = (CONSTANTS.BOARD_SIZE * CONSTANTS.BOARD_SIZE) - cellsToRemoveCount;

            console.log(`Creating new game - Difficulty: ${difficulty} (${boardCount} board(s), ~${initialCellCount} initial cells, Hints: ${remainingHints})`);

            const newSolutions = [];
            const newInitialPuzzles = [];
            const newCurrentPuzzles = [];

            try {
                for (let i = 0; i < boardCount; i++) {
                    console.log(`Generating board ${i + 1}...`);
                    const solution = SudokuUtils.generateSudokuSolution();
                    if (!solution) throw new Error(`${CONSTANTS.ERROR_MESSAGES.SOLUTION_GENERATION_FAILED} (Board ${i + 1})`);
                    
                    const initialPuzzle = SudokuUtils.createPuzzle(solution, cellsToRemoveCount);
                    newSolutions.push(solution);
                    newInitialPuzzles.push(initialPuzzle);
                    newCurrentPuzzles.push(initialPuzzle.map(r => [...r]));
                }

                Object.assign(this.gameState, {
                    boardCount: boardCount,
                    currentSolutions: newSolutions,
                    initialPuzzles: newInitialPuzzles,
                    currentPuzzles: newCurrentPuzzles,
                    cellHints: {},
                    remainingHints: remainingHints,
                    usedEquations: new Set(),
                    elapsedTimeSeconds: 0,
                    timerActive: false
                });
                this.timer.reset();

                console.log(`${boardCount} game board data created successfully.`);
                this.uiManager.hideLoadingIndicator();
                return true;

            } catch (error) {
                console.error(`${CONSTANTS.ERROR_MESSAGES.GENERAL_CREATION_ERROR}:`, error);
                this.uiManager.hideLoadingIndicator();
                this.uiManager.showToast(`${CONSTANTS.ERROR_MESSAGES.GENERAL_CREATION_ERROR} (${error.message}). Please try the 'New Game' button again.`, CONSTANTS.CSS_CLASSES.TOAST_ERROR);

                Object.assign(this.gameState, {
                    boardCount: 0, currentSolutions: [], currentPuzzles: [], initialPuzzles: [], cellHints: {},
                    remainingHints: CONSTANTS.DIFFICULTY_HINTS_COUNT.easy, usedEquations: new Set(), timerActive: false
                });
                this.timer.reset();
                return false;
            }
        }

        async loadOrCreateGame(forceNewGame = false) {
            console.log("------------------------------");
            console.log(`Starting game... (Force new game: ${forceNewGame})`);
            let loadSuccessful = false;
            if (!forceNewGame) {
                loadSuccessful = this.storageManager.load();
                if (loadSuccessful) {
                    this.timer.updateDisplay();
                    if (this.dom.startTimerButton) {
                        if (this.gameState.timerActive) this.timer.start();
                        else {
                            this.dom.startTimerButton.disabled = false;
                            this.dom.startTimerButton.textContent = this.gameState.elapsedTimeSeconds > 0 ? "Continue Timer" : "Start Timer";
                        }
                    }
                }
            }
            let gameDataReady = false;
            if (loadSuccessful) {
                if (this.dom.difficultyRadios) {
                    const difficultyKey = Object.keys(CONSTANTS.BOARD_COUNTS).find(k => CONSTANTS.BOARD_COUNTS[k] === this.gameState.boardCount) || CONSTANTS.DIFFICULTY_LEVELS.EASY;
                    const radioToSelect = document.querySelector(`input[name="${CONSTANTS.DOM_IDS.DIFFICULTY_RADIOS_NAME}"][value="${difficultyKey}"]`);
                    if (radioToSelect) radioToSelect.checked = true;
                    else if (this.dom.difficultyRadios.length > 0) (this.dom.difficultyRadios[0]).checked = true;
                }
                gameDataReady = true;
            } else {
                gameDataReady = await this.createNewGameData();
            }
            if (gameDataReady) {
                this.uiManager.drawBoardsOnScreen();
                if (!loadSuccessful) this.storageManager.save();
            }
            this.uiManager.updateHintDisplay();
        }
        checkAnswers() {
            this.uiManager.clearAllFlashes();
            let allBoardsCorrect = true;
            let allCellsFilled = true;
            for (let bIndex = 0; bIndex < this.gameState.boardCount; bIndex++) {
                const { BOARD_SIZE } = CONSTANTS;
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        const cellElement = this.uiManager.getCellElement(bIndex, r, c);
                        if (!cellElement) continue;
                        const input = cellElement.querySelector('input');
                        if (input) {
                            const valueStr = input.value;
                            const correctValue = this.gameState.currentSolutions[bIndex]?.[r]?.[c];
                            if (valueStr === '') {
                                allCellsFilled = false; allBoardsCorrect = false;
                                this.uiManager.showCellAccuracy(cellElement, 'incorrect');
                            } else {
                                const value = parseInt(valueStr, 10);
                                if (isNaN(value) || value !== correctValue) {
                                    allBoardsCorrect = false;
                                    this.uiManager.showCellAccuracy(cellElement, 'incorrect');
                                } else { this.uiManager.showCellAccuracy(cellElement, 'correct'); }
                            }
                        }
                    }
                }
            }
            setTimeout(() => {
                if (allCellsFilled && allBoardsCorrect) {
                    this.timer.stop(); this.gameState.timerActive = false;
                    if (this.dom.startTimerButton) {
                        this.dom.startTimerButton.disabled = true;
                        this.dom.startTimerButton.textContent = "Game Over!";
                    }
                    this.storageManager.save();
                    this.uiManager.showToast(`Congratulations! You've completed all puzzles correctly! Your time: ${this.dom.timerSpan.textContent}`, CONSTANTS.CSS_CLASSES.TOAST_SUCCESS);
                } else if (allCellsFilled && !allBoardsCorrect) {
                    this.uiManager.showToast("All cells are filled but there are some errors. Check the cells marked in red.", CONSTANTS.CSS_CLASSES.TOAST_WARNING);
                } else if (!allCellsFilled) {
                    this.uiManager.showToast("Some cells are empty. Check empty cells marked in red or incorrect entries.", CONSTANTS.CSS_CLASSES.TOAST_INFO);
                }
            }, CONSTANTS.TIMING.CHECK_ANSWER_FEEDBACK_DELAY);
        }
        getHint() {
            if (this.gameState.remainingHints <= 0) {
                 this.uiManager.showToast("No hints remaining.", CONSTANTS.CSS_CLASSES.TOAST_WARNING);
                 return;
            }
            const emptyInputs = Array.from(this.dom.gameArea.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.CELL} input`))
                                    .filter(input => input.value === '');
            if (emptyInputs.length === 0) {
                this.uiManager.showToast(CONSTANTS.ERROR_MESSAGES.NO_EMPTY_CELLS_FOR_HINT, CONSTANTS.CSS_CLASSES.TOAST_SUCCESS);
                if (this.dom.hintButton) this.dom.hintButton.disabled = true;
                return;
            }
            const randomInput = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
            const id = randomInput.getAttribute(CONSTANTS.DATA_ATTRIBUTES.CELL_ID);
            const coordinates = SudokuUtils.parseCellId(id);
            if (!coordinates) {
                console.error("Could not parse cell ID for hint:", id);
                this.uiManager.showToast(CONSTANTS.ERROR_MESSAGES.HINT_GENERATION_FAILED, CONSTANTS.CSS_CLASSES.TOAST_ERROR);
                return;
            }
            const { boardIndex, row, column } = coordinates;
            const correctValue = this.gameState.currentSolutions[boardIndex]?.[row]?.[column];
            if (correctValue === undefined) {
                console.error("Correct value is undefined for the selected hint cell:", id);
                this.uiManager.showToast(CONSTANTS.ERROR_MESSAGES.HINT_GENERATION_FAILED, CONSTANTS.CSS_CLASSES.TOAST_ERROR);
                return;
            }
            randomInput.value = correctValue;
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            randomInput.dispatchEvent(inputEvent);
            this.gameState.remainingHints--;
            this.uiManager.updateHintDisplay();
            console.log(`Hint used: Board ${boardIndex + 1}, Cell R${row + 1}-C${column + 1} = ${correctValue}. Remaining hints: ${this.gameState.remainingHints}`);
        }
    }

    document.addEventListener('DOMContentLoaded', () => { // // DOM tamamen yüklendiğinde oyun başlar.
        const game = new SudokuGame();
        game.init();
    });
})();