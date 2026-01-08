"use client";

import { useEffect, useState } from "react";
import { config } from "./config";

interface Service {
  id: string;
  name: string;
  status: string;
  cpuUsage: number;
}

interface HNStory {
  title: string;
  score: number;
  by: string;
  time: number;
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
  const [services, setServices] = useState<Service[]>([]);
  const [hnStories, setHnStories] = useState<HNStory[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [diskHistory, setDiskHistory] = useState<number[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

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

        if (shouldFetchNews) {
          requests.push(fetch("/api/hacker-news"));
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
          promises.push(newsRes[0].json().catch(() => ({ stories: [] })));
        }

        const data = await Promise.all(promises);
        const [servicesData, githubData, systemData, ...newsData] = data;

        setServices(servicesData.services || []);
        setRepos(githubData.repos || []);
        setSystemStats(systemData);

        if (shouldFetchNews && newsData.length >= 1) {
          setHnStories(newsData[0].stories || []);
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
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, config.api.pollInterval);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000 - timestamp) / 1);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getHealthStatus = (value: number) => {
    if (value < 70) return { color: "#6ee7a8", label: "OK", severity: 0 };
    if (value < 85) return { color: "#f0883e", label: "WARNING", severity: 1 };
    return { color: "#f85149", label: "CRITICAL", severity: 2 };
  };

  const historyToPoints = (history: number[]) => {
    if (history.length === 0) return "0,80 200,80";
    if (history.length === 1) {
      const y = 80 - (Math.min(Math.max(history[0], 0), 100) / 100) * 80;
      return `0,${y.toFixed(1)} 200,${y.toFixed(1)}`;
    }
    const points = history
      .map((value, i) => {
        const x = (i / Math.max(history.length - 1, 1)) * 200;
        const y = 80 - (Math.min(Math.max(value, 0), 100) / 100) * 80;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return points;
  };

  const diskHealth = getHealthStatus(systemStats?.disk?.percent || 0);
  const memoryHealth = getHealthStatus(systemStats?.memory?.percent || 0);
  const runningCount = services.filter((s) => s.status === "running").length;

  return (
    <div className="h-screen bg-[#1a1a1a] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-8 lg:px-12 py-4 md:py-6">
          {services.length > 0 && (
            <>
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

              <div className="space-y-3">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#f5f5f5] mb-2 uppercase">
                    Services
                  </h2>
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {services.map((s) => (
                        <div
                          key={s.id}
                          className={`border border-[#333333] rounded p-2 md:p-3 bg-[#242424] hover:border-[#6ee7a8] transition-all duration-300 ease-out group flex items-center justify-between transform ${
                            s.status !== "running" ? "opacity-60" : ""
                          }`}
                          style={{
                            animation: 'slideIn 0.3s ease-out'
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-bold text-[#f5f5f5] mb-0.5 truncate">
                              {s.name}
                            </h4>
                            {s.status === "running" && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-[#888888]">
                                  CPU: <span className="text-[#6ee7a8] font-semibold">{s.cpuUsage.toFixed(1)}%</span>
                                </span>
                              </div>
                            )}
                          </div>
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
                      ))}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
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
                        points={historyToPoints(memoryHistory)}
                        fill="none"
                        stroke="#6ee7a8"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polygon
                        points={`${historyToPoints(memoryHistory)} 200,40 0,40`}
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
                        points={historyToPoints(diskHistory)}
                        fill="none"
                        stroke="#f0883e"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polygon
                        points={`${historyToPoints(diskHistory)} 200,40 0,40`}
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
                        points={historyToPoints(cpuHistory)}
                        fill="none"
                        stroke="#865DFF"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polygon
                        points={`${historyToPoints(cpuHistory)} 200,40 0,40`}
                        fill="url(#cpuGradient)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-2 space-y-3">
            <h2 className="text-base md:text-2xl font-black text-[#f5f5f5] uppercase tracking-wider">
              Dashboard
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 space-y-3">
                <div>
                  <h3 className="text-sm md:text-base font-bold text-[#f5f5f5] mb-2">
                    Hacker News
                  </h3>
                  <div className="space-y-2">
                    {hnStories.slice(0, 3).map((story, i) => (
                      <div
                        key={i}
                        className="pb-2 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-2 px-2 py-1 rounded transition-all duration-200 cursor-pointer"
                      >
                        <h3 className="text-xs md:text-sm font-bold text-[#f5f5f5] leading-tight mb-1 group-hover:text-[#865DFF] transition-colors line-clamp-2">
                          {story.title}
                        </h3>
                        <div className="text-xs text-[#888888] space-x-2 flex items-center">
                          <span className="text-[#6ee7a8] font-semibold">
                            {story.score}
                          </span>
                          <span className="text-[#555555]">·</span>
                          <span>
                            {timeAgo(story.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base md:text-2xl font-black text-[#f5f5f5] uppercase tracking-wider">
              Repositories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {repos.length > 0 ? (
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
        </div>
      </div>
    </div>
  );
}
