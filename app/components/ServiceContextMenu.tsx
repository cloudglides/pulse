interface ServiceContextMenuProps {
  x: number;
  y: number;
  serviceId: string;
  serviceName: string;
  status: string;
  onClose: () => void;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ServiceContextMenu({
  x,
  y,
  serviceId,
  serviceName,
  status,
  onClose,
  onStart,
  onStop,
  onRestart,
  onRemove,
}: ServiceContextMenuProps) {
  const isRunning = status === "running";

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        className="fixed z-50 bg-[#242424] border border-[#333333] rounded shadow-lg min-w-48"
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
      >
        <div className="p-2 text-xs text-[#999999] font-semibold px-3 py-2 border-b border-[#333333]">
          {serviceName}
        </div>
        <div className="py-1">
          {isRunning ? (
            <>
              <button
                onClick={() => {
                  onStop(serviceId);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#f85149] hover:bg-[#2a2a2a] transition-colors"
              >
                Stop
              </button>
              <button
                onClick={() => {
                  onRestart(serviceId);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#865DFF] hover:bg-[#2a2a2a] transition-colors"
              >
                Restart
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onStart(serviceId);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#6ee7a8] hover:bg-[#2a2a2a] transition-colors"
            >
              Start
            </button>
          )}
          <button
            onClick={() => {
              onRemove(serviceId);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-xs text-[#888888] hover:bg-[#2a2a2a] transition-colors border-t border-[#333333] mt-1"
          >
            Remove
          </button>
        </div>
      </div>
    </>
  );
}
