// Land Tax Calculator for Kazakhstan - 2026

const BASE_RATES = {
    agricultural: { astana:58, almaty:70, shymkent:52, akmola:46, aktobe:46, 'almaty-region':52, atyrau:58, vko:46, zhambyl:46, zko:40, karaganda:46, kostanay:46, kyzylorda:40, mangystau:52, pavlodar:46, sko:40, turkestan:46, default:35 },
    settlement:   { astana:700, almaty:700, shymkent:480, akmola:290, aktobe:290, 'almaty-region':350, atyrau:350, vko:290, zhambyl:290, zko:260, karaganda:320, kostanay:290, kyzylorda:260, mangystau:350, pavlodar:290, sko:260, turkestan:290, default:180 },
    industrial:   { astana:480, almaty:480, shymkent:360, akmola:240, aktobe:240, 'almaty-region':300, atyrau:300, vko:240, zhambyl:240, zko:200, karaganda:260, kostanay:240, kyzylorda:200, mangystau:280, pavlodar:240, sko:200, turkestan:240, default:180 },
    forest:   { default:24 },
    water:    { default:18 },
    reserve:  { default:12 }
};

// Purpose keys mapped to translation keys
const LAND_PURPOSE_DEFS = {
    agricultural: [
        { value:'arable',    key:'js.purpose.arable',    multiplier:1.0 },
        { value:'hayfield',  key:'js.purpose.hayfield',  multiplier:0.55 },
        { value:'pasture',   key:'js.purpose.pasture',   multiplier:0.35 },
        { value:'fallow',    key:'js.purpose.fallow',    multiplier:0.25 },
        { value:'perennial', key:'js.purpose.perennial', multiplier:1.2  }
    ],
    settlement: [
        { value:'residential', key:'js.purpose.residential', multiplier:1.0 },
        { value:'commercial',  key:'js.purpose.commercial',  multiplier:1.6 },
        { value:'garden',      key:'js.purpose.garden',      multiplier:0.45 },
        { value:'personal',    key:'js.purpose.personal',    multiplier:0.35 },
        { value:'recreation',  key:'js.purpose.recreation',  multiplier:0.8  }
    ],
    industrial: [
        { value:'industry',      key:'js.purpose.industry',      multiplier:1.0 },
        { value:'transport',     key:'js.purpose.transport',      multiplier:0.75 },
        { value:'communication', key:'js.purpose.communication',  multiplier:0.55 },
        { value:'energy',        key:'js.purpose.energy',         multiplier:0.85 },
        { value:'defense',       key:'js.purpose.defense',        multiplier:0.5  }
    ],
    forest:  [ { value:'forest',     key:'js.purpose.forest',     multiplier:1.0 }, { value:'protection', key:'js.purpose.protection', multiplier:0.5 } ],
    water:   [ { value:'water',      key:'js.purpose.water',      multiplier:1.0 }, { value:'fishing',    key:'js.purpose.fishing',    multiplier:0.8 } ],
    reserve: [ { value:'reserve',    key:'js.purpose.reserve',    multiplier:1.0 } ]
};

const BENEFIT_LIMITS = { urban:0.25, rural:1.0 };

const landCategorySelect = document.getElementById('landCategory');
const landPurposeSelect  = document.getElementById('landPurpose');
const landForm           = document.getElementById('landForm');
const resultSection      = document.getElementById('resultSection');
const resetBtn           = document.getElementById('resetBtn');
const baseRateInput      = document.getElementById('baseRate');
const regionSelect       = document.getElementById('region');

function populatePurposes() {
    const category = landCategorySelect.value;
    landPurposeSelect.innerHTML = `<option value="">${t('form.landPurpose.default')}</option>`;
    if (category && LAND_PURPOSE_DEFS[category]) {
        LAND_PURPOSE_DEFS[category].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.value;
            opt.textContent = t(p.key);
            opt.dataset.multiplier = p.multiplier;
            landPurposeSelect.appendChild(opt);
        });
    }
    updateBaseRate();
}

landCategorySelect.addEventListener('change', populatePurposes);
regionSelect.addEventListener('change', updateBaseRate);
landPurposeSelect.addEventListener('change', updateBaseRate);

// Called when language changes
window.onLangChange = function() {
    populatePurposes();
};

function updateBaseRate() {
    const category = landCategorySelect.value;
    const region   = regionSelect.value;
    const purposeOption = landPurposeSelect.options[landPurposeSelect.selectedIndex];
    if (!category || !region) { baseRateInput.value = ''; return; }
    const catRates = BASE_RATES[category];
    let baseRate = catRates[region] || catRates.default || 0;
    if (purposeOption && purposeOption.dataset.multiplier) baseRate *= parseFloat(purposeOption.dataset.multiplier);
    baseRateInput.value = formatNumber(Math.round(baseRate));
}

function calculateLandTax(area, baseRate, hasBenefits, region) {
    let benefitArea = 0;
    let taxableArea = area;
    if (hasBenefits) {
        const isUrban = ['astana','almaty','shymkent'].includes(region);
        benefitArea = isUrban ? BENEFIT_LIMITS.urban : BENEFIT_LIMITS.rural;
        taxableArea = Math.max(0, area - benefitArea);
    }
    return { tax: taxableArea * baseRate, benefitArea, taxableArea, totalArea: area };
}

function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getRegionName(regionCode) {
    const sel = document.getElementById('region');
    const opt = sel.querySelector(`option[value="${regionCode}"]`);
    return opt ? opt.textContent : '';
}
function getCategoryName(cat) {
    const sel = document.getElementById('landCategory');
    const opt = sel.querySelector(`option[value="${cat}"]`);
    return opt ? opt.textContent : '';
}
function getPurposeName(purpose) {
    const sel = document.getElementById('landPurpose');
    const opt = sel.querySelector(`option[value="${purpose}"]`);
    return opt ? opt.textContent : '';
}

landForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const landCategory = landCategorySelect.value;
    const landPurpose  = landPurposeSelect.value;
    const landArea     = parseFloat(document.getElementById('landArea').value);
    const region       = regionSelect.value;
    const baseRate     = parseFloat(baseRateInput.value.replace(/\s/g, ''));
    const hasBenefits  = document.getElementById('hasBenefits').checked;

    const result = calculateLandTax(landArea, baseRate, hasBenefits, region);
    const ha = t('js.land.ha'), sotok = t('js.land.sotok');

    let detailsHTML = `
        <p><strong>${t('js.land.category.label')}</strong> ${getCategoryName(landCategory)}</p>
        <p><strong>${t('js.land.purpose.label')}</strong> ${getPurposeName(landPurpose)}</p>
        <p><strong>${t('js.land.area.label')}</strong> ${landArea} ${ha} (${formatNumber(landArea * 100)} ${sotok})</p>
        <p><strong>${t('js.land.region.label')}</strong> ${getRegionName(region)}</p>
        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
        <p><strong>${t('js.land.baseRate.label')}</strong> ${formatNumber(baseRate)} ₸/${ha}</p>
    `;

    if (hasBenefits && result.benefitArea > 0) {
        const benefitTax = result.benefitArea * baseRate;
        const originalTax = landArea * baseRate;
        detailsHTML += `
            <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 1rem 0;">
            <p style="color:#2ecc71;"><strong>${t('js.land.benefitArea')}</strong> ${result.benefitArea} ${ha} (${formatNumber(result.benefitArea * 100)} ${sotok})</p>
            <p><strong>${t('js.land.taxableArea')}</strong> ${result.taxableArea} ${ha}</p>
        `;
        if (result.taxableArea > 0) {
            detailsHTML += `
                <p><strong>${t('js.land.taxNoLgota')}</strong> ${formatNumber(originalTax)} ₸</p>
                <p style="color:#2ecc71;"><strong>${t('js.land.economy')}</strong> ${formatNumber(benefitTax)} ₸</p>
            `;
        } else {
            detailsHTML += `
                <p style="color:#2ecc71; font-weight:600;"><strong>${t('js.land.noTax')}</strong></p>
                <p><small>${t('js.land.benefitCovers')}</small></p>
            `;
        }
    }

    document.getElementById('taxAmount').textContent = `${formatNumber(result.tax)} ₸`;
    document.getElementById('resultDetails').innerHTML = detailsHTML;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

resetBtn.addEventListener('click', function() {
    landForm.reset();
    resultSection.style.display = 'none';
    landPurposeSelect.innerHTML = `<option value="">${t('form.landPurpose.default')}</option>`;
    baseRateInput.value = '';
});
