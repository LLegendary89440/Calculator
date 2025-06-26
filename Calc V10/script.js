document.addEventListener('DOMContentLoaded', () => {
    const displayElement = document.getElementById('main-display');
    const historyLogElement = document.getElementById('history-log');
    const buttonsGrid = document.querySelector('.buttons-grid');

    let currentDisplayString = "0"; // This string will hold the full expression or result
    let calculationDone = false;    // Flag: true if the display shows a result of '='
    let history = [];

    const visualOperatorMap = { '/': '÷', '*': '×', '-': '-', '+': '+' };
    const internalOperatorMap = { '÷': '/', '×': '*', '-': '-', '+': '+' };


    function updateDisplay() {
        let displayToShow = currentDisplayString;

        // Add spaces around operators for visual formatting, carefully handling negative numbers
        displayToShow = displayToShow.replace(/([\+\-\*\/])/g, (match, operator, offset, fullString) => {
            // If it's a minus at the start of the string, or after another operator (possibly with space), it's a negative sign, not a spaced operator
            if (operator === '-') {
                if (offset === 0) return '-'; // Negative at start
                const charBefore = fullString.charAt(offset - 1);
                const charBeforeTrimmed = fullString.substring(0, offset).trim().slice(-1);
                if (charBefore === ' ' && ['+', '-', '*', '/'].includes(charBeforeTrimmed) ) { // e.g., "5 * -", "5 + -"
                    return '-';
                }
                 if (['e','E'].includes(charBefore)) return '-'; // scientific notation like 1e-5
            }
            return ` ${visualOperatorMap[operator] || operator} `;
        }).replace(/  +/g, ' ').trim(); // Consolidate spaces and trim


        // Auto-adjust font size
        const maxLengthBeforeShrink = 10;
        const baseFontSize = 3.2; // em
        const minFontSize = 1.5;  // em
        let newFontSize = baseFontSize;
        if (displayToShow.length > maxLengthBeforeShrink) {
            newFontSize = Math.max(minFontSize, baseFontSize - (displayToShow.length - maxLengthBeforeShrink) * 0.13);
        }
        displayElement.style.fontSize = `${newFontSize}em`;
        displayElement.value = displayToShow;
        displayElement.scrollLeft = displayElement.scrollWidth;
    }

    function appendToDisplay(value) {
        const operators = ['/', '*', '-', '+'];
        const lastCharRaw = currentDisplayString.slice(-1); // Last raw char for logic

        if (currentDisplayString === "Error") {
            currentDisplayString = "0"; // Reset from error
        }

        if (calculationDone) {
            if (operators.includes(value)) {
                // currentDisplayString holds the result, so append the new operator
            } else if (value === '.') {
                currentDisplayString = "0"; // Start new number "0."
            } else { // Number pressed after result
                currentDisplayString = ""; // Start new calculation
            }
            calculationDone = false;
        }

        if (currentDisplayString === "0" && !operators.includes(value) && value !== '.') {
            currentDisplayString = ""; // Remove leading "0" if a number is typed
        }

        // Logic for appending numbers and operators
        if (operators.includes(value)) {
            if (currentDisplayString === "" && value === '-') {
                currentDisplayString = "-"; // Allow starting with a negative
            } else if (currentDisplayString === "" || currentDisplayString === "-") {
                // Don't append other operators if display is empty or just a minus
                if (currentDisplayString === "-" && value === "-") currentDisplayString = ""; // -- becomes empty
                else return;
            } else if (operators.includes(lastCharRaw)) {
                // Replace last raw operator if another is pressed, unless it's for a negative
                if (value === '-' && lastCharRaw !== '-' && !currentDisplayString.endsWith('--')) {
                     currentDisplayString += value; // Allow "5 * -2"
                } else {
                     currentDisplayString = currentDisplayString.slice(0, -1) + value; // Replace "+", "*", "/" or "--"
                }
            } else {
                currentDisplayString += value;
            }
        } else if (value === '.') {
            const segments = currentDisplayString.split(/[\+\-\*\/]/);
            const lastSegment = segments[segments.length - 1];
            if (!lastSegment.includes('.')) {
                if (currentDisplayString === "" || operators.includes(lastCharRaw) || currentDisplayString.endsWith(' ')) {
                    currentDisplayString += (currentDisplayString === "" || currentDisplayString === "-") ? "0." : (operators.includes(lastCharRaw) ? "0." : ".");
                } else {
                    currentDisplayString += ".";
                }
            }
        } else { // It's a number
            currentDisplayString += value;
        }
        updateDisplay();
    }

    function evaluateExpression() {
        if (currentDisplayString === "Error" || currentDisplayString === "" || currentDisplayString === "-") return;

        let expressionToEvaluate = currentDisplayString;
        // Convert visual operators back to internal ones if updateDisplay adds them visually
        // but currentDisplayString should hold raw operators mostly.
        // The main conversion is for eval safety and consistency.

        // Remove trailing operator before evaluation, carefully
        const operators = ['/', '*', '-', '+'];
        let lastCharForEval = expressionToEvaluate.slice(-1);
        while (operators.includes(lastCharForEval) && expressionToEvaluate.length > 0) {
            // Check if it's "X op -" (like "5 * -") which is valid for eval
            if (lastCharForEval === '-' && expressionToEvaluate.length > 1 && operators.includes(expressionToEvaluate.slice(-2, -1))) {
                break; // Keep it as it's likely a negative number indicator
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
                result = parseFloat(result.toFixed(10)); // Round for precision
                addToHistory(`${currentDisplayString.replace(/\*/g, '×').replace(/\//g, '÷')} = ${result}`);
                currentDisplayString = String(result);
            }
        } catch (e) {
            currentDisplayString = "Error";
        }
        calculationDone = true;
        updateDisplay();
    }

    function clearAllDisplay() {
        currentDisplayString = "0";
        calculationDone = false;
        updateDisplay();
    }

    function deleteLastFromDisplay() {
        if (currentDisplayString === "Error" || calculationDone) {
            clearAllDisplay();
            return;
        }

        // Simpler delete: just remove the last raw character
        if (currentDisplayString.length > 0) {
            currentDisplayString = currentDisplayString.slice(0, -1);
        }

        if (currentDisplayString === "" || currentDisplayString === "-") {
            currentDisplayString = "0";
        }
        updateDisplay();
    }

    function toggleInputSign() {
        if (currentDisplayString === "Error") return;
        if (calculationDone) { // If a result is shown, toggle its sign
            let num = parseFloat(currentDisplayString);
            if (!isNaN(num) && num !== 0) {
                currentDisplayString = String(num * -1);
            }
            calculationDone = false; // Allow continuing calculation
            updateDisplay();
            return;
        }

        // Try to toggle the sign of the last number segment
        // This regex is complex: it tries to find a number at the end, possibly preceded by an operator or start of string
        const match = currentDisplayString.match(/(?:^|[\+\-\*\/])(-?\d+\.?\d*)$/);
        if (match) {
            let prefix = currentDisplayString.substring(0, match.index + (match[1].startsWith('-') && match.index > 0 && /[\+\-\*\/]/.test(currentDisplayString[match.index-1]) ? 1 : (match[1].startsWith('-') && match.index === 0 ? 0 : (match[1].length - match[2].length))  ) );
            let numberPart = match[match.length -1]; // The last captured group is the number itself without operator

            if(match[0].startsWith('/') || match[0].startsWith('*') || match[0].startsWith('+') || match[0].startsWith('-')){
                 if(match.index > 0 || (match[0].startsWith('-') && match.index === 0 && numberPart.startsWith('-') ) ) {
                    // if match[0] starts with operator, prefix should include it
                    prefix = currentDisplayString.substring(0, match.index + 1);
                    numberPart = match[0].substring(1);
                 }
            }


            let num = parseFloat(numberPart);

            if (num > 0) {
                currentDisplayString = prefix + `-${numberPart}`;
            } else if (num < 0) {
                currentDisplayString = prefix + numberPart.substring(1); // Remove leading '-'
            } else { // num is 0 or -0
                // If it was "0", make it "-" to start typing a negative number
                // If it was "-0" or just "-", make it "0"
                if (numberPart === "0") {
                    currentDisplayString = prefix + "-";
                } else { // was "-" or "-0"
                     currentDisplayString = prefix + (prefix.endsWith("/") || prefix.endsWith("*") ? "0" : ""); // if 5 * -, make it 5 * 0
                     if (prefix === "" && (numberPart === "-" || numberPart === "-0")) currentDisplayString = "0";
                }
            }
        } else if (!isNaN(parseFloat(currentDisplayString))) { // Whole string is a number
            let num = parseFloat(currentDisplayString);
            if (num !== 0) currentDisplayString = String(num * -1);
        }
        updateDisplay();
    }


    function applyPercentage() {
        if (currentDisplayString === "Error") return;
        try {
            // This attempts to evaluate the current expression and take % of the result.
            // For context like "X + Y%", a more advanced parser is needed.
            // This is a simplified "percent of current value".
            let expressionToEval = currentDisplayString.replace(/×/g, '*').replace(/÷/g, '/');
            const operators = ['/', '*', '-', '+'];
            if (operators.includes(expressionToEval.trim().slice(-1))) {
                expressionToEval = expressionToEval.trim().slice(0, -1).trim();
            }
            if(expressionToEval === "" || expressionToEval === "-") return;

            let value = eval(expressionToEval);
            let result = value / 100;
            result = parseFloat(result.toFixed(10));

            addToHistory(`${currentDisplayString.replace(/\*/g, '×').replace(/\//g, '÷')} % = ${result}`);
            currentDisplayString = String(result);
            calculationDone = true;
            updateDisplay();
        } catch (e) {
            currentDisplayString = "Error";
            updateDisplay();
        }
    }

    function applySquareRoot() {
        if (currentDisplayString === "Error") return;
        try {
            let expressionToEval = currentDisplayString.replace(/×/g, '*').replace(/÷/g, '/');
            const operators = ['/', '*', '-', '+'];
             if (operators.includes(expressionToEval.trim().slice(-1))) {
                expressionToEval = expressionToEval.trim().slice(0, -1).trim();
            }
            if(expressionToEval === "" || expressionToEval === "-") { currentDisplayString = "Error"; updateDisplay(); return;}


            let num = eval(expressionToEval);
            if (num < 0) {
                currentDisplayString = "Error";
            } else {
                let result = Math.sqrt(num);
                result = parseFloat(result.toFixed(10));
                addToHistory(`√(${currentDisplayString.replace(/\*/g, '×').replace(/\//g, '÷')}) = ${result}`);
                currentDisplayString = String(result);
            }
            calculationDone = true;
            updateDisplay();
        } catch (e) {
            currentDisplayString = "Error";
            updateDisplay();
        }
    }

    // Event Listener for Buttons
    buttonsGrid.addEventListener('click', (event) => {
        const target = event.target.closest('button'); // Ensure we get the button if icon inside is clicked
        if (!target) return;

        const action = target.dataset.action;
        const value = target.dataset.value;

        if (value) { // Number, operator, or decimal
            appendToDisplay(value);
        } else if (action) {
            switch (action) {
                case 'clear':       clearAllDisplay(); break;
                case 'delete':      deleteLastFromDisplay(); break;
                case 'equals':      evaluateExpression(); break;
                case 'toggle-sign': toggleInputSign(); break;
                case 'percentage':  applyPercentage(); break;
                case 'sqrt':        applySquareRoot(); break;
                case 'clear-history': clearHistoryDisplay(); break;
            }
        }
    });

    // Keyboard Support
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        if (event.metaKey || event.ctrlKey) {
            if (['c', 'v', 'x', 'a', 'z', 'y'].includes(key.toLowerCase())) return;
        }
        let handled = true;

        if (key >= '0' && key <= '9') appendToDisplay(key);
        else if (key === '.') appendToDisplay('.');
        else if (key === '+') appendToDisplay('+');
        else if (key === '-') appendToDisplay('-');
        else if (key === '*') appendToDisplay('*');
        else if (key === '/') appendToDisplay('/');
        else if (key === 'Enter' || key === '=') evaluateExpression();
        else if (key === 'Backspace') deleteLastFromDisplay();
        else if (key === 'Escape') clearAllDisplay();
        else if (key.toLowerCase() === 'c' && !event.shiftKey) clearAllDisplay();
        else if (key === '%') applyPercentage();
        else if (key.toLowerCase() === 's') applySquareRoot(); // 's' for sqrt
        else handled = false;

        if (handled) event.preventDefault();
    });

    // History Functions
    function addToHistory(entry) {
        history.unshift(entry);
        if (history.length > 20) history.pop();
        updateHistoryDOM();
    }
    function updateHistoryDOM() {
        historyLogElement.innerHTML = "";
        history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.textContent = item;
            historyLogElement.appendChild(div);
        });
    }
    function clearHistoryDisplay() {
        history = [];
        updateHistoryDOM();
    }

    // Interactive Highlight for Buttons
    document.querySelectorAll('.interactive-highlight').forEach(button => {
        const originalBgImage = getComputedStyle(button).backgroundImage;
        const originalBgColor = getComputedStyle(button).backgroundColor;
        button.dataset.originalBgImage = originalBgImage;
        button.dataset.originalBgColor = originalBgColor;

        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const highlight = getComputedStyle(document.documentElement).getPropertyValue('--mouse-follow-highlight').trim();
            const dynamicGradient = `radial-gradient(circle at ${x}px ${y}px, ${highlight} 0%, transparent 75%)`;
            
            let finalBgImage = dynamicGradient;
            if (originalBgImage && originalBgImage !== 'none') {
                finalBgImage = `${dynamicGradient}, ${originalBgImage}`;
            }
            button.style.backgroundImage = finalBgImage;
            button.style.backgroundColor = originalBgColor;
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundImage = button.dataset.originalBgImage;
            button.style.backgroundColor = button.dataset.originalBgColor;
        });
    });

    updateDisplay(); // Initial display update
    updateHistoryDOM(); // Initial history update
});