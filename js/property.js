// Property Tax Calculator for Kazakhstan - 2026

const PROPERTY_TAX_RATES = [
    { threshold: 52000000, rate: 0, baseTax: 0 },
    { threshold: 104000000, rate: 0.0005, baseTax: 0 },
    { threshold: 156000000, rate: 0.0007, baseTax: 26000 },
    { threshold: Infinity, rate: 0.001, baseTax: 62400 }
];

const AREA_RATES = { astana: 240, almaty: 240, shymkent: 180, regional: 140, district: 90, rural: 55 };
const PROPERTY_MULTIPLIERS = { apartment: 1.0, house: 1.3, dacha: 0.75, garage: 0.55 };
const BENEFIT_AREAS = { astana: 65, almaty: 65, shymkent: 70, regional: 80, district: 100, rural: 150 };

const calculationMethodSelect = document.getElementById('calculationMethod');
const propertyForm = document.getElementById('propertyForm');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');
const valueFields = document.getElementById('valueFields');
const areaFields = document.getElementById('areaFields');

calculationMethodSelect.addEventListener('change', function() {
    valueFields.style.display = 'none';
    areaFields.style.display = 'none';
    if (this.value === 'value') valueFields.style.display = 'block';
    else if (this.value === 'area') areaFields.style.display = 'block';
});

function calculateTaxByValue(propertyValue) {
    if (propertyValue < PROPERTY_TAX_RATES[0].threshold) {
        return { tax: 0, exempt: true, details: `${t('js.prop.exempt')} ${formatNumber(PROPERTY_TAX_RATES[0].threshold)} ₸${t('js.prop.exempt.suffix') || ')'}` };
    }
    for (let i = 1; i < PROPERTY_TAX_RATES.length; i++) {
        const cur = PROPERTY_TAX_RATES[i];
        const prev = PROPERTY_TAX_RATES[i - 1].threshold;
        if (propertyValue <= cur.threshold) {
            const excess = propertyValue - prev;
            return { tax: cur.baseTax + excess * cur.rate, exempt: false, bracket: i, excess, rate: cur.rate * 100, baseTax: cur.baseTax };
        }
    }
    return { tax: 0, exempt: false };
}

function calculateTaxByArea(area, propertyType, cityType, hasBenefits) {
    const baseRate = AREA_RATES[cityType] || AREA_RATES.rural;
    const multiplier = PROPERTY_MULTIPLIERS[propertyType] || 1.0;
    const benefitArea = hasBenefits ? BENEFIT_AREAS[cityType] : 0;
    const taxableArea = Math.max(0, area - benefitArea);
    return { tax: taxableArea * baseRate * multiplier, baseRate, multiplier, benefitArea, taxableArea, totalArea: area };
}

function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getCityName(cityType) {
    const keys = { astana:'form.cityType.astana', almaty:'form.cityType.almaty', shymkent:'form.cityType.almaty', regional:'form.cityType.regional', district:'form.cityType.district', rural:'form.cityType.rural' };
    return t(keys[cityType] || cityType);
}

function getPropertyTypeName(propertyType) {
    const keys = { apartment:'form.propertyType.apartment', house:'form.propertyType.house', dacha:'form.propertyType.dacha', garage:'form.propertyType.garage' };
    return t(keys[propertyType] || propertyType);
}

propertyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const calculationMethod = calculationMethodSelect.value;
    const hasBenefits = document.getElementById('hasBenefits').checked;
    let taxAmount = 0;
    let detailsHTML = '';

    if (calculationMethod === 'value') {
        const propertyValue = parseFloat(document.getElementById('propertyValue').value);
        const result = calculateTaxByValue(propertyValue);

        detailsHTML = `
            <p><strong>${t('js.prop.method.value')}</strong></p>
            <p><strong>${t('js.prop.value.label')}</strong> ${formatNumber(propertyValue)} ₸</p>
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        `;

        if (result.exempt) {
            detailsHTML += `<p style="color: #2ecc71; font-weight: 600;">✓ ${result.details}</p>`;
            taxAmount = 0;
        } else {
            detailsHTML += `
                <p><strong>${t('js.prop.excess.label')}</strong> ${formatNumber(result.excess)} ₸</p>
                <p><strong>${t('js.prop.rate.label')}</strong> ${result.rate}%</p>
            `;
            if (result.baseTax > 0) detailsHTML += `<p><strong>${t('js.prop.baseTax.label')}</strong> ${formatNumber(result.baseTax)} ₸</p>`;
            taxAmount = result.tax;
        }

        if (hasBenefits && taxAmount > 0) {
            detailsHTML += `
                <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
                <p><strong>${t('js.prop.beforeBenefit')}</strong> ${formatNumber(taxAmount)} ₸</p>
                <p style="color: #2ecc71; font-weight: 600;"><strong>${t('js.prop.benefitApplied')}</strong></p>
                <p><small>${t('js.prop.benefitNote')}</small></p>
            `;
            taxAmount = 0;
        }
    } else if (calculationMethod === 'area') {
        const totalArea = parseFloat(document.getElementById('totalArea').value);
        const propertyType = document.getElementById('propertyType').value;
        const cityType = document.getElementById('cityType').value;
        const result = calculateTaxByArea(totalArea, propertyType, cityType, hasBenefits);
        taxAmount = result.tax;

        detailsHTML = `
            <p><strong>${t('js.prop.method.area')}</strong></p>
            <p><strong>${t('js.prop.type.label')}</strong> ${getPropertyTypeName(propertyType)}</p>
            <p><strong>${t('js.prop.city.label')}</strong> ${getCityName(cityType)}</p>
            <p><strong>${t('js.prop.totalArea.label')}</strong> ${totalArea} м²</p>
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p><strong>${t('js.prop.baseRate.label')}</strong> ${formatNumber(result.baseRate)} ₸/м²</p>
            <p><strong>${t('js.prop.multiplier.label')}</strong> ${result.multiplier}</p>
        `;

        if (result.benefitArea > 0) {
            detailsHTML += `
                <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
                <p style="color: #2ecc71;"><strong>${t('js.prop.benefitArea')}</strong> ${result.benefitArea} м² ${t('js.prop.notTaxed')}</p>
                <p><strong>${t('js.prop.taxableArea')}</strong> ${result.taxableArea} м²</p>
            `;
        } else {
            detailsHTML += `<p><strong>${t('js.prop.taxableArea')}</strong> ${result.taxableArea} м²</p>`;
        }
    }

    document.getElementById('taxAmount').textContent = `${formatNumber(taxAmount)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

resetBtn.addEventListener('click', function() {
    propertyForm.reset();
    resultSection.style.display = 'none';
    valueFields.style.display = 'none';
    areaFields.style.display = 'none';
});
