import { useState } from "react";
import { Website } from "@/app/hooks/useWebsites";

interface WebsiteMonitorProps {
  websites: Website[];
  onAdd: (name: string, url: string) => void;
  onRemove: (id: string) => void;
  onCheck: (website: Website) => void;
}

export function WebsiteMonitor({
  websites,
  onAdd,
  onRemove,
  onCheck,
}: WebsiteMonitorProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) {
      setError("Name and URL required");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Invalid URL");
      return;
    }

    onAdd(name, url);
    setName("");
    setUrl("");
    setError("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "#6ee7a8";
      case "down":
        return "#f85149";
      case "checking":
        return "#f0883e";
      default:
        return "#999999";
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div>
      <h2 className="text-sm md:text-base font-bold text-[#f5f5f5] mb-2 uppercase">
        Website Uptime
      </h2>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Site name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#6ee7a8]"
          />
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#6ee7a8]"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-[#6ee7a8]/20 text-[#6ee7a8] rounded text-xs font-semibold hover:bg-[#6ee7a8]/30"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-[#f85149]">{error}</p>}

        <div className="space-y-2">
          {websites.length === 0 ? (
            <p className="text-xs text-[#666666]">No websites added</p>
          ) : (
            websites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded border border-[#333333] group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(site.status) }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#f5f5f5]">
                      {site.name}
                    </p>
                    <p className="text-xs text-[#666666] truncate">{site.url}</p>
                    {site.status !== "checking" && (
                      <p className="text-xs text-[#999999]">
                        {formatTime(site.responseTime)} •{" "}
                        {new Date(site.lastCheck).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onCheck(site)}
                    disabled={site.status === "checking"}
                    className="px-2 py-1 bg-[#865DFF]/20 text-[#865DFF] rounded text-xs disabled:opacity-50 hover:bg-[#865DFF]/30"
                  >
                    {site.status === "checking" ? "..." : "Check"}
                  </button>
                  <button
                    onClick={() => onRemove(site.id)}
                    className="px-2 py-1 bg-[#f85149]/20 text-[#f85149] rounded text-xs opacity-0 group-hover:opacity-100 hover:bg-[#f85149]/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
