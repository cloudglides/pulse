import { useState, useEffect } from "react";

interface UptimeEntry {
  serviceId: string;
  timestamp: number;
  status: "up" | "down";
}

interface ServiceUptime {
  serviceId: string;
  percent: number;
  lastDown?: number;
  lastUp?: number;
}

export function useUptime() {
  const [uptime, setUptime] = useState<Record<string, ServiceUptime>>({});

  useEffect(() => {
    const stored = localStorage.getItem("service_uptime");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const processed: Record<string, ServiceUptime> = {};
        
        Object.entries(data).forEach(([serviceId, entries]: [string, any]) => {
          const sorted = entries.sort((a: UptimeEntry, b: UptimeEntry) => a.timestamp - b.timestamp);
          const now = Date.now();
          const day = 24 * 60 * 60 * 1000;
          const recent = sorted.filter((e: UptimeEntry) => now - e.timestamp < day);
          
          if (recent.length === 0) {
            processed[serviceId] = { serviceId, percent: 100 };
            return;
          }

          let upSeconds = 0;
          for (let i = 0; i < recent.length; i++) {
            if (recent[i].status === "up") {
              const nextTime = recent[i + 1]?.timestamp || now;
              upSeconds += nextTime - recent[i].timestamp;
            }
          }

          const totalTime = now - recent[0].timestamp;
          const percent = totalTime > 0 ? (upSeconds / totalTime) * 100 : 100;
          
          const lastDownEntry = recent.reverse().find((e: UptimeEntry) => e.status === "down");
          const lastUpEntry = sorted.reverse().find((e: UptimeEntry) => e.status === "up");

          processed[serviceId] = {
            serviceId,
            percent: Math.min(100, Math.max(0, percent)),
            lastDown: lastDownEntry?.timestamp,
            lastUp: lastUpEntry?.timestamp,
          };
        });

        setUptime(processed);
      } catch {}
    }
  }, []);

  const trackStatus = (serviceId: string, status: "up" | "down") => {
    const stored = localStorage.getItem("service_uptime") || "{}";
    const data = JSON.parse(stored);
    
    if (!data[serviceId]) data[serviceId] = [];
    data[serviceId].push({ serviceId, timestamp: Date.now(), status });
    
    const day = 24 * 60 * 60 * 1000;
    data[serviceId] = data[serviceId].filter((e: UptimeEntry) => Date.now() - e.timestamp < day);
    
    localStorage.setItem("service_uptime", JSON.stringify(data));
  };

  return { uptime, trackStatus };
}
