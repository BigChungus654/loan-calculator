// Loan Calculator Logic
let chartInstance = null;
let latestResults = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calculator initializing...');

    // Get form and result elements
    const loanForm = document.getElementById('loanForm');
    const showAllPaymentsCheckbox = document.getElementById('showAllPayments');

    // Add event listeners
    if (loanForm) {
        loanForm.addEventListener('submit', handleCalculation);
        console.log('Form event listener added');
    } else {
        console.error('Loan form not found!');
    }

    if (showAllPaymentsCheckbox) {
        showAllPaymentsCheckbox.addEventListener('change', updateAmortizationTable);
    }

    // Set default start date
    setDefaultDate();
});

/**
 * Handle form submission and calculate loan
 */
function handleCalculation(e) {
    e.preventDefault();
    console.log('Calculate button clicked');

    try {
        // Get input values
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const annualRate = parseFloat(document.getElementById('interestRate').value);
        const loanTermYears = parseInt(document.getElementById('loanTerm').value);
        const startDateInput = document.getElementById('startDate').value;

        console.log('Inputs:', { loanAmount, annualRate, loanTermYears, startDateInput });

        // Validate inputs
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount greater than 0.');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid interest rate (0 or greater).');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term greater than 0.');
            return;
        }

        // Calculate loan details
        console.log('Starting calculation...');
        const results = calculateLoan(loanAmount, annualRate, loanTermYears, startDateInput);
        latestResults = results;

        console.log('Calculation results:', results);

        // Display results
        console.log('Displaying results...');
        displayResults(results);
        console.log('Results displayed successfully');

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            // Scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    } catch (error) {
        console.error('Error in calculation:', error);
        console.error('Error stack:', error.stack);
        alert('An error occurred during calculation: ' + error.message + '\n\nCheck the browser console (F12) for more details.');
    }
}

/**
 * Calculate loan payment and amortization schedule
 * Formula: M = P[r(1+r)^n]/[(1+r)^n-1]
 */
function calculateLoan(principal, annualRate, years, startDate) {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;

    // Calculate monthly payment
    let monthlyPayment;
    if (monthlyRate === 0) {
        // If interest rate is 0, simple division
        monthlyPayment = principal / numberOfPayments;
    } else {
        // Standard loan payment formula
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(
        principal,
        monthlyRate,
        monthlyPayment,
        numberOfPayments,
        startDate
    );

    // Calculate totals
    const totalAmount = monthlyPayment * numberOfPayments;
    const totalInterest = totalAmount - principal;

    return {
        monthlyPayment,
        totalAmount,
        totalInterest,
        numberOfPayments,
        schedule
    };
}

/**
 * Generate detailed amortization schedule
 */
function generateAmortizationSchedule(principal, monthlyRate, monthlyPayment, numberOfPayments, startDate) {
    const schedule = [];
    let balance = principal;

    // Determine start date
    let currentDate;
    if (startDate) {
        const [year, month] = startDate.split('-');
        currentDate = new Date(year, month - 1, 1);
    } else {
        currentDate = new Date();
        currentDate.setDate(1); // Set to first of month
    }

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;

        // Prevent negative balance due to rounding
        if (balance < 0) balance = 0;

        schedule.push({
            paymentNumber: i,
            date: new Date(currentDate),
            payment: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingBalance: balance
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return schedule;
}

/**
 * Display calculation results
 */
function displayResults(results) {
    try {
        // Display summary values
        const monthlyPaymentEl = document.getElementById('monthlyPayment');
        const totalInterestEl = document.getElementById('totalInterest');
        const totalAmountEl = document.getElementById('totalAmount');
        const numPaymentsEl = document.getElementById('numPayments');

        if (monthlyPaymentEl) monthlyPaymentEl.textContent = formatCurrency(results.monthlyPayment);
        if (totalInterestEl) totalInterestEl.textContent = formatCurrency(results.totalInterest);
        if (totalAmountEl) totalAmountEl.textContent = formatCurrency(results.totalAmount);
        if (numPaymentsEl) numPaymentsEl.textContent = results.numberOfPayments;

        // Update amortization table
        updateAmortizationTable();

        // Update chart
        updateChart(results.schedule);
    } catch (error) {
        console.error('Error displaying results:', error);
        throw error;
    }
}

/**
 * Update amortization table based on checkbox state
 */
function updateAmortizationTable() {
    if (!latestResults) return;

    const schedule = latestResults.schedule;
    const showAllPaymentsCheckbox = document.getElementById('showAllPayments');
    const showAll = showAllPaymentsCheckbox ? showAllPaymentsCheckbox.checked : false;
    const tbody = document.getElementById('amortizationBody');

    if (!tbody) {
        console.error('Amortization table body not found');
        return;
    }

    tbody.innerHTML = '';

    if (showAll) {
        // Show all payments
        schedule.forEach(payment => {
            tbody.appendChild(createTableRow(payment));
        });
    } else {
        // Show yearly summary (every 12th payment)
        schedule.forEach((payment, index) => {
            if ((index + 1) % 12 === 0 || index === 0) {
                tbody.appendChild(createTableRow(payment));
            }
        });

        // Always show the last payment if it's not already shown
        const lastPayment = schedule[schedule.length - 1];
        if (schedule.length % 12 !== 0) {
            tbody.appendChild(createTableRow(lastPayment));
        }
    }
}

/**
 * Create table row for payment
 */
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

/**
 * Update the chart with payment data
 */
function updateChart(schedule) {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping chart creation');
        return;
    }

    try {
        const canvas = document.getElementById('paymentChart');
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Prepare data - sample every 12 months for readability
        const labels = [];
        const principalData = [];
        const interestData = [];

        schedule.forEach((payment, index) => {
            if (index % 12 === 0 || index === schedule.length - 1) {
                labels.push(`Payment ${payment.paymentNumber}`);
                principalData.push(payment.principalPayment);
                interestData.push(payment.interestPayment);
            }
        });

        // Create new chart
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Principal',
                        data: principalData,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Interest',
                        data: interestData,
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatCurrency(context.parsed.y);
                                return label;
                            }
                        }
                    }
                }
            }
        });

        console.log('Chart created successfully');
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

/**
 * Format number as currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short'
    }).format(date);
}

/**
 * Set default start date to current month
 */
function setDefaultDate() {
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        startDateInput.value = `${year}-${month}`;
    }
}
