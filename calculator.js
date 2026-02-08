let chartInstance = null;
let latestResults = null;

document.addEventListener('DOMContentLoaded', function() {
    const loanForm = document.getElementById('loanForm');
    const showAllCheckbox = document.getElementById('showAllPayments');

    if (loanForm) loanForm.addEventListener('submit', handleCalculation);
    if (showAllCheckbox) showAllCheckbox.addEventListener('change', updateAmortizationTable);

    // Update down payment percentage hint
    const homePrice = document.getElementById('homePrice');
    const downPayment = document.getElementById('downPayment');
    if (homePrice && downPayment) {
        homePrice.addEventListener('input', updateDownPaymentHint);
        downPayment.addEventListener('input', updateDownPaymentHint);
        downPayment.addEventListener('input', updatePmiHint);
        homePrice.addEventListener('input', updatePmiHint);
    }

    setDefaultDate();
});

function updateDownPaymentHint() {
    const price = parseFloat(document.getElementById('homePrice').value) || 0;
    const down = parseFloat(document.getElementById('downPayment').value) || 0;
    const hint = document.getElementById('downPaymentPercent');
    if (hint && price > 0) {
        hint.textContent = ((down / price) * 100).toFixed(1) + '% of home price';
    }
}

function updatePmiHint() {
    const price = parseFloat(document.getElementById('homePrice').value) || 0;
    const down = parseFloat(document.getElementById('downPayment').value) || 0;
    const pmiInput = document.getElementById('pmi');
    const hint = document.getElementById('pmiHint');
    if (hint && price > 0) {
        if (down / price < 0.2) {
            hint.textContent = 'Down payment is under 20% — PMI is likely required';
            hint.style.color = '#e53e3e';
        } else {
            hint.textContent = 'Down payment is 20%+ — PMI typically not required';
            hint.style.color = '#38a169';
        }
    }
}

function handleCalculation(e) {
    e.preventDefault();

    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTermYears = parseInt(document.getElementById('loanTerm').value);
    const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const pmi = parseFloat(document.getElementById('pmi').value) || 0;
    const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;
    const startDateInput = document.getElementById('startDate').value;

    if (homePrice <= 0) {
        alert('Please enter a valid home price.');
        return;
    }
    if (downPayment >= homePrice) {
        alert('Down payment must be less than the home price.');
        return;
    }

    const loanAmount = homePrice - downPayment;
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    // Calculate principal & interest
    let monthlyPI;
    if (monthlyRate === 0) {
        monthlyPI = loanAmount / numberOfPayments;
    } else {
        monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = homeInsurance / 12;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + pmi + hoaFees;

    const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;

    const schedule = generateSchedule(loanAmount, monthlyRate, monthlyPI, numberOfPayments, startDateInput);

    latestResults = {
        monthlyPI,
        monthlyTax,
        monthlyInsurance,
        pmi,
        hoaFees,
        totalMonthly,
        totalInterest,
        numberOfPayments,
        loanAmount,
        schedule
    };

    displayResults(latestResults);

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

function generateSchedule(principal, monthlyRate, monthlyPayment, numberOfPayments, startDate) {
    const schedule = [];
    let balance = principal;

    let currentDate;
    if (startDate) {
        const [year, month] = startDate.split('-');
        currentDate = new Date(year, month - 1, 1);
    } else {
        currentDate = new Date();
        currentDate.setDate(1);
    }

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        if (balance < 0) balance = 0;

        schedule.push({
            paymentNumber: i,
            date: new Date(currentDate),
            payment: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingBalance: balance
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return schedule;
}

function displayResults(results) {
    document.getElementById('totalMonthly').textContent = formatCurrency(results.totalMonthly);
    document.getElementById('monthlyPayment').textContent = formatCurrency(results.monthlyPI);
    document.getElementById('monthlyTax').textContent = formatCurrency(results.monthlyTax);
    document.getElementById('monthlyInsurance').textContent = formatCurrency(results.monthlyInsurance);
    document.getElementById('monthlyPmiHoa').textContent = formatCurrency(results.pmi + results.hoaFees);
    document.getElementById('totalInterest').textContent = formatCurrency(results.totalInterest);

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
        schedule.forEach(p => tbody.appendChild(createTableRow(p)));
    } else {
        schedule.forEach((p, i) => {
            if ((i + 1) % 12 === 0 || i === 0) {
                tbody.appendChild(createTableRow(p));
            }
        });
        const last = schedule[schedule.length - 1];
        if (schedule.length % 12 !== 0) {
            tbody.appendChild(createTableRow(last));
        }
    }
}

function createTableRow(payment) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${payment.paymentNumber}</td>
        <td>${formatDate(payment.date)}</td>
        <td>${formatCurrency(payment.payment)}</td>
        <td>${formatCurrency(payment.principalPayment)}</td>
        <td>${formatCurrency(payment.interestPayment)}</td>
        <td>${formatCurrency(payment.remainingBalance)}</td>
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
            labels: ['Principal & Interest', 'Property Tax', 'Insurance', 'PMI + HOA'],
            datasets: [{
                data: [
                    results.monthlyPI,
                    results.monthlyTax,
                    results.monthlyInsurance,
                    results.pmi + results.hoaFees
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + pct + '%)';
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

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short'
    }).format(date);
}

function setDefaultDate() {
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        startDateInput.value = `${year}-${month}`;
    }
}
