let chartInstance = null;

// 2024 Federal Tax Brackets (simplified)
const federalBrackets = {
    single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
    ],
    married: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
    ],
    head: [
        { min: 0, max: 16550, rate: 0.10 },
        { min: 16550, max: 63100, rate: 0.12 },
        { min: 63100, max: 100500, rate: 0.22 },
        { min: 100500, max: 191950, rate: 0.24 },
        { min: 191950, max: 243700, rate: 0.32 },
        { min: 243700, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
    ]
};

const standardDeduction = {
    single: 14600,
    married: 29200,
    head: 21900
};

const SS_RATE = 0.062;
const SS_WAGE_BASE = 168600;
const MEDICARE_RATE = 0.0145;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('paycheckForm');
    const payType = document.getElementById('payType');

    if (form) form.addEventListener('submit', handleCalculation);
    if (payType) payType.addEventListener('change', togglePayType);
});

function togglePayType() {
    const payType = document.getElementById('payType').value;
    const salaryGroup = document.getElementById('salaryGroup');
    const hourlyGroup = document.getElementById('hourlyGroup');
    const hoursGroup = document.getElementById('hoursGroup');

    if (payType === 'salary') {
        salaryGroup.style.display = 'block';
        hourlyGroup.style.display = 'none';
        hoursGroup.style.display = 'none';
    } else {
        salaryGroup.style.display = 'none';
        hourlyGroup.style.display = 'block';
        hoursGroup.style.display = 'block';
    }
}

function handleCalculation(e) {
    e.preventDefault();

    const payType = document.getElementById('payType').value;
    let grossAnnual;

    if (payType === 'salary') {
        grossAnnual = parseFloat(document.getElementById('annualSalary').value) || 0;
    } else {
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
        const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 40;
        grossAnnual = hourlyRate * hoursPerWeek * 52;
    }

    if (grossAnnual <= 0) {
        alert('Please enter a valid pay amount.');
        return;
    }

    const filingStatus = document.getElementById('filingStatus').value;
    const stateTaxRate = parseFloat(document.getElementById('stateTaxRate').value) || 0;

    // Calculate federal tax using progressive brackets
    const deduction = standardDeduction[filingStatus];
    const taxableIncome = Math.max(0, grossAnnual - deduction);
    const federalTax = calculateFederalTax(taxableIncome, filingStatus);

    // State tax (flat rate simplification)
    const stateTax = grossAnnual * (stateTaxRate / 100);

    // FICA
    const socialSecurity = Math.min(grossAnnual, SS_WAGE_BASE) * SS_RATE;
    const medicare = grossAnnual * MEDICARE_RATE;

    const totalDeductions = federalTax + stateTax + socialSecurity + medicare;
    const netAnnual = grossAnnual - totalDeductions;

    displayResults({
        grossAnnual,
        federalTax,
        stateTax,
        socialSecurity,
        medicare,
        netAnnual
    });

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        setTimeout(function() { resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    }
}

function calculateFederalTax(taxableIncome, filingStatus) {
    const brackets = federalBrackets[filingStatus];
    let tax = 0;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        if (taxableIncome <= bracket.min) break;

        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        tax += taxableInBracket * bracket.rate;
    }

    return tax;
}

function displayResults(results) {
    document.getElementById('grossAnnual').textContent = formatCurrency(results.grossAnnual);
    document.getElementById('federalTax').textContent = formatCurrency(results.federalTax);
    document.getElementById('stateTax').textContent = formatCurrency(results.stateTax);
    document.getElementById('socialSecurity').textContent = formatCurrency(results.socialSecurity);
    document.getElementById('medicare').textContent = formatCurrency(results.medicare);
    document.getElementById('netAnnual').textContent = formatCurrency(results.netAnnual);

    document.getElementById('netMonthly').textContent = formatCurrency(results.netAnnual / 12);
    document.getElementById('netBiweekly').textContent = formatCurrency(results.netAnnual / 26);
    document.getElementById('netWeekly').textContent = formatCurrency(results.netAnnual / 52);

    updateChart(results);
}

function updateChart(results) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('paycheckChart');
    if (!canvas) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Take-Home Pay', 'Federal Tax', 'State Tax', 'Social Security', 'Medicare'],
            datasets: [{
                data: [
                    results.netAnnual,
                    results.federalTax,
                    results.stateTax,
                    results.socialSecurity,
                    results.medicare
                ],
                backgroundColor: [
                    'rgba(102, 234, 150, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(234, 102, 102, 0.8)',
                    'rgba(234, 182, 102, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 234, 150, 1)',
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(234, 102, 102, 1)',
                    'rgba(234, 182, 102, 1)'
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
