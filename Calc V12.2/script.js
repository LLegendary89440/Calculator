document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const displayElement = document.getElementById('main-display');
    const historyLogElement = document.getElementById('history-log');
    const buttonsGrid = document.querySelector('.buttons-grid');
    const themeSwitcherContainer = document.querySelector('.theme-switcher');

    // --- State Variables ---
    let currentDisplayString = "0";
    let calculationDone = false;
    let history = [];

    // --- Core Logic (Unchanged) ---
    function updateDisplay() {
        // Format for readability: add spaces, visual operators
        const visualString = currentDisplayString
            .replace(/(?<!e)([\+\-\*\/])/g, ' $1 ') // Add spaces around operators, but not for e-notation
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/  +/g, ' ')
            .trim();

        // Auto-adjust font size for long expressions
        const baseFontSize = 3.2; // em
        const minFontSize = 1.4; // em
        let newFontSize = baseFontSize;
        if (visualString.length > 9) {
            newFontSize = Math.max(minFontSize, baseFontSize - (visualString.length - 9) * 0.15);
        }
        displayElement.style.fontSize = `${newFontSize}em`;
        displayElement.value = visualString;
        displayElement.scrollLeft = displayElement.scrollWidth;
    }
    function handleInput(value) {
        const operators = ['/', '*', '-', '+'];
        const lastChar = currentDisplayString.slice(-1);
        if (currentDisplayString === "Error") { currentDisplayString = "0"; }
        if (calculationDone) { if (operators.includes(value)) {} else { currentDisplayString = "0"; } calculationDone = false; }
        if (currentDisplayString === "0" && !operators.includes(value) && value !== '.') { currentDisplayString = value; }
        else if (operators.includes(value)) {
            if (operators.includes(lastChar)) { if (value === '-' && lastChar !== '-') { currentDisplayString += value; } else { currentDisplayString = currentDisplayString.slice(0, -1) + value; } }
            else { currentDisplayString += value; }
        } else if (value === '.') {
            const segments = currentDisplayString.split(/[\+\-\*\/]/);
            if (!segments[segments.length - 1].includes('.')) { currentDisplayString += value; }
        } else { currentDisplayString += value; }
        updateDisplay();
    }
    function evaluateExpression() {
        if (currentDisplayString === "Error") return; let expression = currentDisplayString; const lastChar = expression.slice(-1);
        if (['/', '*', '-', '+'].includes(lastChar)) { if (!(lastChar === '-' && ['/', '*', '-', '+'].includes(expression.slice(-2,-1)))) { expression = expression.slice(0, -1); } }
        if (expression === "") { currentDisplayString = "0"; updateDisplay(); return; }
        try {
            // eslint-disable-next-line no-eval
            let result = eval(expression);
            if (!isFinite(result) || isNaN(result)) { throw new Error("Invalid calculation"); }
            result = parseFloat(result.toFixed(10));
            addToHistory(`${currentDisplayString.replace(/\*/g,'×').replace(/\//g,'÷')} = ${result}`);
            currentDisplayString = String(result); calculationDone = true;
        } catch (error) { currentDisplayString = "Error"; }
        updateDisplay();
    }
    function clearAll() { currentDisplayString = "0"; calculationDone = false; updateDisplay(); }
    function deleteLast() {
        if (currentDisplayString === "Error" || calculationDone) { clearAll(); return; }
        currentDisplayString = currentDisplayString.slice(0, -1);
        if (currentDisplayString === "") { currentDisplayString = "0"; } updateDisplay();
    }
    function applyUnaryFunction(func, historySymbol) {
        if (currentDisplayString === "Error") return; try {
        let value = eval(currentDisplayString.replace(/×/g,'*').replace(/÷/g,'/'));
        let result = func(value); if (isNaN(result) || !isFinite(result)) throw new Error("Invalid result");
        result = parseFloat(result.toFixed(10)); addToHistory(`${historySymbol}(${currentDisplayString}) = ${result}`);
        currentDisplayString = String(result); calculationDone = true;
        } catch (error) { currentDisplayString = "Error"; } updateDisplay();
    }
    function toggleSign() { applyUnaryFunction(v => v * -1, "negate"); }
    function percentage() { applyUnaryFunction(v => v / 100, "%"); }
    function squareRoot() { applyUnaryFunction(v => { if (v < 0) return NaN; return Math.sqrt(v); }, "√"); }

    // --- History (Unchanged) ---
    function addToHistory(entry) { history.unshift(entry); if (history.length > 20) history.pop(); updateHistoryDOM(); }
    function updateHistoryDOM() { historyLogElement.innerHTML = ""; history.forEach(item => { const div = document.createElement('div'); div.classList.add('history-item'); div.textContent = item; historyLogElement.appendChild(div); }); }
    function clearHistory() { history = []; updateHistoryDOM(); }

    // --- Theme Switcher (Unchanged) ---
    function applyTheme(themeName) {
        document.body.className = ''; document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem('calculatorTheme', themeName);
        themeSwitcherContainer.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
        setTimeout(initInteractiveHighlights, 10);
    }
    themeSwitcherContainer.addEventListener('click', (event) => { const target = event.target.closest('.theme-btn'); if (target && target.dataset.theme) applyTheme(target.dataset.theme); });

    // --- Event Listeners Setup (Unchanged) ---
    buttonsGrid.addEventListener('click', (event) => {
        const target = event.target.closest('button'); if (!target) return;
        const action = target.dataset.action; const value = target.dataset.value;
        if (value) handleInput(value);
        else if (action) { const actions = { clear: clearAll, delete: deleteLast, equals: evaluateExpression, 'toggle-sign': toggleSign, percentage: percentage, sqrt: squareRoot, 'clear-history': clearHistory }; if (actions[action]) actions[action](); }
    });
    document.addEventListener('keydown', (event) => {
        if (event.metaKey || event.ctrlKey) return; let handled = true;
        if (event.key >= '0' && event.key <= '9') handleInput(event.key);
        else if (['/', '*', '-', '+', '.'].includes(event.key)) handleInput(event.key);
        else if (event.key === 'Enter' || event.key === '=') evaluateExpression();
        else if (event.key === 'Backspace') deleteLast();
        else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') clearAll();
        else if (event.key === '%') percentage();
        else if (event.key.toLowerCase() === 's') squareRoot();
        else handled = false;
        if (handled) event.preventDefault();
    });

    // --- INTERACTIVE HIGHLIGHT (MODIFIED for radius and robustness) ---
    function initInteractiveHighlights() {
        document.querySelectorAll('.interactive-highlight').forEach(button => {
            button.removeEventListener('mousemove', handleButtonMouseMove);
            button.removeEventListener('mouseleave', handleButtonMouseLeave);
            button.addEventListener('mousemove', handleButtonMouseMove);
            button.addEventListener('mouseleave', handleButtonMouseLeave);
        });
    }

    function handleButtonMouseMove(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set properties directly on the button's style for the pseudo-element to use
        button.style.setProperty('--mouse-x', `${x}px`);
        button.style.setProperty('--mouse-y', `${y}px`);
        button.style.setProperty('--highlight-opacity', '1');
    }

    function handleButtonMouseLeave(e) {
        const button = e.currentTarget;
        // Fade the highlight out instead of removing it instantly
        button.style.setProperty('--highlight-opacity', '0');
    }

    // --- Initial Load ---
    const savedTheme = localStorage.getItem('calculatorTheme') || 'vibrant';
    applyTheme(savedTheme);
    updateDisplay();
    updateHistoryDOM();
});