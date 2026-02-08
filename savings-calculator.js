let chartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('savingsForm').addEventListener('submit', handleCalculation);
});

function handleCalculation(e) {
    e.preventDefault();

    const initial = parseFloat(document.getElementById('initialDeposit').value) || 0;
    const monthly = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const annualRate = parseFloat(document.getElementById('annualRate').value) || 0;
    const years = parseInt(document.getElementById('years').value) || 0;

    if (years <= 0) { alert('Please enter a valid time period.'); return; }

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    const yearlyData = [];
    let balance = initial;
    let totalContributions = initial;
    let totalInterest = 0;

    for (let month = 1; month <= totalMonths; month++) {
        const interest = balance * monthlyRate;
        balance += interest + monthly;
        totalInterest += interest;
        totalContributions += monthly;

        if (month % 12 === 0) {
            yearlyData.push({
                year: month / 12,
                contributions: totalContributions,
                interest: totalInterest,
                balance: balance
            });
        }
    }

    const futureValue = balance;
    const growthPercent = totalContributions > 0 ? ((totalInterest / totalContributions) * 100).toFixed(1) : '0';

    document.getElementById('futureValue').textContent = formatCurrency(futureValue);
    document.getElementById('totalContributions').textContent = formatCurrency(totalContributions);
    document.getElementById('interestEarned').textContent = formatCurrency(totalInterest);
    document.getElementById('effectiveGrowth').textContent = growthPercent + '%';

    updateChart(yearlyData);
    updateTable(yearlyData);

    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function updateChart(data) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.map(d => 'Year ' + d.year),
            datasets: [
                {
                    label: 'Contributions',
                    data: data.map(d => d.contributions),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Interest Earned',
                    data: data.map(d => d.interest),
                    backgroundColor: 'rgba(102, 234, 150, 0.8)',
                    borderColor: 'rgba(102, 234, 150, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { callback: v => '$' + v.toLocaleString() }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y)
                    }
                }
            }
        }
    });
}

function updateTable(data) {
    const tbody = document.getElementById('yearlyBody');
    tbody.innerHTML = '';

    data.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${d.year}</td>
            <td>${formatCurrency(d.contributions)}</td>
            <td>${formatCurrency(d.interest)}</td>
            <td>${formatCurrency(d.balance)}</td>
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
