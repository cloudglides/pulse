interface UptimeDisplayProps {
  percent: number;
  lastDown?: number;
}

export function UptimeDisplay({ percent, lastDown }: UptimeDisplayProps) {
  const getColor = (p: number) => {
    if (p >= 99.5) return "#6ee7a8";
    if (p >= 95) return "#f0883e";
    return "#f85149";
  };

  const formatLastDown = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <span className="text-xs font-semibold" style={{ color: getColor(percent) }}>
          {percent.toFixed(2)}%
        </span>
        <span className="text-xs text-[#666666]">
          down: {formatLastDown(lastDown)}
        </span>
      </div>
    </div>
  );
}
