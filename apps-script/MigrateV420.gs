function migrateCalProV420() {
  const ss = getSpreadsheet_();
  const now = new Date();
  const calculatorSheet = ss.getSheetByName('CALCULATOR_MASTER');
  const configSheet = ss.getSheetByName('APP_CONFIG');
  if (!calculatorSheet || !configSheet) throw new Error('Jalankan setupCalProDatabase() hanya untuk database baru.');

  const calculator = ['PRODUCTION_HPP', 'HPP Produksi', 'PRODUCTION', 'Biaya produksi dan HPP estimasi per produk', 'inventory_2', 30, 'ACTIVE', now, now];
  const calculatorValues = calculatorSheet.getDataRange().getValues();
  const calculatorRow = calculatorValues.findIndex((row, index) => index > 0 && row[0] === calculator[0]);
  if (calculatorRow >= 0) {
    const createdAt = calculatorValues[calculatorRow][7] || now;
    calculator[7] = createdAt;
    calculatorSheet.getRange(calculatorRow + 1, 1, 1, calculator.length).setValues([calculator]);
  } else {
    calculatorSheet.appendRow(calculator);
  }

  const configValues = configSheet.getDataRange().getValues();
  const versionRow = configValues.findIndex((row, index) => index > 0 && row[0] === 'APP_VERSION');
  const versionData = ['APP_VERSION', '4.2.0', 'Current application version', now];
  if (versionRow >= 0) configSheet.getRange(versionRow + 1, 1, 1, versionData.length).setValues([versionData]);
  else configSheet.appendRow(versionData);

  return { ok: true, version: '4.2.0', calculatorCode: 'PRODUCTION_HPP' };
}
