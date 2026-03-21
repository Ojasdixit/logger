import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEmployees, type Employee } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch((err) => setError(err.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 m-6">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-500 mt-1">
          {employees.length} employees being monitored
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <Link
            key={emp.id}
            to={`/employee/${emp.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {emp.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <StatusBadge status={emp.current_status} />
            </div>

            {/* Info */}
            <h3 className="font-semibold text-gray-900">{emp.name}</h3>
            <p className="text-sm text-gray-500">{emp.email}</p>
            {emp.department && (
              <p className="text-xs text-gray-400 mt-1">{emp.department}</p>
            )}

            {/* Stats row */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {emp.today_screenshots} screenshots today
              </span>
              {emp.current_app && (
                <span className="truncate max-w-[120px]">
                  {emp.current_app}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
