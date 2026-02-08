let chartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('ccForm').addEventListener('submit', handleCalculation);
});

function handleCalculation(e) {
    e.preventDefault();

    const balance = parseFloat(document.getElementById('balance').value) || 0;
    const apr = parseFloat(document.getElementById('apr').value) || 0;
    const minPayment = parseFloat(document.getElementById('minPayment').value) || 0;
    const extraPayment = parseFloat(document.getElementById('extraPayment').value) || 0;

    if (balance <= 0) { alert('Please enter a valid balance.'); return; }
    if (minPayment <= 0) { alert('Please enter a valid minimum payment.'); return; }

    const monthlyRate = apr / 100 / 12;
    const totalPayment = minPayment + extraPayment;

    // Check if payment covers at least interest
    const firstMonthInterest = balance * monthlyRate;
    if (totalPayment <= firstMonthInterest) {
        alert('Your payment of ' + formatCurrency(totalPayment) + ' doesn\'t cover the monthly interest of ' + formatCurrency(firstMonthInterest) + '. You need to pay more to reduce the balance.');
        return;
    }

    const result = calculatePayoff(balance, monthlyRate, totalPayment);

    // Calculate minimum-only for comparison
    let comparison = null;
    if (extraPayment > 0) {
        comparison = calculatePayoff(balance, monthlyRate, minPayment);
    }

    displayResults(result, comparison, extraPayment);

    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function calculatePayoff(balance, monthlyRate, payment) {
    const schedule = [];
    let remaining = balance;
    let totalInterest = 0;
    let month = 0;

    while (remaining > 0.01 && month < 600) { // cap at 50 years
        month++;
        const interest = remaining * monthlyRate;
        totalInterest += interest;
        const actualPayment = Math.min(payment, remaining + interest);
        const principal = actualPayment - interest;
        remaining -= principal;
        if (remaining < 0) remaining = 0;

        schedule.push({
            month,
            payment: actualPayment,
            principal,
            interest,
            balance: remaining
        });
    }

    return {
        months: month,
        totalInterest,
        totalPaid: balance + totalInterest,
        schedule
    };
}

function displayResults(result, comparison, extraPayment) {
    const years = Math.floor(result.months / 12);
    const months = result.months % 12;
    let timeStr = '';
    if (years > 0) timeStr += years + (years === 1 ? ' year ' : ' years ');
    if (months > 0) timeStr += months + (months === 1 ? ' month' : ' months');
    if (!timeStr) timeStr = 'Less than 1 month';

    document.getElementById('payoffTime').textContent = timeStr;
    document.getElementById('totalInterest').textContent = formatCurrency(result.totalInterest);
    document.getElementById('totalPaid').textContent = formatCurrency(result.totalPaid);

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + result.months);
    document.getElementById('payoffDate').textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(payoffDate);

    // Show savings comparison if extra payments
    const savingsSection = document.getElementById('savingsComparison');
    if (comparison && extraPayment > 0) {
        const monthsSaved = comparison.months - result.months;
        const savedYears = Math.floor(monthsSaved / 12);
        const savedMonths = monthsSaved % 12;
        let savedStr = '';
        if (savedYears > 0) savedStr += savedYears + (savedYears === 1 ? ' year ' : ' years ');
        if (savedMonths > 0) savedStr += savedMonths + (savedMonths === 1 ? ' month' : ' months');
        if (!savedStr) savedStr = '0 months';

        document.getElementById('timeSaved').textContent = savedStr;
        document.getElementById('interestSaved').textContent = formatCurrency(comparison.totalInterest - result.totalInterest);
        savingsSection.style.display = 'block';
    } else {
        savingsSection.style.display = 'none';
    }

    updateChart(result.schedule);
    updateTable(result.schedule);
}

function updateChart(schedule) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('payoffChart');
    if (!canvas) return;
    if (chartInstance) chartInstance.destroy();

    const labels = [];
    const balanceData = [];

    schedule.forEach((p, i) => {
        if (i % 3 === 0 || i === schedule.length - 1) {
            labels.push('Month ' + p.month);
            balanceData.push(p.balance);
        }
    });

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Remaining Balance',
                data: balanceData,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + v.toLocaleString() }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => 'Balance: ' + formatCurrency(ctx.parsed.y)
                    }
                }
            }
        }
    });
}

function updateTable(schedule) {
    const tbody = document.getElementById('scheduleBody');
    tbody.innerHTML = '';

    schedule.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.month}</td>
            <td>${formatCurrency(p.payment)}</td>
            <td>${formatCurrency(p.principal)}</td>
            <td>${formatCurrency(p.interest)}</td>
            <td>${formatCurrency(p.balance)}</td>
        `;
        tbody.appendChild(row);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(amount);
}
