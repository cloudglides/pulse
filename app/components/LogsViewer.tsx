import { useEffect, useState } from "react";

interface LogsViewerProps {
  serviceId: string;
  serviceName: string;
  onClose: () => void;
}

export function LogsViewer({
  serviceId,
  serviceName,
  onClose,
}: LogsViewerProps) {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `/api/services/logs?containerId=${serviceId}`,
        );
        const data = await response.json();
        setLogs(data.logs || "No logs available");
      } catch (error) {
        setLogs("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [serviceId]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
        onClick={onClose}
      />
      <div className="fixed inset-4 z-50 flex flex-col bg-[#1a1a1a] border border-[#333333] rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#333333]">
          <h2 className="text-base font-bold text-[#f5f5f5]">
            Logs: {serviceName}
          </h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#f5f5f5] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
          {loading ? (
            <div className="text-[#666666] text-sm">Loading logs...</div>
          ) : (
            <pre className="text-xs text-[#888888] font-mono whitespace-pre-wrap break-words">
              {logs}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}
