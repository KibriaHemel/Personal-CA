const currency = { BD: '৳', IN: '₹', US: '$' };
const countryName = { BD: 'Bangladesh', IN: 'India', US: 'USA' };
const lawLinks = {
  BD: 'https://nbr.gov.bd/taxtypes/income-tax/income-tax-paripatra/eng',
  IN: 'https://incometaxindia.gov.in/tax-rates',
  US: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets'
};
const investmentLinks = {
  BD: [
    ['National Savings Certificates', 'Government savings schemes for low-risk savers.', 'https://nationalsavings.gov.bd/'],
    ['Dhaka Stock Exchange', 'Research listed companies, disclosures and market data.', 'https://www.dse.com.bd/'],
    ['Bangladesh Red Crescent', 'Consider audited humanitarian donations.', 'https://bdrcs.org/']
  ],
  IN: [
    ['National Savings Institute', 'Government small-savings schemes such as PPF/NSC via official channels.', 'https://www.nsiindia.gov.in/'],
    ['NSE India', 'Research regulated market products and listed securities.', 'https://www.nseindia.com/'],
    ['GiveIndia', 'Explore vetted donation opportunities.', 'https://www.give.do/']
  ],
  US: [
    ['TreasuryDirect', 'Buy U.S. savings bonds, bills, notes and other Treasury securities.', 'https://www.treasurydirect.gov/'],
    ['Investor.gov', 'SEC investor education before choosing funds or stocks.', 'https://www.investor.gov/'],
    ['Charity Navigator', 'Evaluate charities before donating.', 'https://www.charitynavigator.org/']
  ]
};
const lawLibrary = {
  BD: [
    ['Individual slab income tax', 'Resident individuals are taxed progressively after the applicable tax-free threshold. The demo uses a practical progressive slab model for FY 2025-26 planning.', lawLinks.BD],
    ['Investment allowance concept', 'Eligible investments may reduce tax subject to Bangladesh rules and limits. Always verify caps and eligible instruments for the exact assessment year.', lawLinks.BD],
    ['Withholding / source tax', 'Salary, bank profit, rent and vendor payments can involve tax deduction at source. Include paid withholding in production filing flows.', lawLinks.BD]
  ],
  IN: [
    ['New regime slab tax', 'The new regime applies progressive slabs and allows a standard deduction for salary income. Rebate rules may make tax zero up to qualifying limits.', lawLinks.IN],
    ['Old regime deductions', 'The old regime can include deductions such as 80C and other allowances. The calculator lets users compare simplified old vs new planning.', lawLinks.IN],
    ['Capital gains and special income', 'Capital gains and other special-rate income may require different forms and rates. A production system should branch into ITR-specific forms.', 'https://incometaxindia.gov.in/Pages/i-am/individual.aspx']
  ],
  US: [
    ['Federal income tax brackets', 'Federal income tax is progressive and depends on filing status. This demo uses 2025 federal brackets and standard deductions.', lawLinks.US],
    ['Standard vs itemized deductions', 'Most taxpayers choose the larger of standard or itemized deductions. Itemized details need a deeper production form.', 'https://www.irs.gov/credits-deductions/individuals/standard-deduction'],
    ['Credits and retirement contributions', 'Credits, 401(k)/IRA contributions and HSA contributions can change liability. This demo suggests planning actions, not legal advice.', 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-contributions']
  ]
};
const $ = (id) => document.getElementById(id);
let currentUser = JSON.parse(localStorage.getItem('pca_user') || 'null');
let latestResult = null;

function money(value, c) { return `${currency[c]}${Math.round(value || 0).toLocaleString()}`; }
function pct(value) { return `${((value || 0) * 100).toFixed(2)}%`; }
function getHistory() { return JSON.parse(localStorage.getItem('pca_history') || '[]'); }
function setHistory(items) { localStorage.setItem('pca_history', JSON.stringify(items)); }

function slabTax(income, slabs) {
  let tax = 0, last = 0, lines = [];
  for (const [limit, rate, label] of slabs) {
    const taxable = Math.max(0, Math.min(income, limit) - last);
    if (taxable > 0) {
      const part = taxable * rate;
      tax += part;
      lines.push({ label: label || `${last + 1} - ${limit}`, amount: part, note: `${(rate * 100).toFixed(0)}% on ${taxable.toLocaleString()}` });
    }
    last = limit;
    if (income <= limit) break;
  }
  return { tax, lines };
}

function questions(country) {
  const common = `
    <div class="question-card"><div class="question-title"><h3>2. Basic income profile</h3><a href="${lawLinks[country]}" target="_blank" rel="noopener">Income rules</a></div>
      <div class="stack">
        <label>Tax year <select name="year"><option>2025-2026</option><option>2026-2027 planning</option></select></label>
        <label>Annual gross income <input name="income" type="number" min="0" step="1" placeholder="0" required></label>
        <label>Annual essential expenditure <input name="expenses" type="number" min="0" step="1" placeholder="0"></label>
        <label>Existing tax paid / withholding <input name="withheld" type="number" min="0" step="1" placeholder="0"></label>
      </div>
    </div>`;
  if (country === 'BD') return common + `
    <div class="question-card"><div class="question-title"><h3>3. Bangladesh-specific details</h3><a href="${lawLinks.BD}" target="_blank" rel="noopener">NBR circulars</a></div><div class="stack">
      <label>Taxpayer category <select name="bdCategory"><option value="general">General individual</option><option value="female_senior">Female / senior citizen planning threshold</option><option value="disabled">Disabled person planning threshold</option></select></label>
      <label>Eligible investment amount <input name="deductions" type="number" min="0" step="1" placeholder="Savings certificates, DPS, approved schemes"></label>
      <label>Donation / charity amount <input name="charity" type="number" min="0" step="1" placeholder="Eligible donation"></label>
      <label>Income type <select name="incomeType"><option value="salary">Salary</option><option value="business">Business / profession</option><option value="rent">Rent or mixed income</option></select></label>
    </div></div>`;
  if (country === 'IN') return common + `
    <div class="question-card"><div class="question-title"><h3>3. India-specific details</h3><a href="${lawLinks.IN}" target="_blank" rel="noopener">CBDT tax rates</a></div><div class="stack">
      <label>Preferred regime <select name="inRegime"><option value="new">New regime</option><option value="old">Old regime comparison</option></select></label>
      <label>Employment type <select name="employment"><option value="salary">Salaried</option><option value="business">Business / profession</option><option value="capital">Capital gains / mixed</option></select></label>
      <label>Old-regime deductions / 80C etc. <input name="deductions" type="number" min="0" step="1" placeholder="Only used heavily in old regime"></label>
      <label>Donation amount <input name="charity" type="number" min="0" step="1" placeholder="Eligible 80G donation"></label>
    </div></div>`;
  return common + `
    <div class="question-card"><div class="question-title"><h3>3. USA-specific details</h3><a href="${lawLinks.US}" target="_blank" rel="noopener">IRS brackets</a></div><div class="stack">
      <label>Filing status <select name="usStatus"><option value="single">Single</option><option value="married">Married filing jointly</option><option value="hoh">Head of household</option></select></label>
      <label>Itemized deductions <input name="deductions" type="number" min="0" step="1" placeholder="Mortgage, state taxes, charity etc."></label>
      <label>Retirement/HSA contributions <input name="retirement" type="number" min="0" step="1" placeholder="401(k), IRA, HSA planning"></label>
      <label>Charitable donations <input name="charity" type="number" min="0" step="1" placeholder="Qualified charities"></label>
    </div></div>`;
}

function updateQuestions() {
  const country = document.querySelector('input[name="country"]:checked').value;
  $('countryLaw').href = lawLinks[country];
  $('dynamicQuestions').innerHTML = questions(country);
  $('previewCountry').textContent = countryName[country];
  renderLaw(country);
}

function calculate(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const country = data.country;
  const income = Number(data.income || 0), expenses = Number(data.expenses || 0), withheld = Number(data.withheld || 0);
  const deductions = Number(data.deductions || 0), charity = Number(data.charity || 0), retirement = Number(data.retirement || 0);
  let result;
  if (country === 'BD') {
    const baseThreshold = data.bdCategory === 'disabled' ? 475000 : data.bdCategory === 'female_senior' ? 425000 : 375000;
    const investmentCredit = Math.min(deductions * 0.15, income * 0.03, 100000);
    const donationCredit = Math.min(charity * 0.15, 50000);
    const taxable = Math.max(0, income - baseThreshold);
    const slabs = [[300000, .05, 'First taxable slab'], [700000, .10, 'Next taxable slab'], [1100000, .15, 'Middle taxable slab'], [1600000, .20, 'Higher taxable slab'], [Infinity, .25, 'Top slab']];
    const s = slabTax(taxable, slabs);
    const taxBeforeCredits = s.tax;
    const tax = Math.max(0, taxBeforeCredits - investmentCredit - donationCredit - withheld);
    result = { country, taxable, taxBeforeCredits, tax, withheld, credits: investmentCredit + donationCredit, lines: [
      {label:'Gross annual income',amount:income},{label:'Tax-free threshold used',amount:-baseThreshold},{label:'Taxable income after threshold',amount:taxable},...s.lines,{label:'Investment rebate / planning credit',amount:-investmentCredit},{label:'Charity planning credit',amount:-donationCredit},{label:'Tax already paid / withheld',amount:-withheld},{label:'Estimated amount payable',amount:tax}
    ]};
  } else if (country === 'IN') {
    const isSalary = data.employment === 'salary';
    const standard = isSalary ? 75000 : 0;
    let taxable = Math.max(0, income - standard);
    let s;
    if (data.inRegime === 'old') {
      const oldDed = Math.min(deductions + charity, 200000);
      taxable = Math.max(0, income - oldDed - (isSalary ? 50000 : 0));
      s = slabTax(taxable, [[250000,0,'Basic exemption'],[500000,.05,'Old regime 5% slab'],[1000000,.20,'Old regime 20% slab'],[Infinity,.30,'Old regime 30% slab']]);
    } else {
      s = slabTax(taxable, [[400000,0,'New regime 0% slab'],[800000,.05,'New regime 5% slab'],[1200000,.10,'New regime 10% slab'],[1600000,.15,'New regime 15% slab'],[2000000,.20,'New regime 20% slab'],[2400000,.25,'New regime 25% slab'],[Infinity,.30,'New regime 30% slab']]);
    }
    let taxBeforeCess = s.tax;
    const rebate = data.inRegime === 'new' && taxable <= 1200000 ? taxBeforeCess : 0;
    const cess = Math.max(0, taxBeforeCess - rebate) * .04;
    const tax = Math.max(0, taxBeforeCess - rebate + cess - withheld);
    result = { country, taxable, taxBeforeCredits: taxBeforeCess + cess, tax, withheld, credits: rebate, lines:[
      {label:'Gross annual income',amount:income},{label:'Standard deduction / selected deductions',amount:-(data.inRegime === 'old' ? Math.min(deductions + charity,200000)+(isSalary?50000:0) : standard)},{label:'Taxable income',amount:taxable},...s.lines,{label:'Section 87A rebate planning',amount:-rebate},{label:'Health and education cess',amount:cess},{label:'Tax already paid / withheld',amount:-withheld},{label:'Estimated amount payable',amount:tax}
    ]};
  } else {
    const status = data.usStatus || 'single';
    const standardDed = status === 'married' ? 30000 : status === 'hoh' ? 22500 : 15000;
    const deductionUsed = Math.max(standardDed, deductions) + retirement;
    const taxable = Math.max(0, income - deductionUsed);
    const slabsByStatus = {
      single: [[11925,.10,'10% bracket'],[48475,.12,'12% bracket'],[103350,.22,'22% bracket'],[197300,.24,'24% bracket'],[250525,.32,'32% bracket'],[626350,.35,'35% bracket'],[Infinity,.37,'37% bracket']],
      married: [[23850,.10,'10% bracket'],[96950,.12,'12% bracket'],[206700,.22,'22% bracket'],[394600,.24,'24% bracket'],[501050,.32,'32% bracket'],[751600,.35,'35% bracket'],[Infinity,.37,'37% bracket']],
      hoh: [[17000,.10,'10% bracket'],[64850,.12,'12% bracket'],[103350,.22,'22% bracket'],[197300,.24,'24% bracket'],[250500,.32,'32% bracket'],[626350,.35,'35% bracket'],[Infinity,.37,'37% bracket']]
    };
    const s = slabTax(taxable, slabsByStatus[status]);
    const charityPlanning = Math.min(charity * .1, s.tax * .1);
    const tax = Math.max(0, s.tax - withheld);
    result = { country, taxable, taxBeforeCredits: s.tax, tax, withheld, credits: charityPlanning, lines:[
      {label:'Gross annual income',amount:income},{label:'Deduction used: standard/itemized + retirement',amount:-deductionUsed},{label:'Taxable income',amount:taxable},...s.lines,{label:'Estimated charity planning value',amount:-charityPlanning},{label:'Tax already paid / withheld',amount:-withheld},{label:'Estimated amount payable',amount:tax}
    ]};
  }
  result.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  result.year = data.year || '2025-2026';
  result.income = income;
  result.expenses = expenses;
  result.savings = Math.max(0, income - expenses - result.tax);
  result.date = new Date().toISOString();
  result.references = [lawLinks[country], ...investmentLinks[country].map(x => x[2])];
  return result;
}

function renderResult(result) {
  latestResult = result;
  $('resultsSection').hidden = false;
  $('resultTitle').textContent = `${countryName[result.country]} tax summary`;
  $('resultSubtitle').textContent = `Estimated for ${result.year}. This is an educational estimate, not a government filing.`;
  $('resultKpis').innerHTML = [
    ['Taxable income', money(result.taxable, result.country)],
    ['Estimated tax payable', money(result.tax, result.country)],
    ['Effective rate', pct(result.income ? result.tax / result.income : 0)]
  ].map(([a,b]) => `<div><small>${a}</small><strong>${b}</strong></div>`).join('');
  $('detailLines').innerHTML = result.lines.map(l => `<div class="line-item"><span>${l.label}${l.note ? `<small> · ${l.note}</small>` : ''}</span><span>${money(l.amount, result.country)}</span></div>`).join('') +
    `<div class="line-item"><span>References attached</span><span>${result.references.length} links</span></div>`;
  $('taxTips').innerHTML = taxTips(result).map(card).join('');
  $('investmentTips').innerHTML = investmentTips(result).map(card).join('');
  updateHero(result);
  location.hash = '#resultsSection';
}
function card(t) { return `<article class="tip-card"><h4>${t[0]}</h4><p>${t[1]}</p>${t[2] ? `<a href="${t[2]}" target="_blank" rel="noopener">Open source ↗</a>` : ''}</article>`; }
function taxTips(r) {
  if (r.country === 'BD') return [
    ['Use approved investments carefully', 'Check eligible savings certificates/DPS and investment rebate caps before year end. Do not over-invest just for tax reduction.', lawLinks.BD],
    ['Track withholding certificates', 'Collect salary, bank profit and other source-tax certificates so paid tax is not missed.', lawLinks.BD],
    ['Keep business records clean', 'For business/professional income, preserve receipts, invoices and bank statements to support allowable expenses.', lawLinks.BD]
  ];
  if (r.country === 'IN') return [
    ['Compare old vs new regime', 'High eligible deductions can make the old regime attractive, while many salaried users benefit from the new regime and rebate.', lawLinks.IN],
    ['Use deductions only when valid', '80C/80D/80G style deductions need qualifying products and proof. Avoid fake deductions.', 'https://incometaxindia.gov.in/Pages/i-am/individual.aspx'],
    ['Separate capital gains', 'Capital gains and special-rate income should be handled in dedicated forms with transaction details.', 'https://incometaxindia.gov.in/Pages/i-am/individual.aspx']
  ];
  return [
    ['Maximize pre-tax retirement where suitable', '401(k), IRA and HSA contributions may reduce taxable income if eligible and within limits.', 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-contributions'],
    ['Compare standard vs itemized', 'Use the larger deduction method and keep evidence for charity, mortgage interest, state/local taxes and medical expenses.', 'https://www.irs.gov/credits-deductions/individuals/standard-deduction'],
    ['Review credits', 'Child, education, energy and earned-income credits may reduce tax more directly than deductions.', 'https://www.irs.gov/credits-and-deductions']
  ];
}
function investmentTips(r) {
  const budget = r.savings;
  const base = investmentLinks[r.country].map(([name, desc, link]) => [name, `${desc} Suggested maximum to explore: ${money(Math.max(0, budget * (name.toLowerCase().includes('char') || name.toLowerCase().includes('give') || name.toLowerCase().includes('red') ? .05 : .25)), r.country)}. Verify risk, lock-in, fees and eligibility before investing.`, link]);
  if (budget <= 0) base.unshift(['No surplus detected', 'Your entered expenses and tax leave no clear savings buffer. Build emergency savings before investing.', null]);
  else base.unshift(['Savings-aware allocation', `Based on entered data, estimated post-tax savings are ${money(budget, r.country)}. The app never recommends more than your available savings.`, null]);
  return base;
}
function updateHero(r) {
  $('previewCountry').textContent = countryName[r.country];
  $('previewIncome').textContent = money(r.taxable, r.country);
  $('previewTax').textContent = money(r.tax, r.country);
  $('previewRate').textContent = pct(r.income ? r.tax / r.income : 0);
  $('previewSavings').textContent = money(r.savings, r.country);
  $('heroProgress').style.width = '100%';
}
function renderLaw(country='BD') {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.law === country));
  $('lawCards').innerHTML = lawLibrary[country].map(([title, body, link]) => `<article class="law-card"><h3>${title}</h3><p>${body}</p><a href="${link}" target="_blank" rel="noopener">Read reference ↗</a></article>`).join('');
}
function renderUser() {
  const badge = $('userBadge');
  if (!currentUser) { badge.classList.add('hidden'); $('openAuth').textContent = 'Login'; return; }
  badge.classList.remove('hidden');
  badge.innerHTML = `<strong>${currentUser.name}</strong><br><span>${currentUser.email}</span>`;
  $('openAuth').textContent = 'Logged in';
}
function renderProfile() {
  const content = $('profileContent');
  if (!currentUser) { content.innerHTML = '<p>Please register/login first.</p>'; return; }
  const history = getHistory().filter(x => x.userEmail === currentUser.email);
  content.innerHTML = `<div class="user-badge"><strong>${currentUser.name}</strong><br>${currentUser.email}</div><h3>Saved tax years</h3>` +
    (history.length ? history.map(item => `<div class="history-card"><strong>${countryName[item.country]} · ${item.year}</strong><p>${new Date(item.date).toLocaleDateString()} · Tax: ${money(item.tax,item.country)} · Taxable: ${money(item.taxable,item.country)}</p><button class="ghost" onclick="deleteHistory('${item.id}')">Delete record</button></div>`).join('') : '<p>No saved calculations yet.</p>');
}
window.deleteHistory = function(id){ setHistory(getHistory().filter(x => x.id !== id)); renderProfile(); };
function saveLatest() {
  if (!currentUser) { $('authDialog').showModal(); return; }
  if (!latestResult) return;
  const history = getHistory().filter(x => x.id !== latestResult.id);
  history.unshift({ ...latestResult, userEmail: currentUser.email });
  setHistory(history);
  renderProfile();
  alert('Saved to your profile.');
}
function downloadPdf() {
  if (!latestResult) return;
  const refs = latestResult.references.map((r,i)=>`${i+1}. ${r}`).join('\n');
  const oldTitle = document.title;
  document.title = `Personal CA ${countryName[latestResult.country]} ${latestResult.year} tax report`;
  const note = document.createElement('pre');
  note.id = 'printRefs';
  note.textContent = `\nLaw and investment references:\n${refs}\n\nDisclaimer: Educational estimate only. Consult a licensed tax professional before filing.`;
  note.style.whiteSpace = 'pre-wrap'; note.style.margin = '20px';
  document.querySelector('.result-panel').appendChild(note);
  window.print();
  setTimeout(()=>{ note.remove(); document.title = oldTitle; }, 500);
}

document.querySelectorAll('input[name="country"]').forEach(el => el.addEventListener('change', updateQuestions));
document.querySelectorAll('.tab').forEach(el => el.addEventListener('click', () => renderLaw(el.dataset.law)));
$('taxForm').addEventListener('submit', e => { e.preventDefault(); renderResult(calculate(e.currentTarget)); });
$('resetBtn').addEventListener('click', () => { $('taxForm').reset(); updateQuestions(); $('resultsSection').hidden = true; });
$('authForm').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget); currentUser = { name: f.get('name'), email: f.get('email') }; localStorage.setItem('pca_user', JSON.stringify(currentUser)); renderUser(); renderProfile(); });
$('saveResult').addEventListener('click', saveLatest);
$('downloadPdf').addEventListener('click', downloadPdf);
$('openAuth').addEventListener('click', () => currentUser ? (document.querySelector('#profileDrawer').classList.add('open'), $('backdrop').classList.add('show'), renderProfile()) : $('authDialog').showModal());
$('profileBtn').addEventListener('click', () => { $('profileDrawer').classList.add('open'); $('backdrop').classList.add('show'); renderProfile(); });
$('closeProfile').addEventListener('click', () => { $('profileDrawer').classList.remove('open'); $('backdrop').classList.remove('show'); });
$('backdrop').addEventListener('click', () => { $('profileDrawer').classList.remove('open'); $('backdrop').classList.remove('show'); });
$('themeToggle').addEventListener('click', () => { const light = document.documentElement.getAttribute('data-theme') !== 'light'; document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark'); localStorage.setItem('pca_theme', light ? 'light' : 'dark'); $('themeToggle').textContent = light ? '☀️' : '🌙'; });
const savedTheme = localStorage.getItem('pca_theme') || 'dark'; document.documentElement.setAttribute('data-theme', savedTheme); $('themeToggle').textContent = savedTheme === 'light' ? '☀️' : '🌙';
updateQuestions(); renderUser(); renderProfile();
