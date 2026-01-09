import { ComponentId, Layout } from "@/app/hooks/useLayout";

const componentNames: Record<ComponentId, string> = {
  services: "Services",
  metrics: "System Metrics",
  news: "News",
  repositories: "Repositories",
};

interface LayoutCustomizerProps {
  editMode: boolean;
  onClose: () => void;
  layout: Layout;
  toggleComponent: (id: ComponentId) => void;
  reorderComponents: (fromIndex: number, toIndex: number) => void;
}

export function LayoutCustomizer({ editMode, onClose, layout, toggleComponent, reorderComponents }: LayoutCustomizerProps) {
  const components = Object.values(layout.components).sort((a, b) => a.order - b.order);

  if (!editMode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-[#242424] border-t border-[#444444] w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-[#242424] border-b border-[#444444] p-4 flex justify-between items-center pointer-events-auto">
          <h3 className="text-sm font-bold text-[#f5f5f5] uppercase">Customize Layout</h3>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#f5f5f5] text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {components.map((comp, idx) => (
            <div key={comp.id} className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded border border-[#333333]">
              <div className="flex-1">
                <p className="text-xs font-bold text-[#f5f5f5]">{componentNames[comp.id]}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (idx > 0) reorderComponents(idx, idx - 1);
                  }}
                  disabled={idx === 0}
                  className="px-2 py-1 bg-[#865DFF]/20 text-[#865DFF] rounded text-xs disabled:opacity-30 hover:bg-[#865DFF]/30"
                >
                  ↑
                </button>
                
                <button
                  onClick={() => {
                    if (idx < components.length - 1) reorderComponents(idx, idx + 1);
                  }}
                  disabled={idx === components.length - 1}
                  className="px-2 py-1 bg-[#865DFF]/20 text-[#865DFF] rounded text-xs disabled:opacity-30 hover:bg-[#865DFF]/30"
                >
                  ↓
                </button>

                <button
                  onClick={() => toggleComponent(comp.id)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    comp.visible
                      ? "bg-[#6ee7a8]/20 text-[#6ee7a8] hover:bg-[#6ee7a8]/30"
                      : "bg-[#f85149]/20 text-[#f85149] hover:bg-[#f85149]/30"
                  }`}
                >
                  {comp.visible ? "Show" : "Hide"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
