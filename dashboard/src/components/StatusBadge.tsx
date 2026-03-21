interface StatusBadgeProps {
  status: "active" | "idle" | "offline";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    active: "bg-green-100 text-green-800 border-green-200",
    idle: "bg-yellow-100 text-yellow-800 border-yellow-200",
    offline: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const dots = {
    active: "bg-green-500",
    idle: "bg-yellow-500",
    offline: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
