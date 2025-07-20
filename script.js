document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const balanceElement = document.getElementById('balance');
    const incomeElement = document.getElementById('money-plus');
    const expenseElement = document.getElementById('money-minus');
    const transactionList = document.getElementById('transaction-list');
    const transactionForm = document.getElementById('transaction-form');
    const textInput = document.getElementById('transaction-text');
    const amountInput = document.getElementById('transaction-amount');
    const categoryInput = document.getElementById('transaction-category');
    const clearBtn = document.getElementById('clear-all');
    const currencySelector = document.getElementById('currency-selector');
    const chartPlaceholder = document.getElementById('chart-placeholder');
    const emptyState = document.getElementById('empty-state');
    
    // Chart setup
    const ctx = document.getElementById('financeChart').getContext('2d');
    let financeChart;
    
    // Category data
    const categories = {
    food: { emoji: '🍔', color: '#4CC9F0' },
    transport: { emoji: '🚗', color: '#F72585' },
    shopping: { emoji: '🛍️', color: '#B5179E' },
    housing: { emoji: '🏠', color: '#7209B7' },
    utilities: { emoji: '💡', color: '#560BAD' },
    health: { emoji: '🏥', color: '#4895EF' },
    education: { emoji: '📚', color: '#4361EE' },
    entertainment: { emoji: '🎬', color: '#3F37C9' },
    salary: { emoji: '💰', color: '#4AD66D' },
    investment: { emoji: '📈', color: '#38B000' },
    gifts: { emoji: '🎁', color: '#FF9E00' },
    other: { emoji: '📌', color: '#6C757D' }
};
    
    // Initialize app
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let currency = localStorage.getItem('currency') || 'Rs.';
    
    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Initialize chart
    function initChart() {
        financeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        updateChart();
    }
    
    // Update chart
    function updateChart() {
        const categoryTotals = {};
        
        // Calculate totals by category
        transactions.forEach(transaction => {
            if (transaction.amount < 0) { // Only expenses for the chart
                const category = transaction.category;
                categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
            }
        });
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const backgroundColors = labels.map(label => categories[label]?.color || '#4361ee');
        
        financeChart.data.labels = labels;
        financeChart.data.datasets[0].data = data;
        financeChart.data.datasets[0].backgroundColor = backgroundColors;
        financeChart.update();
        
        // Show/hide placeholder
        if (data.length > 0) {
            chartPlaceholder.style.display = 'none';
        } else {
            chartPlaceholder.style.display = 'flex';
        }
    }
    
    // Update all values
    function updateValues() {
        // Calculate totals
        const amounts = transactions.map(t => t.amount);
        const total = amounts.reduce((acc, item) => acc + item, 0);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
        const expense = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1;
        
        // Update UI with formatted numbers
        balanceElement.textContent = `${currency}${formatNumber(total.toFixed(2))}`;
        incomeElement.textContent = `+${currency}${formatNumber(income.toFixed(2))}`;
        expenseElement.textContent = `-${currency}${formatNumber(expense.toFixed(2))}`;
    }
    
    // Add transaction to DOM
function addTransactionDOM(transaction) {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = transaction.id;
    
    const isIncome = transaction.amount > 0;
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';
    const category = categories[transaction.category] || categories.other;
    const formattedAmount = formatNumber(Math.abs(transaction.amount).toFixed(2));
    
    li.innerHTML = `
        <div class="transaction-content">
            <span class="category-icon">${category.emoji}</span>
            <span class="transaction-text">${transaction.text}</span>
        </div>
        <span class="transaction-amount ${amountClass}">
            ${sign}${currency}${formattedAmount}
        </span>
        <div class="transaction-actions">
            <button class="action-btn edit-btn" title="Edit transaction">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete transaction">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    transactionList.appendChild(li);
    
    // Add event listeners
    li.querySelector('.edit-btn').addEventListener('click', () => editTransaction(transaction.id));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(transaction.id));
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        renderTransactions();
    }
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Fill the form with the transaction data
    textInput.value = transaction.text;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    
    // Remove the transaction being edited
    transactions = transactions.filter(t => t.id !== id);
    
    // Focus on the amount field for quick editing
    amountInput.focus();
}
    
    // Render all transactions
    function renderTransactions() {
        transactionList.innerHTML = '';
        
        if (transactions.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            transactions.forEach(addTransactionDOM);
        }
        
        updateValues();
        updateChart();
    }
    
    // Add new transaction
function addTransaction(e) {
    e.preventDefault();
    
    if (!textInput.value.trim() || !amountInput.value) {
        alert('Please enter description and amount');
        return;
    }
    
    const transaction = {
        id: Date.now(), // New ID for new transactions
        text: textInput.value.trim(),
        amount: +amountInput.value,
        category: categoryInput.value,
        date: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    
    // Reset form
    transactionForm.reset();
    textInput.focus();
}
    
    // Clear all transactions
    function clearTransactions() {
        if (transactions.length === 0 || !confirm('Are you sure you want to clear all transactions?')) {
            return;
        }
        
        transactions = [];
        saveTransactions();
        renderTransactions();
    }
    
    // Save to localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    // Handle currency change
    function handleCurrencyChange() {
        currency = currencySelector.value;
        localStorage.setItem('currency', currency);
        renderTransactions();
    }
    
    // Initialize
    initChart();
    renderTransactions();
    
    // Event listeners
    transactionForm.addEventListener('submit', addTransaction);
    clearBtn.addEventListener('click', clearTransactions);
    currencySelector.addEventListener('change', handleCurrencyChange);
    
    // Set saved currency
    currencySelector.value = currency;
});