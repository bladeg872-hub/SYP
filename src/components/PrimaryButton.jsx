function PrimaryButton({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-700 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
  }

  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
