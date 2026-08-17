export function numberField(id, label, value, suffix = '', options = {}) {
  const max = options.max === undefined ? '' : ` max="${options.max}"`;
  const step = options.step === undefined ? '1' : options.step;
  return `<label class="number-field">
    <span>${label}</span>
    <div>
      <input id="${id}" type="number" min="0"${max} step="${step}" inputmode="decimal" value="${value}">
      ${suffix ? `<b>${suffix}</b>` : ''}
    </div>
  </label>`;
}

export function calculatorHeader(title, kicker, { showReset = false } = {}) {
  return `<header class="calculator-header">
    <div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div>
    <div class="header-tools">
      <button type="button" class="icon-button" data-info aria-label="Lihat fungsi, panduan, dan rumus"><span class="material-symbols-rounded">info</span></button>
      ${showReset ? '<button type="button" class="button button-secondary" id="resetCash">Reset</button>' : ''}
    </div>
  </header>`;
}

export function resultMetric(label, id, { highlight = false } = {}) {
  return `<span class="result-metric${highlight ? ' is-highlight' : ''}"><span>${label}</span><b id="${id}"></b></span>`;
}
