const display = document.getElementById('display');
const historyLogElement = document.getElementById('history-log');

let currentDisplayString = "0"; // This is what's shown on the display
let justCalculated = false;     // Flag to know if '=' was just pressed
let history = [];

function updateDisplay() {
    // Replace internal operators with visual ones for display and add spacing
    let visualString = currentDisplayString
        .replace(/\//g, ' ÷ ')  // Important: replace / first
        .replace(/\*/g, ' × ')
        .replace(/\+/g, ' + ')
        .replace(/-/g, (match, offset, originalString) => {
            // Handle negative numbers vs. subtraction operator
            // If '-' is at the start or after another operator (with space), it's a negative sign
            if (offset === 0 || (originalString[offset - 1] === ' ' && ['×', '÷', '+'].includes(originalString[offset - 2]))) {
                return '-'; // Part of a negative number, no extra spaces
            }
            return ' - '; // Subtraction operator, add spaces
        })
        .replace(/  +/g, ' '); // Consolidate multiple spaces
    
    display.value = visualString.trim();
    display.scrollLeft = display.scrollWidth; // Scroll to the end
}


function appendInput(value) {
    const operators = ['/', '*', '-', '+'];
    // Get the actual last character from the raw string for logic
    const lastRawChar = currentDisplayString.slice(-1);

    if (currentDisplayString === "Error") {
        currentDisplayString = "0"; // Reset from error
    }

    if (justCalculated) {
        if (operators.includes(value)) {
            // currentDisplayString already holds the result, so append the operator directly
        } else if (value === '.') {
            currentDisplayString = "0"; // Start new number "0."
        } else { // If a number is pressed after result, start new calculation
            currentDisplayString = "";
        }
        justCalculated = false;
    }

    if (currentDisplayString === "0" && !operators.includes(value) && value !== '.') {
        currentDisplayString = ""; // Remove leading "0" if a number is typed
    }

    // Logic for appending numbers and operators
    if (operators.includes(value)) {
        if (currentDisplayString === "" && value === '-') { // Allow starting with a negative
            currentDisplayString = "-";
        } else if (currentDisplayString === "" || currentDisplayString === "-") {
            // Don't append operators if display is empty or just a minus (unless it's another minus for explicit positive)
             if (currentDisplayString === "-" && value === "-") currentDisplayString = ""; // -- becomes empty (or handle as + later)
             else return;
        } else if (operators.includes(lastRawChar)) {
            // Replace last operator if another is pressed
            // Exception: allow forming negative numbers after an operator, e.g., 5 * -2
            if (value === '-' && lastRawChar !== '-') {
                 currentDisplayString += value; // Append '-' for negative
            } else {
                 currentDisplayString = currentDisplayString.slice(0, -1) + value;
            }
        } else {
            currentDisplayString += value;
        }
    } else if (value === '.') {
        // Prevent multiple decimals in the last number segment
        // Regex to find the last sequence of digits (possibly with a leading -)
        const matchLastNumber = currentDisplayString.match(/-?\d*\.?\d*$/);
        const lastNumberSegment = matchLastNumber ? matchLastNumber[0] : "";

        if (!lastNumberSegment.includes('.')) {
            if (currentDisplayString === "" || operators.includes(lastRawChar) || lastRawChar === '') {
                 // If display is empty, or last char is operator, or it's empty after trimming
                currentDisplayString += (currentDisplayString === "" || currentDisplayString === "-") ? "0." : ".";
                 if (currentDisplayString === ".") currentDisplayString = "0.";
                 if (operators.includes(lastRawChar) && lastRawChar !== '-') currentDisplayString += "0.";

            } else {
                currentDisplayString += ".";
            }
        }
    } else { // It's a number
        currentDisplayString += value;
    }
    updateDisplay();
}

function calculateResult() {
    if (currentDisplayString === "Error" || currentDisplayString === "" || currentDisplayString === "-") return;

    let expressionToEvaluate = currentDisplayString
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

    // Remove trailing operator if present
    const operators = ['/', '*', '-', '+'];
    let lastCharForEval = expressionToEvaluate.slice(-1);
    while (operators.includes(lastCharForEval) && expressionToEvaluate.length > 1) {
        // If the character before the operator is also an operator (e.g. "5 * -"), don't trim the minus
        if (lastCharForEval === '-' && operators.includes(expressionToEvaluate.slice(-2, -1))) {
            break; // Keep it, it's part of a negative number like "5 * -2"
        }
        expressionToEvaluate = expressionToEvaluate.slice(0, -1);
        lastCharForEval = expressionToEvaluate.slice(-1);
    }

    if (expressionToEvaluate === "" || expressionToEvaluate === "-") return;

    try {
        let result = eval(expressionToEvaluate);

        if (result === Infinity || result === -Infinity || isNaN(result)) {
            currentDisplayString = "Error";
        } else {
            result = parseFloat(result.toFixed(10));
            addToHistory(`${currentDisplayString.replace(/\*/g, '×').replace(/\//g, '÷')} = ${result}`);
            currentDisplayString = String(result);
        }
    } catch (e) {
        currentDisplayString = "Error";
    }
    justCalculated = true;
    updateDisplay();
}

function clearAll() {
    currentDisplayString = "0";
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (currentDisplayString === "Error" || justCalculated) {
        clearAll();
        return;
    }

    // Smart delete for visual operators with spaces
    const visualOperatorsWithSpace = [' × ', ' ÷ ', ' + ', ' - '];
    let foundAndDeleted = false;
    for (const visOp of visualOperatorsWithSpace) {
        if (currentDisplayString.endsWith(visOp)) {
            currentDisplayString = currentDisplayString.slice(0, -visOp.length);
            foundAndDeleted = true;
            break;
        }
    }

    if (!foundAndDeleted && currentDisplayString.length > 0) {
        currentDisplayString = currentDisplayString.slice(0, -1);
    }

    if (currentDisplayString === "" || currentDisplayString === "-") {
        currentDisplayString = "0";
    }
    updateDisplay();
}


function toggleSign() {
    if (currentDisplayString === "Error" || justCalculated) {
        if (!isNaN(parseFloat(currentDisplayString))) {
             let num = parseFloat(currentDisplayString);
             if (num !== 0) currentDisplayString = String(num * -1);
             justCalculated = false; // Allow continuing calculation
             updateDisplay();
        }
        return;
    }

    // Try to toggle the sign of the last number segment in the expression
    // This regex matches an optional minus sign, digits, an optional decimal, and more digits, at the end of the string.
    // Or just an operator at the end.
    const match = currentDisplayString.match(/(-?\d+\.?\d*|[\+\-\*\/])$/);
    if (match) {
        let lastSegment = match[0];
        let prefix = currentDisplayString.substring(0, currentDisplayString.length - lastSegment.length);

        if (!isNaN(parseFloat(lastSegment))) { // It's a number
            let num = parseFloat(lastSegment);
            if (num > 0) {
                currentDisplayString = prefix + `-${lastSegment}`;
            } else if (num < 0) {
                currentDisplayString = prefix + lastSegment.substring(1); // Remove leading '-'
            } else { // num is 0
                 // If prefix ends with an operator, we might want to type "-0" or just "-"
                if (prefix.trim().match(/[\+\*\/]$/)) { // if ends with *, /, +
                    currentDisplayString = prefix + "-"; // start typing negative
                } else if (prefix.trim().endsWith('-')) { // if ends with - (e.g. "5 - ")
                    currentDisplayString = prefix + "-"; // effectively "5 - -" which eval might handle as "5 + "
                }
            }
        } else if (lastSegment === '+') {
            currentDisplayString = prefix + '-';
        } else if (lastSegment === '-') {
            // If the char before '-' is an operator, then it's "op -", change to "op +"
            // If it's a number, it's "num -", which is fine.
            if (prefix.trim().match(/[\+\-\*\/]$/)) {
                 currentDisplayString = prefix + '+';
            } else {
                // It was likely a subtraction, now make it explicit negative for next input
                currentDisplayString = prefix + lastSegment + '-';
            }
        }
        // For * and /, toggling sign usually means prepending a negative to the *next* number
        // So if last op is * or /, just append '-'
        else if (lastSegment === '*' || lastSegment === '/') {
            currentDisplayString += '-';
        }
    }
    updateDisplay();
}


function percentage() {
    if (currentDisplayString === "Error") return;
    try {
        // More sophisticated: apply percentage based on context
        // If "X + Y%", it means X + (X * Y/100)
        // If just "Y%", it means Y/100
        const match = currentDisplayString.match(/(.*[\+\-\*\/])?\s*(-?\d+\.?\d*)$/); // Match "prefix op last_number"

        if (match) {
            let prefixAndOp = match[1] || ""; // e.g., "100 + " or ""
            let lastNumberStr = match[2];
            let lastNumber = parseFloat(lastNumberStr);

            let result;
            let originalExpressionForHistory = currentDisplayString;

            if (prefixAndOp.trim() !== "") {
                let op = prefixAndOp.trim().slice(-1);
                let firstPartExpression = prefixAndOp.trim().slice(0, -1).trim();
                let firstOperand = eval(firstPartExpression.replace(/×/g, '*').replace(/÷/g, '/'));

                if (op === '+' || op === '-') {
                    result = firstOperand * (lastNumber / 100);
                    result = (op === '+') ? firstOperand + result : firstOperand - result;
                } else if (op === '*' || op === '÷') { // For multiply/divide, Y% is Y/100
                    result = lastNumber / 100;
                    result = (op === '*') ? firstOperand * result : firstOperand / result;
                }
            } else { // Just a number then %
                result = lastNumber / 100;
            }
            result = parseFloat(result.toFixed(10));
            addToHistory(`${originalExpressionForHistory.replace(/\*/g, '×').replace(/\//g, '÷')} % = ${result}`);
            currentDisplayString = String(result);

        } else if (!isNaN(parseFloat(currentDisplayString))) { // Single number on display
            let num = parseFloat(currentDisplayString);
            let result = num / 100;
            result = parseFloat(result.toFixed(10));
            addToHistory(`${currentDisplayString} % = ${result}`);
            currentDisplayString = String(result);
        } else {
            throw new Error("Invalid format for percentage");
        }

        justCalculated = true;
        updateDisplay();
    } catch (e) {
        currentDisplayString = "Error";
        updateDisplay();
    }
}

function squareRoot() {
    if (currentDisplayString === "Error") return;
    try {
        // Tries to operate on the last number, or evaluates the whole expression if it's simple
        let expressionToEval = currentDisplayString.replace(/×/g, '*').replace(/÷/g, '/');
        const operators = ['/', '*', '-', '+'];

        // If the expression ends with an operator, we can't sqrt that directly
        if (operators.includes(expressionToEval.trim().slice(-1))) {
             currentDisplayString = "Error"; // Or prompt to enter a number
             updateDisplay();
             return;
        }

        let num = eval(expressionToEval); // Evaluate the current visible expression

        if (num < 0) {
            currentDisplayString = "Error";
        } else {
            let result = Math.sqrt(num);
            result = parseFloat(result.toFixed(10));
            addToHistory(`√(${currentDisplayString.replace(/\*/g, '×').replace(/\//g, '÷')}) = ${result}`);
            currentDisplayString = String(result);
        }
        justCalculated = true;
        updateDisplay();
    } catch (e) {
        currentDisplayString = "Error";
        updateDisplay();
    }
}


function addToHistory(entry) {
    history.unshift(entry); // Add to the beginning for newest first
    if (history.length > 20) { // Keep history to a reasonable size
        history.pop();
    }
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyLogElement.innerHTML = ""; // Clear existing history
    history.forEach(item => { // Iterate normally as unshift keeps newest at [0]
        const historyItemDiv = document.createElement('div');
        historyItemDiv.classList.add('history-item');
        historyItemDiv.textContent = item;
        historyLogElement.appendChild(historyItemDiv);
    });
}

function clearHistory() {
    history = [];
    updateHistoryDisplay();
}

document.addEventListener('keydown', function(event) {
    const key = event.key;
    if (event.metaKey || event.ctrlKey) { // Allow copy/paste etc.
        if (['c', 'v', 'x', 'a', 'z', 'y'].includes(key.toLowerCase())) return; // Allow undo/redo too
    }
    let handled = true;
    let valueToAppend = '';

    if (key >= '0' && key <= '9') valueToAppend = key;
    else if (key === '.') valueToAppend = '.';
    else if (key === '+') valueToAppend = '+';
    else if (key === '-') valueToAppend = '-';
    else if (key === '*') valueToAppend = '*';
    else if (key === '/') valueToAppend = '/';
    else if (key === 'Enter' || key === '=') { calculateResult(); handled = true; }
    else if (key === 'Backspace') deleteLast();
    else if (key === 'Escape') clearAll();
    else if (key.toLowerCase() === 'c' && !event.shiftKey) { clearAll(); } // AC on 'c'
    else if (key === '%') percentage();
    else if (key.toLowerCase() === 's') squareRoot(); // 's' for square root
    else handled = false;

    if (valueToAppend) appendInput(valueToAppend);

    if (handled) {
        event.preventDefault();
    }
});

document.querySelectorAll('.interactive-bg').forEach(button => {
    const computedStyle = getComputedStyle(button);
    button.dataset.originalBgImage = computedStyle.backgroundImage;
    button.dataset.originalBgColor = computedStyle.backgroundColor;

    button.addEventListener('mousemove', function(e) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let highlightColorVar = (button.classList.contains('btn-operator') || button.classList.contains('btn-equals')) ? '--interactive-highlight-light' : '--interactive-highlight-dark';
        const highlightColor = getComputedStyle(document.documentElement).getPropertyValue(highlightColorVar).trim();
        const interactiveGradient = `radial-gradient(circle at ${x}px ${y}px, ${highlightColor} 0%, transparent 85%)`;

        // Layer the interactive gradient ON TOP of the original background
        let finalBgImage = interactiveGradient;
        if (button.dataset.originalBgImage && button.dataset.originalBgImage !== 'none') {
            finalBgImage = `${interactiveGradient}, ${button.dataset.originalBgImage}`;
        }
        button.style.backgroundImage = finalBgImage;
        button.style.backgroundColor = button.dataset.originalBgColor; // Ensure base color is there
    });

    button.addEventListener('mouseleave', function() {
        button.style.backgroundImage = button.dataset.originalBgImage;
        button.style.backgroundColor = button.dataset.originalBgColor;
    });
});

// --- Initial Load ---
updateDisplay();
updateHistoryDisplay(); // Initialize history view