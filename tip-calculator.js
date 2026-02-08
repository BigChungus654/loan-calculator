let chartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tipForm');
    const presetButtons = document.querySelectorAll('.tip-preset');
    const customInput = document.getElementById('tipPercentage');

    if (form) form.addEventListener('submit', handleCalculation);

    presetButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            presetButtons.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');

            if (btn.dataset.tip === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.value = btn.dataset.tip;
            }
        });
    });
});

function handleCalculation(e) {
    e.preventDefault();

    const billAmount = parseFloat(document.getElementById('billAmount').value) || 0;
    const tipPercentage = parseFloat(document.getElementById('tipPercentage').value) || 0;
    const numPeople = parseInt(document.getElementById('numPeople').value) || 1;

    if (billAmount <= 0) {
        alert('Please enter a valid bill amount.');
        return;
    }

    if (numPeople < 1) {
        alert('Number of people must be at least 1.');
        return;
    }

    const tipAmount = billAmount * (tipPercentage / 100);
    const totalBill = billAmount + tipAmount;
    const perPerson = totalBill / numPeople;
    const tipPerPerson = tipAmount / numPeople;

    displayResults({
        tipAmount,
        totalBill,
        perPerson,
        tipPerPerson,
        billAmount
    });

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        setTimeout(function() { resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    }
}

function displayResults(results) {
    document.getElementById('tipAmount').textContent = formatCurrency(results.tipAmount);
    document.getElementById('totalBill').textContent = formatCurrency(results.totalBill);
    document.getElementById('perPerson').textContent = formatCurrency(results.perPerson);
    document.getElementById('tipPerPerson').textContent = formatCurrency(results.tipPerPerson);

    updateChart(results);
}

function updateChart(results) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('tipChart');
    if (!canvas) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Bill Amount', 'Tip Amount'],
            datasets: [{
                data: [
                    results.billAmount,
                    results.tipAmount
                ],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)'
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
