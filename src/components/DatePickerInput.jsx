import { useLanguage } from '../context/LanguageContext'

function DatePickerInput({ label, name, value, onChange }) {
  const { t } = useLanguage()

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder="2082-11-20"
        pattern="\d{4}-\d{2}-\d{2}"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <span className="mt-1 block text-xs text-gray-500">
        {t('commonDateHint')}
      </span>
    </label>
  )
}

export default DatePickerInput
