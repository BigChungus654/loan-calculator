document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('dtiForm').addEventListener('submit', handleCalculation);
});

function handleCalculation(e) {
    e.preventDefault();

    const salary = parseFloat(document.getElementById('salary').value) || 0;
    const otherIncome = parseFloat(document.getElementById('otherIncome').value) || 0;
    const mortgageRent = parseFloat(document.getElementById('mortgageRent').value) || 0;
    const carPayment = parseFloat(document.getElementById('carPayment').value) || 0;
    const studentLoans = parseFloat(document.getElementById('studentLoans').value) || 0;
    const creditCardMin = parseFloat(document.getElementById('creditCardMin').value) || 0;
    const otherDebt = parseFloat(document.getElementById('otherDebt').value) || 0;

    const totalIncome = salary + otherIncome;
    const totalDebt = mortgageRent + carPayment + studentLoans + creditCardMin + otherDebt;

    if (totalIncome <= 0) {
        alert('Please enter a valid income amount.');
        return;
    }

    const dtiRatio = (totalDebt / totalIncome) * 100;
    const remaining = totalIncome - totalDebt;

    // Display results
    document.getElementById('dtiRatio').textContent = dtiRatio.toFixed(1) + '%';
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalDebt').textContent = formatCurrency(totalDebt);
    document.getElementById('remainingIncome').textContent = formatCurrency(remaining);

    // Rating and color
    const dtiCard = document.getElementById('dtiCard');
    let rating, explanation;

    if (dtiRatio <= 35) {
        rating = 'Excellent';
        dtiCard.style.background = 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)';
        explanation = 'Your DTI ratio is excellent. You\'re in a strong position to qualify for a mortgage with competitive interest rates. Lenders see you as a low-risk borrower. You have plenty of room in your budget for a new mortgage payment.';
    } else if (dtiRatio <= 43) {
        rating = 'Acceptable';
        dtiCard.style.background = 'linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)';
        explanation = 'Your DTI ratio is acceptable for most lenders. You should qualify for a conventional mortgage, though you may not get the absolute best rates. Consider paying down some debt before applying to improve your terms.';
    } else if (dtiRatio <= 50) {
        rating = 'Risky';
        dtiCard.style.background = 'linear-gradient(135deg, #dd6b20 0%, #c05621 100%)';
        explanation = 'Your DTI ratio is in the risky zone. Conventional mortgages typically require under 43%. You may still qualify for FHA loans (which allow up to 50%), but you\'ll likely face higher interest rates. Try to pay down debt before applying.';
    } else {
        rating = 'Too High';
        dtiCard.style.background = 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
        explanation = 'Your DTI ratio is too high for most lenders. Focus on paying down debt and/or increasing your income before applying for a mortgage. Consider the debt snowball or avalanche method to reduce your monthly obligations.';
    }

    document.getElementById('dtiRating').textContent = rating;
    document.getElementById('dtiRatio').style.color = 'white';
    document.getElementById('dtiExplanation').textContent = explanation;

    // Position marker on meter
    const marker = document.getElementById('dtiMarker');
    const markerPos = Math.min(dtiRatio, 100);
    marker.style.left = markerPos + '%';
    marker.textContent = dtiRatio.toFixed(1) + '%';

    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
}
