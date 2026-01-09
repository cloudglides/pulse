"use client";

import { useEffect, useState } from "react";
import { config } from "./config";
import {
  SkeletonStatsCard,
  SkeletonServiceCard,
  SkeletonChart,
  SkeletonNewsItem,
  SkeletonRepoCard,
} from "./components/Skeleton";
import { ServiceContextMenu } from "./components/ServiceContextMenu";
import { LogsViewer } from "./components/LogsViewer";
import { NotificationsContainer } from "./components/Notification";
import { FeedManager } from "./components/FeedManager";
import { LayoutCustomizer } from "./components/LayoutCustomizer";
import { UptimeDisplay } from "./components/UptimeDisplay";
import { useLayout } from "./hooks/useLayout";
import { useUptime } from "./hooks/useUptime";

interface Service {
  id: string;
  name: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  ports: string[];
  image: string;
}

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid?: string;
}

interface Repo {
  name: string;
  stars: number;
  forks: number;
  language: string;
  description: string;
  url: string;
}

export default function Home() {
  const { layout, loaded: layoutLoaded, toggleComponent, reorderComponents, getVisibleComponents } = useLayout();
  const { uptime, trackStatus } = useUptime();
  const [services, setServices] = useState<Service[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [diskHistory, setDiskHistory] = useState<number[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    serviceId: string;
    serviceName: string;
    status: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceLogs, setSelectedServiceLogs] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: "info" | "warning" | "error" | "success" }>
  >([]);
  const [previousServices, setPreviousServices] = useState<Service[]>([]);
  const [rssFeeds, setRssFeeds] = useState<string[]>(config.rssFeeds);
  const [feedManagerOpen, setFeedManagerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [feedsLoaded, setFeedsLoaded] = useState(false);

  useEffect(() => {
    const savedFeeds = localStorage.getItem("rss_feeds");
    if (savedFeeds) {
      const feeds = JSON.parse(savedFeeds);
      if (feeds.length > 0) {
        setRssFeeds(feeds);
      } else {
        setRssFeeds(config.rssFeeds);
        localStorage.setItem("rss_feeds", JSON.stringify(config.rssFeeds));
      }
    } else {
      localStorage.setItem("rss_feeds", JSON.stringify(config.rssFeeds));
    }
    
    const savedNews = localStorage.getItem("rss_news");
    if (savedNews) {
      const news = JSON.parse(savedNews);
      setNewsItems(news);
    }
    
    setFeedsLoaded(true);
  }, []);

  useEffect(() => {
    let lastNewsFetch = 0;

    const fetchAllData = async () => {
      try {
        const now = Date.now();
        const shouldFetchNews = now - lastNewsFetch > config.api.newsInterval;

        const requests = [
          fetch("/api/services"),
          fetch("/api/github"),
          fetch("/api/system"),
        ];

        if ((shouldFetchNews || newsItems.length === 0) && rssFeeds.length > 0) {
          const feedParams = new URLSearchParams();
          rssFeeds.forEach(feed => feedParams.append('feeds', feed));
          requests.push(fetch(`/api/rss?${feedParams}`));
          lastNewsFetch = now;
        }

        const responses = await Promise.all(requests);
        const [servicesRes, githubRes, systemRes, ...newsRes] = responses;

        const promises = [
          servicesRes.json(),
          githubRes.json().catch(() => ({ repos: [] })),
          systemRes.json().catch(() => ({})),
        ];

        if (shouldFetchNews && newsRes.length > 0) {
          promises.push(newsRes[0].json().catch(() => ({ items: [] })));
        }

        const data = await Promise.all(promises);
        const [servicesData, githubData, systemData, ...newsData] = data;

        const newServices = servicesData.services || [];
        setServices(newServices);
        setRepos(githubData.repos || []);
        setSystemStats(systemData);

        if (previousServices.length > 0) {
          newServices.forEach((newService: Service) => {
            const oldService = previousServices.find((s) => s.id === newService.id);
            if (oldService && oldService.status === "running" && newService.status !== "running") {
              addNotification(`${newService.name} stopped`, "error");
              trackStatus(newService.id, "down");
            }
            if (oldService && oldService.status !== "running" && newService.status === "running") {
              addNotification(`${newService.name} started`, "success");
              trackStatus(newService.id, "up");
            }
            if (newService.status === "running" && newService.cpuUsage > 80) {
              addNotification(`${newService.name} high CPU usage: ${newService.cpuUsage.toFixed(1)}%`, "warning");
            }
            if (newService.status === "running" && newService.memoryUsage > 80) {
              addNotification(`${newService.name} high memory usage: ${newService.memoryUsage.toFixed(1)}%`, "warning");
            }
            if (newService.status === "running") {
              trackStatus(newService.id, "up");
            }
          });
          setPreviousServices(newServices);
        } else if (newServices.length > 0) {
          newServices.forEach((s: Service) => {
            trackStatus(s.id, s.status === "running" ? "up" : "down");
          });
          setPreviousServices(newServices);
        }

        if (shouldFetchNews && newsData.length >= 1) {
          const items = newsData[0].items || [];
          setNewsItems(items);
          localStorage.setItem("rss_news", JSON.stringify(items));
        }

        if (systemData.memory) {
          setMemoryHistory((prev) => [
            ...prev.slice(-19),
            systemData.memory.percent,
          ]);
        }
        if (systemData.disk) {
          setDiskHistory((prev) => [
            ...prev.slice(-19),
            systemData.disk.percent,
          ]);
        }
        if (systemData.cpu !== undefined) {
          setCpuHistory((prev) => [
            ...prev.slice(-19),
            systemData.cpu,
          ]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (feedsLoaded) {
      if (rssFeeds.length === 0) {
        setNewsItems([]);
      } else {
        fetchAllData();
        const interval = setInterval(fetchAllData, config.api.pollInterval);
        return () => clearInterval(interval);
      }
    }
  }, [rssFeeds, feedsLoaded]);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const statusColor = (value: number) => {
    if (value < 70) return { color: "#6ee7a8", label: "OK", severity: 0 };
    if (value < 85) return { color: "#f0883e", label: "WARNING", severity: 1 };
    return { color: "#f85149", label: "CRITICAL", severity: 2 };
  };

  const chartPoints = (history: number[]) => {
    if (history.length === 0) return "0,40 200,40";
    if (history.length === 1) {
      const y = 40 - (Math.min(Math.max(history[0], 0), 100) / 100) * 40;
      return `0,${y.toFixed(1)} 200,${y.toFixed(1)}`;
    }
    const points = history
      .map((value, i) => {
        const x = (i / Math.max(history.length - 1, 1)) * 200;
        const y = 40 - (Math.min(Math.max(value, 0), 100) / 100) * 40;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return points;
  };

  const diskHealth = statusColor(systemStats?.disk?.percent || 0);
  const memoryHealth = statusColor(systemStats?.memory?.percent || 0);
  const runningCount = services.filter((s) => s.status === "running").length;

  const performAction = async (action: string, containerId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, containerId }),
      });
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleServiceContextMenu = (
    e: React.MouseEvent,
    serviceId: string,
    serviceName: string,
    status: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      serviceId,
      serviceName,
      status,
    });
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addNotification = (message: string, type: "info" | "warning" | "error" | "success") => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const topCpuServices = [...services]
    .filter((s) => s.status === "running")
    .sort((a, b) => b.cpuUsage - a.cpuUsage)
    .slice(0, 3)
    .map((s) => s.id);

  const topMemoryServices = [...services]
    .filter((s) => s.status === "running")
    .sort((a, b) => b.memoryUsage - a.memoryUsage)
    .slice(0, 3)
    .map((s) => s.id);

  if (!layoutLoaded) {
    return <div className="h-screen bg-[#1a1a1a]" />;
  }

  const renderSection = (id: "services" | "metrics" | "news" | "repositories") => {
    const isVisible = layout.components[id].visible;
    if (!isVisible) return null;

    if (id === "services") {
      return (
        <div key="services">
          {layout.components.services.visible && (
          <div>
            <h2 className="text-sm md:text-base font-bold text-[#f5f5f5] mb-2 uppercase">
              Services
            </h2>
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 mb-2 bg-[#242424] border border-[#333333] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#6ee7a8] transition-colors"
            />
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <SkeletonServiceCard key={i} />
                  ))}
                </>
              ) : (
                filteredServices.map((s) => (
                  <div
                    key={s.id}
                    className={`border rounded p-2 md:p-3 bg-[#242424] transition-all duration-300 ease-out group cursor-pointer ${
                      topCpuServices.includes(s.id) || topMemoryServices.includes(s.id)
                        ? "border-[#f0883e]"
                        : "border-[#333333] hover:border-[#6ee7a8]"
                    } ${s.status !== "running" ? "opacity-60" : ""} ${actionLoading ? "opacity-50 pointer-events-none" : ""}`}
                    style={{
                      animation: 'slideIn 0.3s ease-out'
                    }}
                    onContextMenu={(e) => handleServiceContextMenu(e, s.id, s.name, s.status)}
                    onClick={() => setSelectedServiceLogs({ id: s.id, name: s.name })}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h4 className="text-xs md:text-sm font-bold text-[#f5f5f5] truncate">
                          {s.name}
                        </h4>
                        {topCpuServices.includes(s.id) && (
                          <span className="text-xs px-1.5 py-0.5 bg-[#f0883e]/20 text-[#f0883e] rounded whitespace-nowrap flex-shrink-0">
                            Top CPU
                          </span>
                        )}
                        {topMemoryServices.includes(s.id) && (
                          <span className="text-xs px-1.5 py-0.5 bg-[#f0883e]/20 text-[#f0883e] rounded whitespace-nowrap flex-shrink-0">
                            Top Mem
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {s.status === "running" ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                performAction("stop", s.id);
                              }}
                              className="px-2 py-1 bg-[#f85149]/20 text-[#f85149] rounded text-xs font-semibold hover:bg-[#f85149]/30 transition-colors"
                            >
                              Stop
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                performAction("restart", s.id);
                              }}
                              className="px-2 py-1 bg-[#865DFF]/20 text-[#865DFF] rounded text-xs font-semibold hover:bg-[#865DFF]/30 transition-colors"
                            >
                              Restart
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              performAction("start", s.id);
                            }}
                            className="px-2 py-1 bg-[#6ee7a8]/20 text-[#6ee7a8] rounded text-xs font-semibold hover:bg-[#6ee7a8]/30 transition-colors"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {s.status === "running" && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#888888]">
                            CPU: <span className={`font-semibold ${topCpuServices.includes(s.id) ? "text-[#f0883e]" : "text-[#6ee7a8]"}`}>{s.cpuUsage.toFixed(1)}%</span>
                          </span>
                          <span className="text-[#888888]">
                            Mem: <span className={`font-semibold ${topMemoryServices.includes(s.id) ? "text-[#f0883e]" : "text-[#6ee7a8]"}`}>{s.memoryUsage.toFixed(1)}%</span>
                          </span>
                        </div>
                      )}
                      {s.ports && s.ports.length > 0 && (
                        <div className="text-xs text-[#666666]">
                          Ports: {s.ports.slice(0, 2).join(", ")}{s.ports.length > 2 ? "..." : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <UptimeDisplay percent={uptime[s.id]?.percent || 0} lastDown={uptime[s.id]?.lastDown} />
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                        s.status === "running"
                          ? "bg-[#6ee7a8]/20 text-[#6ee7a8]"
                          : "bg-[#f85149]/20 text-[#f85149]"
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          s.status === "running"
                            ? "bg-[#6ee7a8]"
                            : "bg-[#f85149]"
                        }`} />
                        {s.status === "running" ? "Running" : "Stopped"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      );
    }

    if (id === "metrics") {
      return (
        <div key="metrics">
          {layout.components.metrics.visible && (
          <div>
            <h2 className="text-sm md:text-base font-bold text-[#f5f5f5] mb-2 uppercase">
              System Metrics
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <SkeletonChart key={i} />
                ))}
              </>
            ) : (
              <>
                <div className="border border-[#333333] rounded p-2 md:p-3 bg-[#242424] transition-all duration-300 flex flex-col">
                  <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-1">Memory</h3>
                  <div className="mb-2">
                    <span className="text-base md:text-xl font-black text-[#6ee7a8] transition-all duration-500">
                      {systemStats?.memory ? `${systemStats.memory.percent.toFixed(0)}%` : "--"}
                    </span>
                  </div>
                  <svg viewBox="0 0 200 40" className="w-full h-20">
                    <defs>
                      <linearGradient id="memGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6ee7a8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6ee7a8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points={chartPoints(memoryHistory)}
                      fill="none"
                      stroke="#6ee7a8"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points={`${chartPoints(memoryHistory)} 200,40 0,40`}
                      fill="url(#memGradient)"
                    />
                  </svg>
                </div>

                <div className="border border-[#333333] rounded p-2 md:p-3 bg-[#242424] transition-all duration-300 flex flex-col">
                  <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-1">Disk</h3>
                  <div className="mb-2">
                    <span className="text-base md:text-xl font-black text-[#f0883e] transition-all duration-500">
                      {systemStats?.disk ? `${systemStats.disk.percent.toFixed(0)}%` : "--"}
                    </span>
                  </div>
                  <svg viewBox="0 0 200 40" className="w-full h-20">
                    <defs>
                      <linearGradient id="diskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f0883e" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f0883e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points={chartPoints(diskHistory)}
                      fill="none"
                      stroke="#f0883e"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points={`${chartPoints(diskHistory)} 200,40 0,40`}
                      fill="url(#diskGradient)"
                    />
                  </svg>
                </div>

                <div className="border border-[#333333] rounded p-2 md:p-3 bg-[#242424] transition-all duration-300 flex flex-col">
                  <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-1">CPU</h3>
                  <div className="mb-2">
                    <span className="text-base md:text-xl font-black text-[#865DFF] transition-all duration-500">
                      {systemStats?.cpu ? `${systemStats.cpu.toFixed(1)}%` : "--"}
                    </span>
                  </div>
                  <svg viewBox="0 0 200 40" className="w-full h-20">
                    <defs>
                      <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#865DFF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#865DFF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points={chartPoints(cpuHistory)}
                      fill="none"
                      stroke="#865DFF"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points={`${chartPoints(cpuHistory)} 200,40 0,40`}
                      fill="url(#cpuGradient)"
                    />
                  </svg>
                </div>
              </>
            )}
            </div>
          </div>
          )}
        </div>
      );
    }

    if (id === "news") {
      return (
        <div key="news" className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-2xl font-black text-[#f5f5f5] uppercase tracking-wider">
              News
            </h2>
            <button
              onClick={() => setFeedManagerOpen(true)}
              className="px-3 py-1.5 bg-[#865DFF]/20 text-[#865DFF] rounded text-xs font-semibold hover:bg-[#865DFF]/30 transition-colors"
            >
              Manage Feeds
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              <div>
                <div className="space-y-2">
                  {loading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <SkeletonNewsItem key={i} />
                      ))}
                    </>
                  ) : (
                     newsItems.slice(0, 3).map((item) => (
                       <a
                         key={`${item.link}-${item.pubDate}`}
                         href={item.link}
                         target="_blank"
                         rel="noreferrer"
                         className="pb-2 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-2 px-2 py-1 rounded transition-all duration-200 cursor-pointer block"
                       >
                         <h3 className="text-xs md:text-sm font-bold text-[#f5f5f5] leading-tight mb-1 group-hover:text-[#865DFF] transition-colors line-clamp-2">
                           {item.title}
                         </h3>
                         <p className="text-xs text-[#666666] mb-1 line-clamp-1">
                           {item.description}
                         </p>
                         <div className="text-xs text-[#555555]">
                           {timeAgo(item.pubDate)}
                         </div>
                       </a>
                     ))
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (id === "repositories") {
      return (
        <div key="repositories" className="space-y-3">
          <h2 className="text-base md:text-2xl font-black text-[#f5f5f5] uppercase tracking-wider">
            Repositories
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonRepoCard key={i} />
                ))}
              </>
            ) : repos.length > 0 ? (
              repos.slice(0, 9).map((repo, i) => (
                <a
                  key={i}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-[#333333] rounded p-3 bg-[#242424] hover:border-[#865DFF] transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#999999]">
                        cloudglides
                      </span>
                    </div>
                    <svg
                      className="w-3 h-3 text-[#666666] group-hover:text-[#865DFF] transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-[#865DFF] mb-2">
                    {repo.name.split("/")[1]}
                  </h4>
                  <p className="text-xs text-[#d5d5d5] mb-2 line-clamp-2">
                    {repo.description || "No description"}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    {repo.language && (
                      <span className="flex items-center gap-1 text-[#d5d5d5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#865DFF]" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#888888]">
                      <span>⭐</span>
                      {repo.stars}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-xs text-[#555555]">
                No repos found
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-screen bg-[#1a1a1a] overflow-hidden flex flex-col">
      <button
        onClick={() => setEditMode(!editMode)}
        className={`fixed top-4 right-4 z-40 px-3 py-2 rounded text-xs font-bold transition-all ${
          editMode
            ? "bg-[#f0883e] text-[#1a1a1a] hover:bg-[#f0883e]/80"
            : "bg-[#865DFF]/20 text-[#865DFF] hover:bg-[#865DFF]/30"
        }`}
      >
        {editMode ? "Done" : "Layout"}
      </button>
      <NotificationsContainer notifications={notifications} onClose={removeNotification} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-8 lg:px-12 py-4 md:py-6">
          {loading && <SkeletonStatsCard />}
          
          {services.length > 0 && (
            <div className="space-y-6">
            <div className="border border-[#444444] rounded-lg p-4 md:p-6 bg-[#242424] transition-all duration-300">
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div className="text-center space-y-2 transition-all duration-300">
                  <div className="text-xs md:text-sm font-bold text-[#999999] uppercase tracking-wider">
                    Memory
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="text-4xl md:text-6xl lg:text-8xl font-light transition-all duration-500"
                      style={{ color: memoryHealth.color, lineHeight: 1 }}
                    >
                      {systemStats?.memory
                        ? `${systemStats.memory.percent.toFixed(0)}`
                        : "--"}
                    </div>
                    <div className="text-xs md:text-lg text-[#666666] font-light">%</div>
                  </div>
                  <div
                    className="text-xs md:text-sm font-bold"
                    style={{ color: memoryHealth.color }}
                  >
                    {memoryHealth.label}
                  </div>
                </div>

                <div className="text-center space-y-2 border-l border-r border-[#444444]">
                  <div className="text-xs md:text-sm font-bold text-[#999999] uppercase tracking-wider">
                    Disk
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="text-4xl md:text-6xl lg:text-8xl font-light transition-all duration-500"
                      style={{ color: diskHealth.color, lineHeight: 1 }}
                    >
                      {systemStats?.disk
                        ? `${systemStats.disk.percent.toFixed(0)}`
                        : "--"}
                    </div>
                    <div className="text-xs md:text-lg text-[#666666] font-light">%</div>
                  </div>
                  <div
                    className="text-xs md:text-sm font-bold"
                    style={{ color: diskHealth.color }}
                  >
                    {diskHealth.label}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-xs md:text-sm font-bold text-[#999999] uppercase tracking-wider">
                    Services
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="text-4xl md:text-6xl lg:text-8xl font-light text-[#6ee7a8]"
                      style={{ lineHeight: 1 }}
                    >
                      {runningCount}
                    </div>
                    <div className="text-xs md:text-lg text-[#6ee7a8] font-light">
                      active
                    </div>
                  </div>
                  <div className="text-xs md:text-sm font-bold text-[#6ee7a8]">Running</div>
                </div>
              </div>
            </div>

            {[...Object.values(layout.components)]
              .sort((a, b) => a.order - b.order)
              .map(comp => {
                return renderSection(comp.id as any);
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>
      <LayoutCustomizer
        editMode={editMode}
        onClose={() => setEditMode(false)}
        layout={layout}
        toggleComponent={toggleComponent}
        reorderComponents={reorderComponents}
      />
      {contextMenu && (
        <ServiceContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          serviceId={contextMenu.serviceId}
          serviceName={contextMenu.serviceName}
          status={contextMenu.status}
          onClose={() => setContextMenu(null)}
          onStart={(id) => performAction("start", id)}
          onStop={(id) => performAction("stop", id)}
          onRestart={(id) => performAction("restart", id)}
          onRemove={(id) => performAction("remove", id)}
        />
      )}
      {selectedServiceLogs && (
        <LogsViewer
          serviceId={selectedServiceLogs.id}
          serviceName={selectedServiceLogs.name}
          onClose={() => setSelectedServiceLogs(null)}
        />
      )}
      <FeedManager
        isOpen={feedManagerOpen}
        onClose={() => setFeedManagerOpen(false)}
        feeds={rssFeeds}
        onFeedsChange={setRssFeeds}
      />
    </div>
  );
}
