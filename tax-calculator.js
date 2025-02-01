// Hide results section on page load
document.getElementById('result').classList.remove('show');

function formatAmount(amount) {
    // For amounts >= 1 crore
    if (amount >= 10000000) {
        return (amount / 10000000).toFixed(2) + ' Cr';
    }
    // For amounts >= 1 lakh
    else if (amount >= 100000) {
        return (amount / 100000).toFixed(2) + ' L';
    }
    // For amounts < 1 lakh
    else {
        return new Intl.NumberFormat('en-IN').format(Math.round(amount));
    }
}

function formatSlabRange(slab) {
    // Handle "Above X" case
    if (slab.startsWith('Above')) {
        const amount = parseInt(slab.replace(/[^\d]/g, ''));
        return `Above ${formatAmount(amount)}`;
    }
    
    // Handle range case
    const parts = slab.split(' - ');
    if (parts.length === 2) {
        const start = parseInt(parts[0].replace(/[^\d]/g, ''));
        const end = parseInt(parts[1].replace(/[^\d]/g, ''));
        return `${formatAmount(start)} - ${formatAmount(end)}`;
    }
    
    return slab;
}

function calculateOldRegimeTax(income, deductions) {
    // Calculate taxable income after all deductions
    let taxableIncome = income;
    
    // Exempt Income
    taxableIncome = Math.max(0, taxableIncome - (deductions.hra || 0));
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.lta || 0, 200000));
    taxableIncome = Math.max(0, taxableIncome - (deductions.child_education || 0));
    taxableIncome = Math.max(0, taxableIncome - (deductions.transport_allowance || 0));
    
    // Standard Deduction
    taxableIncome = Math.max(0, taxableIncome - deductions.standardDeduction);
    
    // Section 80C
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80c, 150000));
    
    // Section 80CCD(1B)
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80ccd1b, 50000));
    
    // Section 80D (Self and Family)
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80d, 25000));
    
    // Section 80D (Parents)
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80d_parents, 50000));
    
    // Section 24(b)
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section24b, 200000));
    
    // Section 80EE
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80ee, 50000));
    
    // Section 80E (No limit)
    taxableIncome = Math.max(0, taxableIncome - deductions.section80e);
    
    // Section 80G
    taxableIncome = Math.max(0, taxableIncome - deductions.section80g);
    
    // Section 80TTA
    taxableIncome = Math.max(0, taxableIncome - Math.min(deductions.section80tta, 10000));
    
    let tax = 0;
    let breakdown = [];

    if (taxableIncome <= 250000) {
        tax = 0;
        breakdown.push({slab: "0 - 2,50,000", amount: taxableIncome, rate: 0, tax: 0});
    } else {
        // First slab (0 - 2.5L)
        breakdown.push({slab: "0 - 2,50,000", amount: 250000, rate: 0, tax: 0});
        
        // Second slab (2.5L - 5L)
        if (taxableIncome > 250000) {
            const taxableAmount = Math.min(taxableIncome - 250000, 250000);
            const slabTax = taxableAmount * 0.05;
            tax += slabTax;
            breakdown.push({slab: "2,50,001 - 5,00,000", amount: taxableAmount, rate: 5, tax: slabTax});
        }
        
        // Third slab (5L - 10L)
        if (taxableIncome > 500000) {
            const taxableAmount = Math.min(taxableIncome - 500000, 500000);
            const slabTax = taxableAmount * 0.20;
            tax += slabTax;
            breakdown.push({slab: "5,00,001 - 10,00,000", amount: taxableAmount, rate: 20, tax: slabTax});
        }
        
        // Fourth slab (Above 10L)
        if (taxableIncome > 1000000) {
            const taxableAmount = taxableIncome - 1000000;
            const slabTax = taxableAmount * 0.30;
            tax += slabTax;
            breakdown.push({slab: "Above 10,00,000", amount: taxableAmount, rate: 30, tax: slabTax});
        }
    }

    // Add Health and Education Cess (4%)
    const cess = tax * 0.04;
    tax += cess;
    
    if (tax > 0) {
        breakdown.push({slab: "Health & Education Cess", amount: tax - cess, rate: 4, tax: cess});
    }

    return { tax, breakdown };
}

function calculateOldTax(income) {
    let tax = 0;
    let breakdown = [];

    if (income <= 300000) {
        tax = 0;
        breakdown.push({slab: "0 - 3,00,000", amount: income, rate: 0, tax: 0});
    } else {
        if (income > 300000) {
            const taxableAmount = Math.min(income - 300000, 400000);
            const slabTax = taxableAmount * 0.05;
            tax += slabTax;
            breakdown.push({slab: "3,00,001 - 7,00,000", amount: taxableAmount, rate: 5, tax: slabTax});
        }
        
        if (income > 700000) {
            const taxableAmount = Math.min(income - 700000, 300000);
            const slabTax = taxableAmount * 0.10;
            tax += slabTax;
            breakdown.push({slab: "7,00,001 - 10,00,000", amount: taxableAmount, rate: 10, tax: slabTax});
        }
        
        if (income > 1000000) {
            const taxableAmount = Math.min(income - 1000000, 200000);
            const slabTax = taxableAmount * 0.15;
            tax += slabTax;
            breakdown.push({slab: "10,00,001 - 12,00,000", amount: taxableAmount, rate: 15, tax: slabTax});
        }
        
        if (income > 1200000) {
            const taxableAmount = Math.min(income - 1200000, 300000);
            const slabTax = taxableAmount * 0.20;
            tax += slabTax;
            breakdown.push({slab: "12,00,001 - 15,00,000", amount: taxableAmount, rate: 20, tax: slabTax});
        }
        
        if (income > 1500000) {
            const taxableAmount = income - 1500000;
            const slabTax = taxableAmount * 0.30;
            tax += slabTax;
            breakdown.push({slab: "Above 15,00,000", amount: taxableAmount, rate: 30, tax: slabTax});
        }
    }
    return { tax, breakdown };
}

function calculateNewTax(income) {
    let tax = 0;
    let breakdown = [];

    if (income <= 400000) {
        tax = 0;
        breakdown.push({slab: "0 - 4,00,000", amount: income, rate: 0, tax: 0});
    } else {
        if (income > 400000) {
            const taxableAmount = Math.min(income - 400000, 400000);
            const slabTax = taxableAmount * 0.05;
            tax += slabTax;
            breakdown.push({slab: "4,00,001 - 8,00,000", amount: taxableAmount, rate: 5, tax: slabTax});
        }
        
        if (income > 800000) {
            const taxableAmount = Math.min(income - 800000, 400000);
            const slabTax = taxableAmount * 0.10;
            tax += slabTax;
            breakdown.push({slab: "8,00,001 - 12,00,000", amount: taxableAmount, rate: 10, tax: slabTax});
        }
        
        if (income > 1200000) {
            const taxableAmount = Math.min(income - 1200000, 400000);
            const slabTax = taxableAmount * 0.15;
            tax += slabTax;
            breakdown.push({slab: "12,00,001 - 16,00,000", amount: taxableAmount, rate: 15, tax: slabTax});
        }
        
        if (income > 1600000) {
            const taxableAmount = Math.min(income - 1600000, 400000);
            const slabTax = taxableAmount * 0.20;
            tax += slabTax;
            breakdown.push({slab: "16,00,001 - 20,00,000", amount: taxableAmount, rate: 20, tax: slabTax});
        }
        
        if (income > 2000000) {
            const taxableAmount = Math.min(income - 2000000, 400000);
            const slabTax = taxableAmount * 0.25;
            tax += slabTax;
            breakdown.push({slab: "20,00,001 - 24,00,000", amount: taxableAmount, rate: 25, tax: slabTax});
        }

        if (income > 2400000) {
            const taxableAmount = income - 2400000;
            const slabTax = taxableAmount * 0.30;
            tax += slabTax;
            breakdown.push({slab: "Above 24,00,000", amount: taxableAmount, rate: 30, tax: slabTax});
        }
    }
    return { tax, breakdown };
}

function calculateTax() {
    // Get income value
    const income = parseFloat(document.getElementById('income').value) || 0;
    
    if (income <= 0) {
        alert('Please enter a valid income amount');
        return;
    }

    // Hide welcome message
    document.getElementById('initialState').style.display = 'none';

    // Get all deduction inputs
    const deductions = {
        standardDeduction: 50000,
        hra: parseFloat(document.getElementById('hra').value) || 0,
        lta: parseFloat(document.getElementById('lta').value) || 0,
        child_education: parseFloat(document.getElementById('child_education').value) || 0,
        transport_allowance: parseFloat(document.getElementById('transport_allowance').value) || 0,
        section80c: parseFloat(document.getElementById('section80c').value) || 0,
        section80ccd1b: parseFloat(document.getElementById('section80ccd1b').value) || 0,
        section80d: parseFloat(document.getElementById('section80d').value) || 0,
        section80d_parents: parseFloat(document.getElementById('section80d_parents').value) || 0,
        section24b: parseFloat(document.getElementById('section24b').value) || 0,
        section80ee: parseFloat(document.getElementById('section80ee').value) || 0,
        section80e: parseFloat(document.getElementById('section80e').value) || 0,
        section80g: parseFloat(document.getElementById('section80g').value) || 0,
        section80tta: parseFloat(document.getElementById('section80tta').value) || 0
    };

    // Show loading animation
    document.querySelector('.loading-container').classList.add('show');
    
    // Switch to two-column layout
    document.querySelector('.container').classList.add('show-results');
    
    // Make input section sticky
    document.querySelector('.input-section').style.position = 'sticky';
    document.querySelector('.input-section').style.top = '2rem';

    setTimeout(() => {
        try {
            // Calculate taxes under different regimes
            const oldRegimeTax = calculateOldRegimeTax(income, deductions);
            const newRegimeTax = calculateOldTax(Math.max(0, income - 75000));
            const revisedNewRegimeTax = calculateNewTax(Math.max(0, income - 75000));

            // Display results
            displayResults(oldRegimeTax, newRegimeTax, revisedNewRegimeTax);

            // Hide loading animation
            document.querySelector('.loading-container').classList.remove('show');

            // Show results section
            document.getElementById('calculationResults').classList.add('show');

            // Scroll to the top of the results section
            document.getElementById('calculationResults').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });

        } catch (error) {
            console.error('Calculation error:', error);
            alert('An error occurred while calculating taxes. Please try again.');
            document.querySelector('.loading-container').classList.remove('show');
        }
    }, 300);
}

function displayResults(oldRegimeTax, newRegimeTax, revisedNewRegimeTax) {
    const savingsContentDiv = document.getElementById('savingsContent');
    const taxes = {
        'Old Regime': oldRegimeTax.tax,
        'New Regime': newRegimeTax.tax,
        'Revised New Regime': revisedNewRegimeTax.tax
    };

    const minTax = Math.min(...Object.values(taxes));
    const bestRegime = Object.entries(taxes).find(([_, tax]) => tax === minTax)[0];
    const maxSavings = Math.max(...Object.values(taxes)) - minTax;

    // Update savings content with better formatting
    savingsContentDiv.innerHTML = `
        <div class="savings-amount">
            <div class="best-option">✨ ${bestRegime} is Best for You</div>
            <div class="savings-list">
                <div class="savings-item">
                    <span>Annual Tax Amount</span>
                    <strong>₹${formatAmount(minTax)}</strong>
                </div>
                <div class="savings-item">
                    <span>Maximum Savings</span>
                    <strong>₹${formatAmount(maxSavings)}</strong>
                </div>
            </div>
        </div>
    `;

    // Update tax breakdowns with improved formatting
    updateTaxBreakdown('oldRegimeTaxBreakdown', oldRegimeTax);
    updateTaxBreakdown('oldTaxBreakdown', newRegimeTax);
    updateTaxBreakdown('newTaxBreakdown', revisedNewRegimeTax);
}

function updateTaxBreakdown(elementId, taxData) {
    const element = document.getElementById(elementId);
    const breakdownHTML = taxData.breakdown.map(slab => `
        <div class="tax-slab">
            <div class="tax-slab-range">${formatSlabRange(slab.slab)}</div>
            <div class="tax-slab-rate">
                <span>${slab.rate}% Tax Rate</span>
                <span>₹${formatAmount(slab.tax)}</span>
            </div>
        </div>
    `).join('');
    
    element.innerHTML = breakdownHTML;
    
    // Update total tax with better alignment
    const totalTaxElement = element.parentElement.querySelector('.total-tax');
    totalTaxElement.innerHTML = `
        <span>Total Tax</span>
        <span>₹${formatAmount(taxData.tax)}</span>
    `;
}

// Add resize handler for responsive chart
window.addEventListener('resize', () => {
    if (taxChart) {
        taxChart.resize();
    }
});

// Add event listener for Enter key on all inputs
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateTax();
        }
    });
});