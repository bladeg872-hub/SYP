import { Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            F
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">FinAncio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Simple financial UI for institutions in Nepal
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
