import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchEmployee,
  fetchScreenshots,
  fetchActivity,
  type Employee,
  type Screenshot,
  type ActivityLog,
} from "../api/client";
import ScreenshotGrid from "../components/ScreenshotGrid";
import ActivityTable from "../components/ActivityTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";

type Tab = "screenshots" | "activity";

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState<Tab>("screenshots");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");

  // Screenshots state
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [ssPage, setSsPage] = useState(1);
  const [ssTotalPages, setSsTotalPages] = useState(1);

  // Activity state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [actPage, setActPage] = useState(1);
  const [actTotalPages, setActTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  // Load employee info
  useEffect(() => {
    if (!id) return;
    fetchEmployee(id)
      .then(setEmployee)
      .finally(() => setLoading(false));
  }, [id]);

  // Load screenshots when tab/date/page changes
  useEffect(() => {
    if (!id || tab !== "screenshots") return;
    fetchScreenshots(id, date, ssPage).then((res) => {
      setScreenshots(res.screenshots);
      setSsTotalPages(res.totalPages);
    });
  }, [id, tab, date, ssPage]);

  // Load activities when tab/date/filter/page changes
  useEffect(() => {
    if (!id || tab !== "activity") return;
    fetchActivity(id, date, statusFilter, actPage).then((res) => {
      setActivities(res.activities);
      setActTotalPages(res.totalPages);
    });
  }, [id, tab, date, statusFilter, actPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 m-6">
        Employee not found.
      </div>
    );
  }

  return (
    <div>
      {/* Back link + header */}
      <Link
        to="/"
        className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        &larr; Back to employees
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {employee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {employee.name}
              </h1>
              <StatusBadge status={employee.current_status || "offline"} />
            </div>
            <p className="text-sm text-gray-500">
              {employee.email}
              {employee.department && ` · ${employee.department}`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Date picker */}
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSsPage(1);
            setActPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />

        {/* Status filter (activity tab only) */}
        {tab === "activity" && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setActPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>
        )}

        {/* Tab switcher */}
        <div className="ml-auto flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("screenshots")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              tab === "screenshots"
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Screenshots
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              tab === "activity"
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === "screenshots" ? (
          <>
            <ScreenshotGrid screenshots={screenshots} />
            <Pagination
              page={ssPage}
              totalPages={ssTotalPages}
              onPageChange={setSsPage}
            />
          </>
        ) : (
          <>
            <ActivityTable activities={activities} />
            <Pagination
              page={actPage}
              totalPages={actTotalPages}
              onPageChange={setActPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
