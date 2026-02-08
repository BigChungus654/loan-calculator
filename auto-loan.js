let chartInstance = null;
let latestResults = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('autoLoanForm');
    const showAllCheckbox = document.getElementById('showAllPayments');

    if (form) form.addEventListener('submit', handleCalculation);
    if (showAllCheckbox) showAllCheckbox.addEventListener('change', updateAmortizationTable);
});

function handleCalculation(e) {
    e.preventDefault();

    const vehiclePrice = parseFloat(document.getElementById('vehiclePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const tradeInValue = parseFloat(document.getElementById('tradeInValue').value) || 0;
    const salesTaxRate = parseFloat(document.getElementById('salesTax').value) || 0;
    const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTermMonths = parseInt(document.getElementById('loanTerm').value);

    if (vehiclePrice <= 0) {
        alert('Please enter a valid vehicle price.');
        return;
    }

    if (downPayment + tradeInValue >= vehiclePrice) {
        alert('Down payment and trade-in value exceed the vehicle price. No loan needed!');
        return;
    }

    const salesTaxAmount = (vehiclePrice - tradeInValue) * (salesTaxRate / 100);
    const amountFinanced = vehiclePrice - downPayment - tradeInValue + salesTaxAmount;
    const monthlyRate = annualRate / 100 / 12;

    let monthlyPayment;
    if (monthlyRate === 0) {
        monthlyPayment = amountFinanced / loanTermMonths;
    } else {
        monthlyPayment = amountFinanced * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
                         (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    }

    const totalCost = monthlyPayment * loanTermMonths + downPayment + tradeInValue;
    const totalInterest = (monthlyPayment * loanTermMonths) - amountFinanced;

    const schedule = generateSchedule(amountFinanced, monthlyRate, monthlyPayment, loanTermMonths);

    latestResults = {
        monthlyPayment,
        totalInterest,
        totalCost,
        amountFinanced,
        salesTaxAmount,
        upfrontCost: downPayment + tradeInValue,
        schedule
    };

    displayResults(latestResults);

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

function generateSchedule(principal, monthlyRate, monthlyPayment, totalPayments) {
    const schedule = [];
    let balance = principal;

    for (let i = 1; i <= totalPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        if (balance < 0) balance = 0;

        schedule.push({
            paymentNumber: i,
            payment: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingBalance: balance
        });
    }

    return schedule;
}

function displayResults(results) {
    document.getElementById('monthlyPayment').textContent = formatCurrency(results.monthlyPayment);
    document.getElementById('totalInterest').textContent = formatCurrency(results.totalInterest);
    document.getElementById('totalCost').textContent = formatCurrency(results.totalCost);
    document.getElementById('amountFinanced').textContent = formatCurrency(results.amountFinanced);
    document.getElementById('salesTaxAmount').textContent = formatCurrency(results.salesTaxAmount);
    document.getElementById('upfrontCost').textContent = formatCurrency(results.upfrontCost);

    updateAmortizationTable();
    updateChart(results);
}

function updateAmortizationTable() {
    if (!latestResults) return;

    const schedule = latestResults.schedule;
    const showAll = document.getElementById('showAllPayments')?.checked || false;
    const tbody = document.getElementById('amortizationBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (showAll) {
        schedule.forEach(p => tbody.appendChild(createRow(p)));
    } else {
        schedule.forEach((p, i) => {
            if ((i + 1) % 12 === 0 || i === 0) {
                tbody.appendChild(createRow(p));
            }
        });
        const last = schedule[schedule.length - 1];
        if (schedule.length % 12 !== 0) {
            tbody.appendChild(createRow(last));
        }
    }
}

function createRow(p) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${p.paymentNumber}</td>
        <td>${formatCurrency(p.payment)}</td>
        <td>${formatCurrency(p.principalPayment)}</td>
        <td>${formatCurrency(p.interestPayment)}</td>
        <td>${formatCurrency(p.remainingBalance)}</td>
    `;
    return row;
}

function updateChart(results) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('paymentChart');
    if (!canvas) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest', 'Sales Tax', 'Down Payment + Trade-In'],
            datasets: [{
                data: [
                    results.amountFinanced - results.salesTaxAmount,
                    results.totalInterest,
                    results.salesTaxAmount,
                    results.upfrontCost
                ],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(234, 102, 102, 0.8)',
                    'rgba(102, 234, 150, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(234, 102, 102, 1)',
                    'rgba(102, 234, 150, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
