import { useState, useEffect } from "react";

export interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "checking";
  responseTime: number;
  lastCheck: number;
}

export function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("monitored_websites");
    if (stored) {
      try {
        setWebsites(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const addWebsite = (name: string, url: string) => {
    const newWebsite: Website = {
      id: Math.random().toString(36).slice(2),
      name,
      url,
      status: "checking",
      responseTime: 0,
      lastCheck: Date.now(),
    };
    const updated = [...websites, newWebsite];
    setWebsites(updated);
    localStorage.setItem("monitored_websites", JSON.stringify(updated));
    checkWebsite(newWebsite);
  };

  const removeWebsite = (id: string) => {
    const updated = websites.filter((w) => w.id !== id);
    setWebsites(updated);
    localStorage.setItem("monitored_websites", JSON.stringify(updated));
  };

  const checkWebsite = async (website: Website) => {
    setWebsites((prev) =>
      prev.map((w) =>
        w.id === website.id ? { ...w, status: "checking" as const } : w
      )
    );

    try {
      const start = Date.now();
      const response = await fetch(`/api/health?url=${encodeURIComponent(website.url)}`);
      const responseTime = Date.now() - start;
      const isUp = response.ok || response.status < 500;

      setWebsites((prev) =>
        prev.map((w) =>
          w.id === website.id
            ? {
                ...w,
                status: isUp ? "up" : "down",
                responseTime,
                lastCheck: Date.now(),
              }
            : w
        )
      );
    } catch {
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === website.id
            ? { ...w, status: "down", lastCheck: Date.now() }
            : w
        )
      );
    }
  };

  const checkAll = async () => {
    for (const website of websites) {
      await checkWebsite(website);
    }
  };

  useEffect(() => {
    if (websites.length === 0) return;

    const interval = setInterval(() => {
      checkAll();
    }, 30000);

    checkAll();
    return () => clearInterval(interval);
  }, [websites.length]);

  return { websites, addWebsite, removeWebsite, checkWebsite, checkAll };
}
