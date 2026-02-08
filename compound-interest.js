let chartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('compoundForm').addEventListener('submit', handleCalculation);
});

function handleCalculation(e) {
    e.preventDefault();

    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const monthlyAdd = parseFloat(document.getElementById('monthlyAdd').value) || 0;
    const annualRate = parseFloat(document.getElementById('rate').value) || 0;
    const compounding = parseInt(document.getElementById('compounding').value);
    const years = parseInt(document.getElementById('years').value) || 0;

    if (years <= 0) { alert('Please enter a valid investment period.'); return; }

    const rate = annualRate / 100;
    const periodicRate = rate / compounding;
    const yearlyData = [];

    let balance = principal;
    let totalContributions = principal;
    let totalInterest = 0;

    for (let year = 1; year <= years; year++) {
        for (let period = 0; period < compounding; period++) {
            // Add monthly contributions proportionally within each compounding period
            const monthsPerPeriod = 12 / compounding;
            for (let m = 0; m < monthsPerPeriod; m++) {
                balance += monthlyAdd;
                totalContributions += monthlyAdd;
            }
            // Apply interest for this compounding period
            const interest = balance * periodicRate;
            balance += interest;
            totalInterest += interest;
        }

        yearlyData.push({
            year,
            contributions: totalContributions,
            interest: totalInterest,
            balance: balance
        });
    }

    const interestPercent = balance > 0 ? ((totalInterest / balance) * 100).toFixed(1) : '0';

    document.getElementById('futureValue').textContent = formatCurrency(balance);
    document.getElementById('totalContributions').textContent = formatCurrency(totalContributions);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('interestPercent').textContent = interestPercent + '%';

    updateChart(yearlyData);
    updateTable(yearlyData);

    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function updateChart(data) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.map(d => 'Year ' + d.year),
            datasets: [
                {
                    label: 'Total Value',
                    data: data.map(d => d.balance),
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Total Contributions',
                    data: data.map(d => d.contributions),
                    borderColor: 'rgba(118, 75, 162, 1)',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
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
                        label: ctx => ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y)
                    }
                }
            }
        }
    });
}

function updateTable(data) {
    const tbody = document.getElementById('growthBody');
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
