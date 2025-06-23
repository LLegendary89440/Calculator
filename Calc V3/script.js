// The JavaScript from the "fancy and advanced" version should work as is.
// Just ensure all function names called by onclick attributes in HTML are correct.

const display = document.getElementById('display');
const historyLogElement = document.getElementById('history-log');

let currentInput = "0";
let operator = null;
let firstOperand = null;
let shouldResetDisplay = false;
let calculationDone = false;
let history = [];

// --- Display Functions ---
function updateDisplay() {
    display.value = currentInput;
}

function updateHistoryDisplay() {
    historyLogElement.innerHTML = "";
    history.slice().reverse().forEach(item => {
        const historyItemDiv = document.createElement('div');
        historyItemDiv.classList.add('history-item');
        historyItemDiv.textContent = item;
        historyLogElement.appendChild(historyItemDiv);
    });
}

function addToHistory(expression) {
    history.push(expression);
    if (history.length > 30) { // Increased history limit
        history.shift();
    }
    updateHistoryDisplay();
}

// --- Core Logic Functions ---
function appendNumber(number) {
    if (currentInput === "0" || shouldResetDisplay || calculationDone) {
        currentInput = number;
        shouldResetDisplay = false;
        calculationDone = false;
    } else {
        if (number === '.' && currentInput.includes('.')) return;
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === "Error") return;

    if (operator !== null && !shouldResetDisplay && !calculationDone) {
        calculateResultInternal();
    }

    if (calculationDone) {
        firstOperand = parseFloat(currentInput);
        calculationDone = false;
    } else {
        firstOperand = parseFloat(currentInput);
    }

    operator = op;
    shouldResetDisplay = true;
}


function calculateResultInternal() {
    if (operator === null || firstOperand === null || currentInput === "Error") {
        return false;
    }

    const secondOperand = parseFloat(currentInput);
    let result;
    // Sanitize display for history (e.g., × for *, ÷ for /)
    let displayOperator = operator;
    if (operator === '*') displayOperator = '×';
    if (operator === '/') displayOperator = '÷';
    let expressionForHistory = `${firstOperand} ${displayOperator} ${secondOperand}`;

    if (isNaN(firstOperand) || isNaN(secondOperand)) {
        currentInput = "Error";
        result = "Error"; // To pass to expressionForHistory
    } else {
        switch (operator) {
            case '+': result = firstOperand + secondOperand; break;
            case '-': result = firstOperand - secondOperand; break;
            case '*': result = firstOperand * secondOperand; break;
            case '/':
                if (secondOperand === 0) {
                    currentInput = "Error";
                    updateDisplay();
                    resetCalculatorStateAfterError();
                    return false;
                }
                result = firstOperand / secondOperand;
                break;
            default: return false;
        }
    }

    if (currentInput !== "Error") {
        currentInput = String(parseFloat(result.toFixed(10)));
    }
    
    return { expression: `${expressionForHistory} = ${currentInput}`, result: currentInput };
}

function calculateResult() {
    if (currentInput === "Error") return;
    const calc = calculateResultInternal();
    if (calc) {
        addToHistory(calc.expression);
        updateDisplay();
        operator = null;
        shouldResetDisplay = true;
        calculationDone = true;
    }
}


// --- Utility Functions ---
function clearAll() { // AC
    currentInput = "0";
    operator = null;
    firstOperand = null;
    shouldResetDisplay = false;
    calculationDone = false;
    updateDisplay();
}

function resetCalculatorStateAfterError() {
    operator = null;
    firstOperand = null;
    shouldResetDisplay = true;
    calculationDone = false;
}

function deleteLast() { // DEL
    if (calculationDone || currentInput === "Error") {
        clearAll();
        return;
    }
    if (shouldResetDisplay) return;

    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }
    updateDisplay();
}

function toggleSign() { // +/-
    if (currentInput === "0" || currentInput === "Error" || calculationDone) return;
    currentInput = String(parseFloat(currentInput) * -1);
    updateDisplay();
}

function percentage() {
    if (currentInput === "Error" || calculationDone) return;
    const currentValue = parseFloat(currentInput);
    let result;
    let expressionPart;

    if (operator && firstOperand !== null && !shouldResetDisplay) {
        // Calculate percentage of the first operand
        result = firstOperand * (currentValue / 100);
        expressionPart = `${firstOperand} ${operator} (${currentValue}%)`; // e.g. 100 + 10%
        currentInput = String(parseFloat(result.toFixed(10)));

        // Then perform the original operation with this new second operand
        const secondOperandForCalc = parseFloat(currentInput); // The percentage result
        switch (operator) {
            case '+': result = firstOperand + secondOperandForCalc; break;
            case '-': result = firstOperand - secondOperandForCalc; break;
            case '*': result = firstOperand * secondOperandForCalc; break;
            case '/': 
                if (secondOperandForCalc === 0 && operator === '/') {
                    currentInput = "Error"; updateDisplay(); resetCalculatorStateAfterError(); return;
                }
                result = firstOperand / secondOperandForCalc; break;
        }
        expressionPart = `${firstOperand} ${operator} ${currentValue}% = ${result}`;
        currentInput = String(parseFloat(result.toFixed(10)));
    } else {
        // Simple percentage (e.g., 50% becomes 0.5)
        result = currentValue / 100;
        expressionPart = `${currentValue}% = ${result}`;
        currentInput = String(parseFloat(result.toFixed(10)));
    }
    
    addToHistory(expressionPart);
    updateDisplay();
    shouldResetDisplay = true;
    calculationDone = true; // After % operation, consider it a calculation end
}


function squareRoot() { // √
    if (currentInput === "Error") return;
    const num = parseFloat(currentInput);
    if (num < 0) {
        currentInput = "Error";
        updateDisplay();
        resetCalculatorStateAfterError();
        return;
    }
    const result = Math.sqrt(num);
    const expression = `√(${currentInput}) = ${parseFloat(result.toFixed(10))}`;
    currentInput = String(parseFloat(result.toFixed(10)));
    addToHistory(expression);
    updateDisplay();
    shouldResetDisplay = true;
    calculationDone = true;
}

function clearHistory() {
    history = [];
    updateHistoryDisplay();
}

// --- Keyboard Support ---
document.addEventListener('keydown', function(event) {
    const key = event.key;
    if (event.metaKey || event.ctrlKey) { // Allow copy/paste etc.
        if (key.toLowerCase() === 'c' || key.toLowerCase() === 'v' || key.toLowerCase() === 'x' || key.toLowerCase() === 'a' ) {
            return;
        }
    }


    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendNumber('.');
    } else if (key === '+') {
        appendOperator('+');
    } else if (key === '-') {
        appendOperator('-');
    } else if (key === '*') {
        appendOperator('*');
    } else if (key === '/') {
        event.preventDefault(); // Prevent quick find in Firefox
        appendOperator('/');
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculateResult();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clearAll();
    } else if (key.toLowerCase() === 'c' && !event.shiftKey) { // AC on 'c' (if not shift+c)
         clearAll();
    } else if (key === '%') {
        percentage();
    } else if (key.toLowerCase() === 'r') { // 'r' for square root
        squareRoot();
    }
});


// --- Initial Load ---
updateDisplay();
updateHistoryDisplay();