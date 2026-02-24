// Transport Tax Calculator for Kazakhstan - 2026

const MRP_2026 = 4246;

const TAX_RATES = {
    passenger: [
        { max: 1500, rate: 5, labelKey: 'до 1500 см³' },
        { max: 2000, rate: 7, labelKey: '1501-2000 см³' },
        { max: 2500, rate: 10, labelKey: '2001-2500 см³' },
        { max: 3000, rate: 15, labelKey: '2501-3000 см³' },
        { max: 4000, rate: 20, labelKey: '3001-4000 см³' },
        { max: Infinity, rate: 30, labelKey: 'свыше 4000 см³' }
    ],
    truck: [
        { max: 2, rate: 7, labelKey: 'до 2 тонн' },
        { max: 5, rate: 10, labelKey: '2-5 тонн' },
        { max: 10, rate: 15, labelKey: '5-10 тонн' },
        { max: 20, rate: 20, labelKey: '10-20 тонн' },
        { max: Infinity, rate: 25, labelKey: 'свыше 20 тонн' }
    ],
    motorcycle: [
        { max: 250, rate: 2, labelKey: 'до 250 см³' },
        { max: 500, rate: 4, labelKey: '250-500 см³' },
        { max: 750, rate: 6, labelKey: '500-750 см³' },
        { max: Infinity, rate: 8, labelKey: 'свыше 750 см³' }
    ],
    bus: [
        { max: 20, rate: 10, labelKey: 'до 20 мест' },
        { max: 40, rate: 15, labelKey: '20-40 мест' },
        { max: Infinity, rate: 20, labelKey: 'свыше 40 мест' }
    ],
    special: [
        { max: 100, rate: 8, labelKey: 'до 100 л.с.' },
        { max: 200, rate: 12, labelKey: '100-200 л.с.' },
        { max: Infinity, rate: 18, labelKey: 'свыше 200 л.с.' }
    ],
    trailer: [
        { max: 3, rate: 5, labelKey: 'до 3 тонн' },
        { max: 8, rate: 8, labelKey: '3-8 тонн' },
        { max: Infinity, rate: 12, labelKey: 'свыше 8 тонн' }
    ]
};

function getAgeCoefficient(year) {
    const age = 2026 - year;
    return age >= 10 ? 0.5 : 1.0;
}

const vehicleTypeSelect = document.getElementById('vehicleType');
const transportForm = document.getElementById('transportForm');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');
const passengerFields = document.getElementById('passengerFields');
const truckFields = document.getElementById('truckFields');
const motorcycleFields = document.getElementById('motorcycleFields');
const busFields = document.getElementById('busFields');
const specialFields = document.getElementById('specialFields');
const trailerFields = document.getElementById('trailerFields');

vehicleTypeSelect.addEventListener('change', function() {
    [passengerFields, truckFields, motorcycleFields, busFields, specialFields, trailerFields].forEach(f => f.style.display = 'none');
    const map = { passenger: passengerFields, truck: truckFields, motorcycle: motorcycleFields, bus: busFields, special: specialFields, trailer: trailerFields };
    if (map[this.value]) map[this.value].style.display = 'block';
});

function calculateTransportTax(vehicleType, value, year) {
    const rates = TAX_RATES[vehicleType];
    let rateInfo = null;
    for (let i = 0; i < rates.length; i++) {
        if (value <= rates[i].max) { rateInfo = rates[i]; break; }
    }
    if (!rateInfo) return { tax: 0, rate: 0, label: '' };
    const baseTax = rateInfo.rate * MRP_2026;
    const ageCoef = getAgeCoefficient(year);
    return { tax: baseTax * ageCoef, rate: rateInfo.rate, label: rateInfo.labelKey, ageCoef, baseTax };
}

function getVehicleDescription(vehicleType) {
    const keys = { passenger: 'js.vehicle.passenger', truck: 'js.vehicle.truck', motorcycle: 'js.vehicle.motorcycle', bus: 'js.vehicle.bus', special: 'js.vehicle.special', trailer: 'js.vehicle.trailer' };
    return t(keys[vehicleType] || '');
}

function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

transportForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const vehicleType = vehicleTypeSelect.value;
    const yearManufactured = parseInt(document.getElementById('yearManufactured').value);
    let taxableValue = 0;
    let valueLabel = '';

    const cc = t('js.cc'), tons = t('js.tons'), hp = t('js.hp');
    switch(vehicleType) {
        case 'passenger':   taxableValue = parseInt(document.getElementById('engineVolume').value);    valueLabel = `${t('js.engineVolume.label')} ${formatNumber(taxableValue)} ${cc}`; break;
        case 'truck':       taxableValue = parseFloat(document.getElementById('truckCapacity').value); valueLabel = `${t('js.capacity.label')} ${taxableValue} ${tons}`; break;
        case 'motorcycle':  taxableValue = parseInt(document.getElementById('motorcycleVolume').value);valueLabel = `${t('js.engineVolume.label')} ${formatNumber(taxableValue)} ${cc}`; break;
        case 'bus':         taxableValue = parseInt(document.getElementById('busSeats').value);        valueLabel = `${t('js.seats.label')} ${taxableValue}`; break;
        case 'special':     taxableValue = parseInt(document.getElementById('specialPower').value);    valueLabel = `${t('js.power.label')} ${taxableValue} ${hp}`; break;
        case 'trailer':     taxableValue = parseFloat(document.getElementById('trailerCapacity').value);valueLabel = `${t('js.capacity.label')} ${taxableValue} ${tons}`; break;
    }

    const result = calculateTransportTax(vehicleType, taxableValue, yearManufactured);
    const vehicleAge = 2026 - yearManufactured;

    let detailsHTML = `
        <p><strong>${t('js.vehicleType.label')}</strong> ${getVehicleDescription(vehicleType)}</p>
        <p><strong>${valueLabel}</strong></p>
        <p><strong>${t('js.year.label')}</strong> ${yearManufactured} (${t('js.age.label')} ${vehicleAge} ${t('js.years')})</p>
        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        <p><strong>${t('js.category.label')}</strong> ${result.label}</p>
        <p><strong>${t('js.rate.label')}</strong> ${result.rate} МРП / АЕК</p>
        <p><strong>${t('js.mrp.label')}</strong> ${formatNumber(MRP_2026)} ₸</p>
    `;

    if (result.ageCoef < 1) {
        detailsHTML += `
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p><strong>${t('js.baseTax.label')}</strong> ${formatNumber(result.baseTax)} ₸</p>
            <p style="color: #2ecc71; font-weight: 600;"><strong>${t('js.ageBenefit')}</strong></p>
            <p><strong>${t('js.finalTax.label')}</strong> ${formatNumber(result.tax)} ₸</p>
        `;
    }

    document.getElementById('taxAmount').textContent = `${formatNumber(result.tax)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

resetBtn.addEventListener('click', function() {
    transportForm.reset();
    resultSection.style.display = 'none';
    [passengerFields, truckFields, motorcycleFields, busFields, specialFields, trailerFields].forEach(f => f.style.display = 'none');
});
