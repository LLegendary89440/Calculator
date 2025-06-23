const display = document.getElementById('display');
let currentInput = "0"; // Represents the current number being typed or the result
let operator = null;    // Stores the last operator clicked (+, -, *, /)
let firstOperand = null; // Stores the first number in a two-number operation
let shouldResetDisplay = false; // Flag to clear display before new number input

function updateDisplay() {
    display.value = currentInput;
}

function appendNumber(number) {
    if (currentInput === "0" || shouldResetDisplay) {
        currentInput = number;
        shouldResetDisplay = false;
    } else {
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (operator !== null && !shouldResetDisplay) {
        // If an operator is already active and we haven't just calculated,
        // perform the previous calculation first
        calculateResult();
    }
    firstOperand = parseFloat(currentInput);
    operator = op;
    shouldResetDisplay = true; // Next number will start fresh
    // Optionally display operator in a different area or just prepare for next input
    // For simplicity, we just set the flag. The currentInput (firstOperand) remains on display.
}

function calculateResult() {
    if (operator === null || firstOperand === null || shouldResetDisplay) {
        // Do nothing if no operator, no first operand, or if we just set an operator
        return;
    }

    const secondOperand = parseFloat(currentInput);
    let result;

    switch (operator) {
        case '+':
            result = firstOperand + secondOperand;
            break;
        case '-':
            result = firstOperand - secondOperand;
            break;
        case '*':
            result = firstOperand * secondOperand;
            break;
        case '/':
            if (secondOperand === 0) {
                currentInput = "Error";
                updateDisplay();
                resetCalculatorState(); // Reset state after error
                return;
            }
            result = firstOperand / secondOperand;
            break;
        default:
            return; // Should not happen
    }

    currentInput = String(parseFloat(result.toFixed(10))); // toFixed to handle floating point issues and parseFloat to remove trailing zeros
    operator = null;
    firstOperand = null; // Result is now the currentInput, ready for new operation or clear
    shouldResetDisplay = true; // If user types a number, it starts a new input
    updateDisplay();
}

function clearDisplay() {
    currentInput = "0";
    operator = null;
    firstOperand = null;
    shouldResetDisplay = false;
    updateDisplay();
}

function resetCalculatorState() {
    operator = null;
    firstOperand = null;
    shouldResetDisplay = true; // Prepare for a new input after error clear
}


function deleteLast() {
    if (shouldResetDisplay) { // If result is shown, or after operator, DEL acts like clear
        clearDisplay();
        return;
    }
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0"; // If only one digit, set to 0
    }
    updateDisplay();
}

// Initialize display
updateDisplay();