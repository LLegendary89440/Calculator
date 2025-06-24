const display = document.getElementById('display');
const historyLogElement = document.getElementById('history-log');

let currentDisplayString = "0";
let justCalculated = false;
let history = [];

function updateDisplay() {
    let visualString = currentDisplayString
        .replace(/\//g, ' ÷ ')
        .replace(/\*/g, ' × ')
        .replace(/\+/g, ' + ')
        .replace(/-/g, (match, offset, originalString) => {
            if (offset === 0 || (originalString[offset - 1] === ' ' && ['×', '÷', '+'].includes(originalString[offset - 2]))) {
                return '-';
            }
            return ' - ';
        })
        .replace(/  +/g, ' ');
    
    // Auto-adjust font size for very long expressions (simple version)
    const maxLengthBeforeShrink = 10; // Characters before font starts shrinking
    const baseFontSize = 3.2; // em, from CSS
    const minFontSize = 1.5; // em
    let newFontSize = baseFontSize;

    if (visualString.length > maxLengthBeforeShrink) {
        newFontSize = Math.max(minFontSize, baseFontSize - (visualString.length - maxLengthBeforeShrink) * 0.12);
    }
    display.style.fontSize = `${newFontSize}em`;
    
    display.value = visualString.trim();
    display.scrollLeft = display.scrollWidth;
}


function appendInput(value) {
    const operators = ['/', '*', '-', '+'];
    const lastRawChar = currentDisplayString.slice(-1);

    if (currentDisplayString === "Error") {
        currentDisplayString = "0";
    }

    if (justCalculated) {
        if (operators.includes(value)) {
            // Use previous result to start new calculation
        } else if (value === '.') {
            currentDisplayString = "0";
        } else {
            currentDisplayString = "";
        }
        justCalculated = false;
    }

    if (currentDisplayString === "0" && !operators.includes(value) && value !== '.') {
        currentDisplayString = "";
    }

    if (operators.includes(value)) {
        if (currentDisplayString === "" && value === '-') {
            currentDisplayString = "-";
        } else if (currentDisplayString === "" || currentDisplayString === "-") {
            if (currentDisplayString === "-" && value === "-") currentDisplayString = "";
            else return;
        } else if (operators.includes(lastRawChar)) {
            if (value === '-' && lastRawChar !== '-') {
                 currentDisplayString += value;
            } else {
                 currentDisplayString = currentDisplayString.slice(0, -1) + value;
            }
        } else {
            currentDisplayString += value;
        }
    } else if (value === '.') {
        const matchLastNumber = currentDisplayString.match(/-?\d*\.?\d*$/);
        const lastNumberSegment = matchLastNumber ? matchLastNumber[0] : "";

        if (!lastNumberSegment.includes('.')) {
            if (currentDisplayString === "" || operators.includes(lastRawChar) || lastRawChar === '' || currentDisplayString.endsWith(' ')) {
                currentDisplayString += (currentDisplayString === "" || currentDisplayString === "-" || currentDisplayString.endsWith(' ')) ? "0." : ".";
                 if (currentDisplayString === ".") currentDisplayString = "0."; // case of only "."
                 if (operators.includes(lastRawChar) && lastRawChar !== '-') currentDisplayString += "0."; // after "5+", type "." -> "5+0."

            } else {
                currentDisplayString += ".";
            }
        }
    } else { // Number
        currentDisplayString += value;
    }
    updateDisplay();
}

function calculateResult() {
    if (currentDisplayString === "Error" || currentDisplayString === "" || currentDisplayString === "-") return;

    let expressionToEvaluate = currentDisplayString
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

    const operators = ['/', '*', '-', '+'];
    let lastCharForEval = expressionToEvaluate.slice(-1);
    while (operators.includes(lastCharForEval) && expressionToEvaluate.length > 0) {
        if (lastCharForEval === '-' && expressionToEvaluate.length > 1 && operators.includes(expressionToEvaluate.slice(-2, -1))) {
            break;
        }
        expressionToEvaluate = expressionToEvaluate.slice(0, -1);
        lastCharForEval = expressionToEvaluate.slice(-1);
    }

    if (expressionToEvaluate === "" || expressionToEvaluate === "-") return;

    try {
        // eslint-disable-next-line no-eval
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

    const visualOperatorsWithSpaceEnd = [' × ', ' ÷ ', ' + ', ' - '];
    let originalLength = currentDisplayString.length;

    for (const visOp of visualOperatorsWithSpaceEnd) {
        if (currentDisplayString.endsWith(visOp.trim())) { // Check if it ends with operator (even without trailing space if that's how it was entered)
            // More robustly remove operator and preceding/succeeding spaces used for visual formatting
            const opIndex = currentDisplayString.lastIndexOf(visOp.trim());
            if (opIndex !== -1 && currentDisplayString.substring(opIndex).trim() === visOp.trim()) {
                // Attempt to find the operator in its raw form (+, -, *, /)
                const rawOp = visOp.trim().replace('×','*').replace('÷','/');
                const rawOpIndex = currentDisplayString.lastIndexOf(rawOp);
                if(rawOpIndex !== -1) {
                    currentDisplayString = currentDisplayString.substring(0, rawOpIndex);
                    break;
                }
            }
        }
    }
    // If no visual operator with space was deleted, just slice the last char
    if (currentDisplayString.length === originalLength && currentDisplayString.length > 0) {
        currentDisplayString = currentDisplayString.slice(0, -1);
    }


    if (currentDisplayString === "" || currentDisplayString === "-") {
        currentDisplayString = "0";
    }
    updateDisplay();
}

function toggleSign() {
    if (currentDisplayString === "Error") return;
    if (justCalculated) {
        if (!isNaN(parseFloat(currentDisplayString))) {
             let num = parseFloat(currentDisplayString);
             if (num !== 0) currentDisplayString = String(num * -1);
             justCalculated = false;
             updateDisplay();
        }
        return;
    }

    // Try to find the last number segment
    const segments = currentDisplayString.split(/([\+\-\*\/])/g); // Split by operators, keeping them
    let lastNumberIndex = -1;
    for (let i = segments.length - 1; i >= 0; i--) {
        if (segments[i].trim() !== "" && !isNaN(parseFloat(segments[i]))) {
            lastNumberIndex = i;
            break;
        }
    }

    if (lastNumberIndex !== -1) {
        let numStr = segments[lastNumberIndex];
        let num = parseFloat(numStr);
        if (num > 0) {
            segments[lastNumberIndex] = `-${numStr}`;
        } else if (num < 0) {
            segments[lastNumberIndex] = numStr.substring(1); // Remove '-'
        } else { // num is 0
            // If the segment before this 0 is an operator, allow making it -0 or just -
            if (lastNumberIndex > 0 && ['+','-','*','/'].includes(segments[lastNumberIndex-1])) {
                segments[lastNumberIndex] = '-'; // Start typing negative
            }
        }
        currentDisplayString = segments.join('');
    } else if (currentDisplayString === "0") {
        currentDisplayString = "-"; // Start typing a negative number
    }


    updateDisplay();
}


function percentage() {
    if (currentDisplayString === "Error") return;
    try {
        const expressionForEval = currentDisplayString.replace(/×/g, '*').replace(/÷/g, '/');
        const operators = ['+','-','*','/'];
        let parts = expressionForEval.split(/([\+\-\*\/])/); // Split by operators, keeping them
        parts = parts.filter(p => p.trim() !== ""); // Remove empty strings

        let result;
        let originalExpressionForHistory = currentDisplayString;

        if (parts.length >= 3 && operators.includes(parts[parts.length - 2])) {
            // Case: X op Y%  => X op (X * Y/100) or X op (Y/100)
            let Y = parseFloat(parts.pop());
            let op = parts.pop();
            let X_expr = parts.join('');
            let X = eval(X_expr);

            if (op === '+' || op === '-') {
                result = X * (Y / 100);
                result = (op === '+') ? X + result : X - result;
            } else { // * or /
                result = Y / 100;
                result = (op === '*') ? X * result : X / result;
            }
        } else if (parts.length === 1 && !isNaN(parseFloat(parts[0]))) { // Just a number
            result = parseFloat(parts[0]) / 100;
        } else {
             // Fallback: evaluate the whole string and take percentage
            let val = eval(expressionForEval);
            result = val / 100;
        }

        result = parseFloat(result.toFixed(10));
        addToHistory(`${originalExpressionForHistory.replace(/\*/g, '×').replace(/\//g, '÷')} % = ${result}`);
        currentDisplayString = String(result);
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
        let expressionToEval = currentDisplayString.replace(/×/g, '*').replace(/÷/g, '/');
        // Remove trailing operator if any
        const operators = ['/', '*', '-', '+'];
        if (operators.includes(expressionToEval.trim().slice(-1))) {
            expressionToEval = expressionToEval.trim().slice(0, -1).trim();
        }
        if (expressionToEval === "") { currentDisplayString = "Error"; updateDisplay(); return; }


        let num = eval(expressionToEval);

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
    history.unshift(entry);
    if (history.length > 20) {
        history.pop();
    }
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyLogElement.innerHTML = "";
    history.forEach(item => {
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
    if (event.metaKey || event.ctrlKey) {
        if (['c', 'v', 'x', 'a', 'z', 'y'].includes(key.toLowerCase())) return;
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
    else if (key.toLowerCase() === 'c' && !event.shiftKey) { clearAll(); }
    else if (key === '%') percentage();
    else if (key.toLowerCase() === 's') squareRoot();
    else handled = false;

    if (valueToAppend) appendInput(valueToAppend);

    if (handled) {
        event.preventDefault();
    }
});

document.querySelectorAll('.interactive-bg').forEach(button => {
    const computedStyle = getComputedStyle(button);
    // Store both image and color for accurate restoration
    button.dataset.originalBgImage = computedStyle.backgroundImage;
    button.dataset.originalBgColor = computedStyle.backgroundColor;

    button.addEventListener('mousemove', function(e) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Use the single white/light highlight color for ALL buttons
        const highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--interactive-highlight-color').trim();
        const interactiveGradient = `radial-gradient(circle at ${x}px ${y}px, ${highlightColor} 0%, transparent 80%)`; // Spread adjusted

        // Layer the interactive gradient ON TOP of the original background
        let finalBgImage = interactiveGradient;
        // If the button has a base gradient (like operators), layer on top
        if (button.dataset.originalBgImage && button.dataset.originalBgImage !== 'none') {
            finalBgImage = `${interactiveGradient}, ${button.dataset.originalBgImage}`;
        }
        button.style.backgroundImage = finalBgImage;
        // Crucially, set the original background color so it's not overridden by 'transparent' from gradient
        button.style.backgroundColor = button.dataset.originalBgColor;
    });

    button.addEventListener('mouseleave', function() {
        // Restore both original image and color
        button.style.backgroundImage = button.dataset.originalBgImage;
        button.style.backgroundColor = button.dataset.originalBgColor;
    });
});

updateDisplay();
updateHistoryDisplay();