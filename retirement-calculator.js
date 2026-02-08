let chartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('retirementForm');
    if (form) form.addEventListener('submit', handleCalculation);
});

function handleCalculation(e) {
    e.preventDefault();

    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const retirementAge = parseInt(document.getElementById('retirementAge').value) || 65;
    const currentSavings = parseFloat(document.getElementById('currentSavings').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 7;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 3;

    if (retirementAge <= currentAge) {
        alert('Retirement age must be greater than your current age.');
        return;
    }

    const yearsToRetirement = retirementAge - currentAge;
    const monthlyReturn = expectedReturn / 100 / 12;
    const totalMonths = yearsToRetirement * 12;

    // Calculate projected savings using future value formula
    // FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
    let projectedSavings;
    if (monthlyReturn === 0) {
        projectedSavings = currentSavings + (monthlyContribution * totalMonths);
    } else {
        projectedSavings = currentSavings * Math.pow(1 + monthlyReturn, totalMonths) +
                           monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
    }

    // Calculate in today's dollars (adjusted for inflation)
    const realValue = projectedSavings / Math.pow(1 + inflationRate / 100, yearsToRetirement);

    // Monthly income using 4% rule
    const annualIncome = projectedSavings * 0.04;
    const monthlyIncome = annualIncome / 12;

    // Total contributions
    const totalContributions = currentSavings + (monthlyContribution * totalMonths);
    const totalGrowth = projectedSavings - totalContributions;

    // Generate yearly growth data for chart
    const yearlyData = generateYearlyData(currentSavings, monthlyContribution, monthlyReturn, yearsToRetirement);

    displayResults({
        projectedSavings,
        projectedSavingsReal: realValue,
        monthlyIncome,
        totalContributions,
        totalGrowth,
        yearsToRetirement,
        yearlyData
    });

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        setTimeout(function() { resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    }
}

function generateYearlyData(currentSavings, monthlyContribution, monthlyReturn, years) {
    const data = [];
    let balance = currentSavings;
    let totalContributed = currentSavings;

    data.push({
        year: 0,
        balance: balance,
        contributions: totalContributed
    });

    for (let year = 1; year <= years; year++) {
        for (let month = 0; month < 12; month++) {
            balance = balance * (1 + monthlyReturn) + monthlyContribution;
        }
        totalContributed += monthlyContribution * 12;

        data.push({
            year: year,
            balance: balance,
            contributions: totalContributed
        });
    }

    return data;
}

function displayResults(results) {
    document.getElementById('projectedSavings').textContent = formatCurrency(results.projectedSavings);
    document.getElementById('projectedSavingsReal').textContent = formatCurrency(results.projectedSavingsReal);
    document.getElementById('monthlyIncome').textContent = formatCurrency(results.monthlyIncome);
    document.getElementById('totalContributions').textContent = formatCurrency(results.totalContributions);
    document.getElementById('totalGrowth').textContent = formatCurrency(results.totalGrowth);
    document.getElementById('yearsToRetirement').textContent = results.yearsToRetirement + ' years';

    // Show track status
    const statusEl = document.getElementById('trackStatus');
    if (statusEl) {
        statusEl.style.display = 'block';
        const monthlyIncomeReal = results.projectedSavingsReal * 0.04 / 12;
        if (monthlyIncomeReal >= 3000) {
            statusEl.className = 'retirement-status retirement-on-track';
            statusEl.innerHTML = '<h3>You\'re on track!</h3><p>Based on your current savings plan, your projected retirement income of ' + formatCurrency(results.monthlyIncome) + '/month (' + formatCurrency(monthlyIncomeReal) + '/month in today\'s dollars) suggests you are building a solid retirement fund. Keep up the great work!</p>';
        } else if (monthlyIncomeReal >= 1500) {
            statusEl.className = 'retirement-status retirement-caution';
            statusEl.innerHTML = '<h3>Getting there, but consider saving more</h3><p>Your projected retirement income of ' + formatCurrency(results.monthlyIncome) + '/month (' + formatCurrency(monthlyIncomeReal) + '/month in today\'s dollars) may not fully cover your expenses. Consider increasing your monthly contributions or delaying retirement to build a larger nest egg.</p>';
        } else {
            statusEl.className = 'retirement-status retirement-behind';
            statusEl.innerHTML = '<h3>You may need to save more</h3><p>Your projected retirement income of ' + formatCurrency(results.monthlyIncome) + '/month (' + formatCurrency(monthlyIncomeReal) + '/month in today\'s dollars) is below recommended levels. Try increasing your monthly contributions, maximizing employer matches, or considering a later retirement age.</p>';
        }
    }

    updateChart(results);
}

function updateChart(results) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('retirementChart');
    if (!canvas) return;

    if (chartInstance) chartInstance.destroy();

    const yearlyData = results.yearlyData;
    const labels = yearlyData.map(function(d) { return 'Year ' + d.year; });
    const balances = yearlyData.map(function(d) { return d.balance; });
    const contributions = yearlyData.map(function(d) { return d.contributions; });

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Balance',
                    data: balances,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Total Contributions',
                    data: contributions,
                    borderColor: 'rgba(118, 75, 162, 1)',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
