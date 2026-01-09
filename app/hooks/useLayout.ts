import { useState, useEffect } from "react";

export type ComponentId = "services" | "metrics" | "news" | "repositories";

export interface LayoutComponent {
  id: ComponentId;
  visible: boolean;
  order: number;
}

export interface Layout {
  components: Record<ComponentId, LayoutComponent>;
  lastUpdated: number;
}

const defaultLayout: Layout = {
  components: {
    services: { id: "services", visible: true, order: 0 },
    metrics: { id: "metrics", visible: true, order: 1 },
    news: { id: "news", visible: true, order: 2 },
    repositories: { id: "repositories", visible: true, order: 3 },
  },
  lastUpdated: Date.now(),
};

export function useLayout() {
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app_layout");
    if (saved) {
      try {
        setLayout(JSON.parse(saved));
      } catch {
        setLayout(defaultLayout);
      }
    }
    setLoaded(true);
  }, []);

  const saveLayout = (newLayout: Layout) => {
    const updated = { ...newLayout, lastUpdated: Date.now() };
    setLayout(updated);
    localStorage.setItem("app_layout", JSON.stringify(updated));
  };

  const toggleComponent = (id: ComponentId) => {
    const updated = {
      ...layout,
      components: {
        ...layout.components,
        [id]: { ...layout.components[id], visible: !layout.components[id].visible },
      },
    };
    saveLayout(updated);
  };

  const reorderComponents = (fromIndex: number, toIndex: number) => {
    const sortedComponents = Object.values(layout.components).sort((a, b) => a.order - b.order);
    const moved = sortedComponents[fromIndex];
    
    const reordered = sortedComponents.filter((_, i) => i !== fromIndex);
    reordered.splice(toIndex, 0, moved);

    const newComponents: Record<ComponentId, LayoutComponent> = {};
    reordered.forEach((comp, idx) => {
      newComponents[comp.id] = { ...comp, order: idx };
    });

    const updated = { ...layout, components: newComponents };
    saveLayout(updated);
  };

  const resetLayout = () => {
    saveLayout(defaultLayout);
  };

  const getVisibleComponents = () => {
    return Object.values(layout.components)
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order);
  };

  return {
    layout,
    loaded,
    toggleComponent,
    reorderComponents,
    resetLayout,
    getVisibleComponents,
  };
}
