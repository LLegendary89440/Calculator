const display = document.getElementById('display');
const historyLogElement = document.getElementById('history-log');

let currentInput = "0";
let operator = null;
let firstOperand = null;
let shouldResetDisplay = false; // True if next number input should clear current display
let calculationDone = false;  // True if the last action was a calculation (pressing '=')
let history = [];

// --- Display Functions ---
function updateDisplay() {
    display.value = currentInput;
}

function updateHistoryDisplay() {
    historyLogElement.innerHTML = ""; // Clear existing history
    history.slice().reverse().forEach(item => { // Show newest first
        const historyItemDiv = document.createElement('div');
        historyItemDiv.classList.add('history-item');
        historyItemDiv.textContent = item;
        historyLogElement.appendChild(historyItemDiv);
    });
}

function addToHistory(expression) {
    history.push(expression);
    if (history.length > 20) { // Keep history to a reasonable size
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
        // Prevent multiple decimals
        if (number === '.' && currentInput.includes('.')) return;
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === "Error") return; // Don't operate on an error

    if (operator !== null && !shouldResetDisplay) {
        // If an operator is already active and we haven't just set an operator,
        // perform the previous calculation first (chaining operations)
        calculateResultInternal();
    }

    // If a calculation was just done, use its result as the first operand
    if (calculationDone) {
        firstOperand = parseFloat(currentInput);
        calculationDone = false;
    } else {
        firstOperand = parseFloat(currentInput);
    }

    operator = op;
    shouldResetDisplay = true; // Next number input will overwrite display
    // Do not update currentInput here, keep firstOperand shown
}


function calculateResultInternal() { // Internal calculation, doesn't add to history directly
    if (operator === null || firstOperand === null || currentInput === "Error") {
        return false; // Not enough info to calculate or error state
    }

    const secondOperand = parseFloat(currentInput);
    let result;
    let expressionForHistory = `${firstOperand} ${operator} ${secondOperand}`;

    if (isNaN(firstOperand) || isNaN(secondOperand)) {
        currentInput = "Error";
        result = "Error";
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
        currentInput = String(parseFloat(result.toFixed(10))); // Handle float precision
    }
    
    // This internal function doesn't reset operator/firstOperand yet,
    // as it might be part of a chained operation.
    // It also doesn't set calculationDone=true, that's for the public calculateResult.
    return { expression: `${expressionForHistory} = ${currentInput}`, result: currentInput };
}

function calculateResult() { // Called when '=' is pressed
    if (currentInput === "Error") return;
    const calc = calculateResultInternal();
    if (calc) {
        addToHistory(calc.expression);
        updateDisplay();
        // Prepare for new calculation starting with the result, or a completely new one
        operator = null; // Operator used up
        // firstOperand = parseFloat(currentInput); // Result becomes new first operand if another op is pressed
        shouldResetDisplay = true; // If a number is pressed, it starts a new input
        calculationDone = true;    // Mark that '=' was pressed
    } else if (operator && firstOperand !== null && !shouldResetDisplay) {
        // Handle case like "5 * =" where second operand is missing
        // For simplicity, we can choose to do nothing or repeat last operation (more complex)
        // Here, we'll effectively do nothing if second operand isn't typed yet after an operator
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
    shouldResetDisplay = true; // Ready for new input after error
    calculationDone = false;
}

function deleteLast() { // DEL
    if (calculationDone || currentInput === "Error") { // If result is shown or error, DEL acts like clear for current input
        clearAll(); // Or just currentInput = "0"; and reset flags
        return;
    }
    if (shouldResetDisplay) return; // If an operator was just pressed, DEL does nothing to currentInput

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

function percentage() { // %
    if (currentInput === "Error" || calculationDone) return;
    let baseValue = firstOperand !== null && !shouldResetDisplay ? firstOperand : 1;
    let percentValue = parseFloat(currentInput);
    
    let result;
    let expressionPart;

    if (operator && firstOperand !== null) {
        // e.g. 100 + 10% (of 100)
        result = firstOperand * (percentValue / 100);
        expressionPart = `${firstOperand} ${operator} (${percentValue}%)`;
        currentInput = String(parseFloat(result.toFixed(10)));
        // Now it's as if this result was typed as the second operand
        // so we can immediately calculate
        calculateResult();

    } else {
        // e.g. just 10% (meaning 0.1)
        result = percentValue / 100;
        expressionPart = `${percentValue}%`;
        currentInput = String(parseFloat(result.toFixed(10)));
        addToHistory(`${expressionPart} = ${currentInput}`);
        shouldResetDisplay = true; // Next number starts a new input
        calculationDone = true;
    }
    updateDisplay();
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
    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendNumber('.');
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // Prevent form submission if inside one
        calculateResult();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clearAll();
    } else if (key.toLowerCase() === 'c') { // AC on 'c'
        if (!event.metaKey && !event.ctrlKey) { // Avoid conflict with copy
           clearAll();
        }
    } else if (key === '%') {
        percentage();
    }
    // Add more mappings if desired, e.g., 'r' for square root (√)
});


// --- Initial Load ---
updateDisplay();
updateHistoryDisplay(); // Initialize history view