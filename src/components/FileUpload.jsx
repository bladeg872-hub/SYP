function FileUpload({ label, name, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type="file"
        onChange={onChange}
        className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600"
      />
    </label>
  )
}

export default FileUpload
