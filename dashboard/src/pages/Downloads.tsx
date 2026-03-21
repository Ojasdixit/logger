import { useEffect, useState } from "react";
import { fetchEmployees, type Employee } from "../api/client";

export default function Downloads() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const installerUrl = import.meta.env.VITE_INSTALLER_URL || "https://employee-monitor-installers.onrender.com";
  const apiKey = "agent-secret-key-2026"; // matches backend default

  function installCmd(platform: "macos" | "linux" | "windows") {
    if (!selected) return "Select an employee first";

    const base = `EMPLOYEE_ID="${selected}" API_URL="${apiUrl}/api" API_KEY="${apiKey}"`;

    switch (platform) {
      case "macos":
        return `curl -fsSL ${installerUrl}/installers/install-macos.sh | ${base} bash`;
      case "linux":
        return `curl -fsSL ${installerUrl}/installers/install-linux.sh | ${base} bash`;
      case "windows":
        return `$env:EMPLOYEE_ID="${selected}"; $env:API_URL="${apiUrl}/api"; $env:API_KEY="${apiKey}"; irm ${installerUrl}/installers/install-windows.ps1 | iex`;
    }
  }

  function manualSteps() {
    if (!selected) return [];
    return [
      `1. Install Node.js 20+ from https://nodejs.org`,
      `2. Download the agent: git clone <your-repo> employee-monitor-agent`,
      `3. cd employee-monitor-agent && npm install`,
      `4. Run setup: npm run setup`,
      `   → Server URL: ${apiUrl}/api`,
      `   → API Key: ${apiKey}`,
      `   → Employee ID: ${selected}`,
      `5. Start: npm start`,
    ];
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agent Downloads</h1>
        <p className="text-gray-500 mt-1">
          Generate install commands for employee machines
        </p>
      </div>

      {/* Employee selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Employee
        </label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">— Choose an employee —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.email})
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Employee ID:</span>
            <code className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded font-mono">
              {selected}
            </code>
          </div>
        )}
      </div>

      {/* Install commands per platform */}
      {selected && (
        <div className="space-y-4">
          {(["macos", "linux", "windows"] as const).map((platform) => {
            const cmd = installCmd(platform);
            const labels = {
              macos: { name: "macOS", icon: "🍎" },
              linux: { name: "Linux", icon: "🐧" },
              windows: { name: "Windows", icon: "🪟" },
            };

            return (
              <div
                key={platform}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {labels[platform].icon} {labels[platform].name}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(cmd, platform)}
                    className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {copied === platform ? "Copied!" : "Copy command"}
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono">
                  {cmd}
                </pre>
              </div>
            );
          })}

          {/* Manual install steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Manual Installation
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {manualSteps().map((step, i) => (
                <p key={i} className="text-sm text-gray-700 font-mono mb-1">
                  {step}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
