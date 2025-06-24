document.addEventListener('DOMContentLoaded', () => {
    const displayElement = document.getElementById('main-display');
    const historyLogElement = document.getElementById('history-log');
    const buttonsGrid = document.querySelector('.buttons-grid');

    let currentDisplayValue = "0";
    let firstOperand = null;
    let operator = null;
    let waitingForSecondOperand = false;
    let history = [];

    const visualOperatorMap = {
        '/': '÷',
        '*': '×',
        '-': '-',
        '+': '+'
    };

    function updateDisplay() {
        let displayString = currentDisplayValue;
        if (waitingForSecondOperand && operator) {
            // Show "firstOperand operator " when waiting for the second number
            displayString = `${formatNumber(firstOperand)}${visualOperatorMap[operator]}`;
        } else {
            // Show the current number being typed or the result
            displayString = formatNumber(currentDisplayValue);
        }
        
        // Auto-adjust font size for very long display strings (simple version)
        const maxLengthBeforeShrink = 9; // Max chars at full size
        const baseFontSize = 3.2; // em, from CSS
        const minFontSize = 1.6; // em
        let newFontSize = baseFontSize;

        if (displayString.length > maxLengthBeforeShrink) {
            newFontSize = Math.max(minFontSize, baseFontSize - (displayString.length - maxLengthBeforeShrink) * 0.15);
        }
        displayElement.style.fontSize = `${newFontSize}em`;
        displayElement.value = displayString;
        displayElement.scrollLeft = displayElement.scrollWidth;
    }

    function formatNumber(numStr) {
        if (numStr === null || numStr === undefined) return "0";
        let [integerPart, decimalPart] = String(numStr).split('.');
        // Add commas for thousands separation - basic version
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    }

    function inputDigit(digit) {
        if (currentDisplayValue === "Error") {
            resetCalculator();
        }
        if (waitingForSecondOperand) {
            currentDisplayValue = digit;
            waitingForSecondOperand = false;
        } else {
            currentDisplayValue = currentDisplayValue === "0" ? digit : currentDisplayValue + digit;
        }
    }

    function inputDecimal() {
        if (currentDisplayValue === "Error") resetCalculator();
        if (waitingForSecondOperand) {
            currentDisplayValue = "0.";
            waitingForSecondOperand = false;
            return;
        }
        if (!currentDisplayValue.includes('.')) {
            currentDisplayValue += '.';
        }
    }

    function handleOperator(nextOperator) {
        if (currentDisplayValue === "Error") return;
        const inputValue = parseFloat(currentDisplayValue);

        if (operator && waitingForSecondOperand) { // If user changes operator
            operator = nextOperator;
            return;
        }

        if (firstOperand === null && !isNaN(inputValue)) {
            firstOperand = inputValue;
        } else if (operator && !isNaN(inputValue)) {
            const result = performCalculation(firstOperand, inputValue, operator);
            currentDisplayValue = String(parseFloat(result.toFixed(10)));
            firstOperand = result;
            addToHistory(`${formatNumber(firstOperand_prev)} ${visualOperatorMap[operator_prev]} ${formatNumber(inputValue)} = ${formatNumber(result)}`);
        }
        
        waitingForSecondOperand = true;
        operator = nextOperator;
        // Store for history before they are overwritten
        operator_prev = operator;
        firstOperand_prev = firstOperand;
    }
    let operator_prev = null;
    let firstOperand_prev = null;


    function performCalculation(operand1, operand2, op) {
        switch (op) {
            case '+': return operand1 + operand2;
            case '-': return operand1 - operand2;
            case '*': return operand1 * operand2;
            case '/': return operand2 === 0 ? "Error" : operand1 / operand2;
            default: return operand2;
        }
    }

    function resetCalculator() {
        currentDisplayValue = "0";
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
    }

    function deleteLastDigit() {
        if (waitingForSecondOperand || currentDisplayValue === "Error") return; // Or allow DEL to clear operator
        if (currentDisplayValue.length > 1) {
            currentDisplayValue = currentDisplayValue.slice(0, -1);
        } else {
            currentDisplayValue = "0";
        }
    }
    
    function toggleNumberSign() {
        if (currentDisplayValue === "Error" || currentDisplayValue === "0") return;
        currentDisplayValue = String(parseFloat(currentDisplayValue) * -1);
    }

    function calculatePercentage() {
        if (currentDisplayValue === "Error") return;
        let value = parseFloat(currentDisplayValue);
        if (firstOperand !== null && operator) { // e.g. 100 + 10%
             if (operator === '+' || operator === '-') {
                value = firstOperand * (value / 100);
             } else { // * or /
                value = value / 100;
             }
        } else { // Just 10%
            value = value / 100;
        }
        currentDisplayValue = String(parseFloat(value.toFixed(10)));
        // For simplicity, percentage often finalizes the current input or operation part
        // A full "equals" might be implicitly triggered or value used as second operand
        waitingForSecondOperand = false; // So it can be used as a new number or in calculation
    }

    function calculateSquareRoot() {
        if (currentDisplayValue === "Error") return;
        const value = parseFloat(currentDisplayValue);
        if (value < 0) {
            currentDisplayValue = "Error";
        } else {
            currentDisplayValue = String(parseFloat(Math.sqrt(value).toFixed(10)));
        }
        waitingForSecondOperand = false; // Result is now the current value
        firstOperand = null; // Square root is often a unary operation that finalizes
        operator = null;
    }


    // Event Listener for Buttons
    buttonsGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.matches('button')) {
            return;
        }

        const action = target.dataset.action;
        const value = target.dataset.value;

        if (value) { // Number or operator
            if (['/', '*', '-', '+'].includes(value)) {
                handleOperator(value);
            } else if (value === '.') {
                inputDecimal();
            } else { // Digit
                inputDigit(value);
            }
        } else if (action) { // AC, DEL, =, etc.
            switch (action) {
                case 'clear':
                    resetCalculator();
                    break;
                case 'delete':
                    deleteLastDigit();
                    break;
                case 'equals':
                    if (operator && firstOperand !== null && !waitingForSecondOperand) {
                        const inputValue = parseFloat(currentDisplayValue);
                        const result = performCalculation(firstOperand, inputValue, operator);
                        addToHistory(`${formatNumber(firstOperand)} ${visualOperatorMap[operator]} ${formatNumber(inputValue)} = ${formatNumber(result === "Error" ? result : parseFloat(result.toFixed(10)))}`);
                        currentDisplayValue = String(result === "Error" ? result : parseFloat(result.toFixed(10)));
                        firstOperand = null; // Or result for chained equals
                        operator = null;
                        waitingForSecondOperand = false; // Show result
                    }
                    break;
                case 'toggle-sign':
                    toggleNumberSign();
                    break;
                case 'percentage':
                    calculatePercentage();
                    break;
                case 'sqrt':
                    calculateSquareRoot();
                    break;
                case 'clear-history':
                    clearHistory();
                    break;
            }
        }
        updateDisplay();
    });
    
    // Keyboard Support
    document.addEventListener('keydown', (event) => {
        let handled = true;
        if (event.key >= '0' && event.key <= '9') {
            inputDigit(event.key);
        } else if (event.key === '.') {
            inputDecimal();
        } else if (['/', '*', '-', '+'].includes(event.key)) {
            handleOperator(event.key);
        } else if (event.key === 'Enter' || event.key === '=') {
            if (operator && firstOperand !== null && !waitingForSecondOperand) {
                 const inputValue = parseFloat(currentDisplayValue);
                 const result = performCalculation(firstOperand, inputValue, operator);
                 addToHistory(`${formatNumber(firstOperand)} ${visualOperatorMap[operator]} ${formatNumber(inputValue)} = ${formatNumber(result === "Error" ? result : parseFloat(result.toFixed(10)))}`);
                 currentDisplayValue = String(result === "Error" ? result : parseFloat(result.toFixed(10)));
                 firstOperand = null; operator = null; waitingForSecondOperand = false;
            }
        } else if (event.key === 'Backspace') {
            deleteLastDigit();
        } else if (event.key === 'Escape') {
            resetCalculator();
        } else if (event.key.toLowerCase() === 'c' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
            resetCalculator();
        } else if (event.key === '%') {
            calculatePercentage();
        } else {
            handled = false;
        }

        if (handled) {
            event.preventDefault();
            updateDisplay();
        }
    });

    // History Functions
    function addToHistory(entry) {
        history.unshift(entry);
        if (history.length > 20) history.pop();
        updateHistoryDisplayDOM();
    }
    function updateHistoryDisplayDOM() {
        historyLogElement.innerHTML = "";
        history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.textContent = item;
            historyLogElement.appendChild(div);
        });
    }
    function clearHistory() {
        history = [];
        updateHistoryDisplayDOM();
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
            let dynamicGradient = `radial-gradient(circle at ${x}px ${y}px, ${highlight} 0%, transparent 75%)`;
            
            let finalBgImage = dynamicGradient;
            if (originalBgImage && originalBgImage !== 'none') {
                finalBgImage = `${dynamicGradient}, ${originalBgImage}`;
            }
            button.style.backgroundImage = finalBgImage;
            button.style.backgroundColor = originalBgColor; // Ensure original color is under the highlight
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundImage = button.dataset.originalBgImage;
            button.style.backgroundColor = button.dataset.originalBgColor;
        });
    });

    // Initial Display
    updateDisplay();
    updateHistoryDisplayDOM();
});