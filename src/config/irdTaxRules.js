export const IRD_RULES = {
  vatRate: 0.13,
  fiscalYears: ['2081/82', '2082/83', '2083/84'],
  periodBuckets: [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annual', value: 'annual' },
  ],
  expenseTdsApplicableTypes: ['salary', 'other'],
  expenseTypeOptions: [
    { label: 'Salary', value: 'salary' },
    { label: 'Other Expenses', value: 'other' },
    { label: 'Operational (No TDS)', value: 'operational' },
    { label: 'Capital (No TDS)', value: 'capital' },
  ],
  tdsOptions: [
    { label: '0%', value: '0' },
    { label: '1.5%', value: '1.5' },
    { label: '5%', value: '5' },
    { label: '10%', value: '10' },
    { label: '15%', value: '15' },
    { label: '25%', value: '25' },
  ],
}

export function toNumber(value) {
  return Number(value) || 0
}

export function calculateVat(amount) {
  return toNumber(amount) * IRD_RULES.vatRate
}

export function calculateTds(amount, ratePercent) {
  return toNumber(amount) * (toNumber(ratePercent) / 100)
}

export function isTdsApplicableExpenseType(expenseType) {
  return IRD_RULES.expenseTdsApplicableTypes.includes(expenseType)
}

export function validatePanVatNumber(value) {
  const normalized = (value ?? '').trim()
  return /^\d{9,10}$/.test(normalized)
}

export function formatNpr(value) {
  return `NPR ${toNumber(value).toFixed(2)}`
}
