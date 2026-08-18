export function numberField(id, label, value, suffix = '', options = {}) {
  const max = options.max === undefined ? '' : ` max="${options.max}"`;
  const min = options.min === undefined ? 0 : options.min;
  const step = options.step === undefined ? '1' : options.step;
  return `<label class="number-field">
    <span>${label}</span>
    <div>
      <input id="${id}" type="number" min="${min}"${max} step="${step}" inputmode="decimal" value="${value}">
      ${suffix ? `<b>${suffix}</b>` : ''}
    </div>
  </label>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function costItemRow(group, item) {
  const prefix = `${group}-${item.id}`;
  return `<article class="cost-item" data-cost-item data-item-id="${item.id}">
    <label class="cost-item-field cost-item-name">
      <span>Nama biaya</span>
      <input type="text" data-cost-field="name" value="${escapeHtml(item.name)}" placeholder="Contoh: Kulit lumpia">
    </label>
    <label class="cost-item-field">
      <span>Harga beli</span>
      <input type="number" min="0" step="1" inputmode="decimal" data-cost-field="purchasePrice" value="${item.purchasePrice}">
    </label>
    <label class="cost-item-field">
      <span>Jumlah isi</span>
      <input type="number" min="0" step="0.01" inputmode="decimal" data-cost-field="purchaseQuantity" value="${item.purchaseQuantity}">
    </label>
    <label class="cost-item-field">
      <span>Jumlah dipakai</span>
      <input type="number" min="0" step="0.01" inputmode="decimal" data-cost-field="usedQuantity" value="${item.usedQuantity}">
    </label>
    <div class="cost-item-output">
      <span>Biaya terpakai</span>
      <output data-cost-output="${prefix}">Rp0</output>
    </div>
    <button type="button" class="cost-item-remove" data-remove-cost aria-label="Hapus ${escapeHtml(item.name || 'biaya')}">
      <span class="material-symbols-rounded" aria-hidden="true">delete</span>
    </button>
  </article>`;
}

export function tipsDisclosure(title, tips = []) {
  return `<details class="calculation-tips">
    <summary>
      <span class="material-symbols-rounded" aria-hidden="true">tips_and_updates</span>
      <span><b>${escapeHtml(title)}</b><small>Contoh pengisian dan cara menghitung</small></span>
      <span class="material-symbols-rounded tips-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <ul>
      ${tips.map(tip => `<li>
        <b>${escapeHtml(tip.title)}</b>
        <p>${escapeHtml(tip.description)}</p>
        ${tip.formula ? `<code>${escapeHtml(tip.formula)}</code>` : ''}
      </li>`).join('')}
    </ul>
  </details>`;
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
