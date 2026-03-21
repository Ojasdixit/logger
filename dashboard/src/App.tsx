import { Routes, Route, NavLink } from "react-router-dom";
import EmployeeList from "./pages/EmployeeList";
import EmployeeDetail from "./pages/EmployeeDetail";
import Downloads from "./pages/Downloads";

export default function App() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700 font-medium"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              Employee Monitor
            </span>
          </a>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Employees
            </NavLink>
            <NavLink to="/downloads" className={linkClass}>
              Downloads
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<EmployeeList />} />
          <Route path="/employee/:id" element={<EmployeeDetail />} />
          <Route path="/downloads" element={<Downloads />} />
        </Routes>
      </main>
    </div>
  );
}
