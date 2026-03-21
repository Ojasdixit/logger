import StatusBadge from "./StatusBadge";
import type { ActivityLog } from "../api/client";

interface ActivityTableProps {
  activities: ActivityLog[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No activity logs found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Application
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Window Title
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {activities.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {new Date(a.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {a.app_name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                {a.window_title}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
