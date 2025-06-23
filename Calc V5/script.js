// ... (all existing calculator logic up to "NEW: Interactive Button Background Effect") ...
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
    if (history.length > 30) {
        history.shift();
    }
    updateHistoryDisplay();
}

// --- Core Logic Functions (ellipsis for brevity - use your existing full functions) ---
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
    } else if (currentInput !== "") {
        firstOperand = parseFloat(currentInput);
    }


    operator = op;
    shouldResetDisplay = true;
}


function calculateResultInternal() {
    if (operator === null || firstOperand === null || currentInput === "Error" || currentInput === "") {
        return false;
    }

    const secondOperand = parseFloat(currentInput);
    let result;
    let displayOperator = operator;
    if (operator === '*') displayOperator = '×';
    if (operator === '/') displayOperator = '÷';
    let expressionForHistory = `${firstOperand} ${displayOperator} ${secondOperand}`;

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
                    currentInput = "Error"; updateDisplay(); resetCalculatorStateAfterError(); return false;
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


function clearAll() {
    currentInput = "0"; operator = null; firstOperand = null;
    shouldResetDisplay = false; calculationDone = false; updateDisplay();
}
function resetCalculatorStateAfterError() {
    operator = null; firstOperand = null; shouldResetDisplay = true; calculationDone = false;
}
function deleteLast() {
    if (calculationDone || currentInput === "Error") { clearAll(); return; }
    if (shouldResetDisplay) return;
    currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
    updateDisplay();
}
function toggleSign() {
    if (currentInput === "0" || currentInput === "Error" || calculationDone) return;
    currentInput = String(parseFloat(currentInput) * -1); updateDisplay();
}
function percentage() {
    if (currentInput === "Error" || calculationDone) return;
    const currentValue = parseFloat(currentInput);
    let result, expressionPart;

    if (operator && firstOperand !== null && !shouldResetDisplay) {
        const percOfFirst = firstOperand * (currentValue / 100);
        expressionPart = `${firstOperand} ${operator === '*' ? '×' : operator === '/' ? '÷' : operator} ${currentValue}%`;
        
        switch (operator) {
            case '+': result = firstOperand + percOfFirst; break;
            case '-': result = firstOperand - percOfFirst; break;
            case '*': result = firstOperand * (currentValue / 100); break; 
            case '/': 
                if (currentValue === 0) { currentInput = "Error"; updateDisplay(); resetCalculatorStateAfterError(); return; }
                result = firstOperand / (currentValue / 100); break;
        }
        expressionPart += ` = ${parseFloat(result.toFixed(10))}`;

    } else {
        result = currentValue / 100;
        expressionPart = `${currentValue}% = ${parseFloat(result.toFixed(10))}`;
    }
    
    currentInput = String(parseFloat(result.toFixed(10)));
    addToHistory(expressionPart); updateDisplay();
    shouldResetDisplay = true; calculationDone = true;
}
function squareRoot() {
    if (currentInput === "Error") return;
    const num = parseFloat(currentInput);
    if (num < 0) { currentInput = "Error"; updateDisplay(); resetCalculatorStateAfterError(); return; }
    const result = Math.sqrt(num);
    const expression = `√(${currentInput}) = ${parseFloat(result.toFixed(10))}`;
    currentInput = String(parseFloat(result.toFixed(10)));
    addToHistory(expression); updateDisplay();
    shouldResetDisplay = true; calculationDone = true;
}
function clearHistory() { history = []; updateHistoryDisplay(); }

// --- Keyboard Support (ellipsis for brevity) ---
document.addEventListener('keydown', function(event) {
    const key = event.key;
    if (event.metaKey || event.ctrlKey) {
        if (['c', 'v', 'x', 'a'].includes(key.toLowerCase())) return;
    }
    // Only prevent default if we're handling the key, to allow browser shortcuts
    let handled = true; 

    if (key >= '0' && key <= '9') appendNumber(key);
    else if (key === '.') appendNumber('.');
    else if (key === '+') appendOperator('+');
    else if (key === '-') appendOperator('-');
    else if (key === '*') appendOperator('*');
    else if (key === '/') appendOperator('/');
    else if (key === 'Enter' || key === '=') calculateResult();
    else if (key === 'Backspace') deleteLast();
    else if (key === 'Escape') clearAll();
    else if (key.toLowerCase() === 'c' && !event.shiftKey) clearAll();
    else if (key === '%') percentage();
    else if (key.toLowerCase() === 'r') squareRoot();
    else handled = false; // Key not handled by calculator

    if(handled) event.preventDefault();
});


// --- UPDATED: Interactive Button Background Effect ---
document.querySelectorAll('.interactive-bg').forEach(button => {
    // Store original computed background (could be a color or an image)
    const computedStyle = getComputedStyle(button);
    button.dataset.originalBgImage = computedStyle.backgroundImage;
    button.dataset.originalBgColor = computedStyle.backgroundColor;

    button.addEventListener('mousemove', function(e) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let highlightColorVar;
        // Determine highlight color based on button type for better contrast
        if (button.classList.contains('btn-operator') || button.classList.contains('btn-equals')) {
            highlightColorVar = '--interactive-highlight-light'; // Lighter highlight for dark buttons
        } else {
            highlightColorVar = '--interactive-highlight-dark';  // Darker highlight for light buttons
        }
        const highlightColor = getComputedStyle(document.documentElement).getPropertyValue(highlightColorVar).trim();

        const interactiveGradient = `radial-gradient(circle at ${x}px ${y}px, ${highlightColor} 0%, transparent 70%)`;

        // Layer the interactive gradient ON TOP of the original background image (if any)
        // If there's no original image (like for .btn-num), it will just be the radial on the bg color
        if (button.dataset.originalBgImage && button.dataset.originalBgImage !== 'none') {
            button.style.backgroundImage = `${interactiveGradient}, ${button.dataset.originalBgImage}`;
        } else {
            button.style.backgroundImage = interactiveGradient;
        }
        // Ensure original background color is set, especially if originalBgImage was 'none'
        button.style.backgroundColor = button.dataset.originalBgColor;
    });

    button.addEventListener('mouseleave', function() {
        // Restore original computed background
        button.style.backgroundImage = button.dataset.originalBgImage;
        button.style.backgroundColor = button.dataset.originalBgColor;
    });
});


// --- Initial Load ---
updateDisplay();
updateHistoryDisplay();