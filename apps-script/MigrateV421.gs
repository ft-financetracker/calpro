function migrateCalProV421() {
  const ss = getSpreadsheet_();
  const now = new Date();
  const calculatorSheet = ss.getSheetByName('CALCULATOR_MASTER');
  const configSheet = ss.getSheetByName('APP_CONFIG');
  if (!calculatorSheet || !configSheet) throw new Error('Sheet CALCULATOR_MASTER atau APP_CONFIG tidak ditemukan.');

  const activeCalculators = [
    ['CASH_DEPOSIT', 'Setoran Kas', 'CASH', 'Hitung semua pecahan uang', 'cash', 10, 'ACTIVE', now, now],
    ['SELLING_PRICE', 'Harga & HPP', 'SALES', 'Harga jual, HPP per unit, dan HPP produksi', 'sell', 20, 'ACTIVE', now, now],
    ['DISCOUNT', 'Diskon', 'SALES', 'Harga akhir dan penghematan', 'percent', 30, 'ACTIVE', now, now],
    ['MARKETPLACE_FEE', 'Biaya Marketplace', 'SALES', 'Fee dan penerimaan bersih', 'storefront', 40, 'ACTIVE', now, now]
  ];

  activeCalculators.forEach(calculator => {
    const values = calculatorSheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row, index) => index > 0 && row[0] === calculator[0]);
    if (rowIndex >= 0) {
      calculator[7] = values[rowIndex][7] || now;
      calculatorSheet.getRange(rowIndex + 1, 1, 1, calculator.length).setValues([calculator]);
    } else {
      calculatorSheet.appendRow(calculator);
    }
  });

  const values = calculatorSheet.getDataRange().getValues();
  const productionRow = values.findIndex((row, index) => index > 0 && row[0] === 'PRODUCTION_HPP');
  if (productionRow >= 0) {
    calculatorSheet.getRange(productionRow + 1, 4).setValue('Digabung sebagai mode di dalam Harga & HPP');
    calculatorSheet.getRange(productionRow + 1, 7).setValue('INACTIVE');
    calculatorSheet.getRange(productionRow + 1, 9).setValue(now);
  }

  const configValues = configSheet.getDataRange().getValues();
  const versionRow = configValues.findIndex((row, index) => index > 0 && row[0] === 'APP_VERSION');
  const versionData = ['APP_VERSION', '4.2.1', 'Current application version', now];
  if (versionRow >= 0) configSheet.getRange(versionRow + 1, 1, 1, versionData.length).setValues([versionData]);
  else configSheet.appendRow(versionData);

  return { ok: true, version: '4.2.1', calculatorCode: 'SELLING_PRICE', modes: ['QUICK', 'BUILDER', 'PRODUCTION'] };
}
