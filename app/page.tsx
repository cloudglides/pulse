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

interface RedditPost {
  title: string;
  score: number;
  author: string;
  created: number;
  url: string;
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
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
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
          requests.push(fetch("/api/reddit"));
          lastNewsFetch = now;
        }

        const responses = await Promise.all(requests);
        const [servicesRes, githubRes, systemRes, ...newsRes] = responses;

        const promises = [
          servicesRes.json(),
          githubRes.json().catch(() => ({ repos: [] })),
          systemRes.json().catch(() => ({})),
        ];

        if (shouldFetchNews) {
          promises.push(newsRes[0].json().catch(() => ({ stories: [] })));
          promises.push(newsRes[1].json().catch(() => ({ posts: [] })));
        }

        const data = await Promise.all(promises);
        const [servicesData, githubData, systemData, ...newsData] = data;

        setServices(servicesData.services || []);
        setRepos(githubData.repos || []);
        setSystemStats(systemData);

        if (shouldFetchNews && newsData.length === 2) {
          setHnStories(newsData[0].stories || []);
          setRedditPosts(newsData[1].posts || []);
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
        <div className="px-16 py-12 space-y-16">
          {services.length > 0 && (
            <div className="space-y-8">
              <div className="border-2 border-[#444444] rounded-xl p-12 bg-[#242424]">
                <div className="grid grid-cols-3 gap-16">
                  <div className="text-center space-y-4">
                    <div className="text-xl font-bold text-[#999999] uppercase tracking-wider">
                      Memory
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="text-8xl font-light"
                        style={{ color: memoryHealth.color, lineHeight: 1 }}
                      >
                        {systemStats?.memory
                          ? `${systemStats.memory.percent.toFixed(0)}`
                          : "--"}
                      </div>
                      <div className="text-2xl text-[#666666] font-light">%</div>
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: memoryHealth.color }}
                    >
                      {memoryHealth.label}
                    </div>
                  </div>

                  <div className="text-center space-y-4 border-l-2 border-r-2 border-[#444444]">
                    <div className="text-xl font-bold text-[#999999] uppercase tracking-wider">
                      Disk
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="text-8xl font-light"
                        style={{ color: diskHealth.color, lineHeight: 1 }}
                      >
                        {systemStats?.disk
                          ? `${systemStats.disk.percent.toFixed(0)}`
                          : "--"}
                      </div>
                      <div className="text-2xl text-[#666666] font-light">%</div>
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: diskHealth.color }}
                    >
                      {diskHealth.label}
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-xl font-bold text-[#999999] uppercase tracking-wider">
                      Services
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="text-8xl font-light text-[#6ee7a8]"
                        style={{ lineHeight: 1 }}
                      >
                        {runningCount}
                      </div>
                      <div className="text-2xl text-[#6ee7a8] font-light">
                        active
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#6ee7a8]">Running</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#f5f5f5] mb-4 uppercase">
                      Services
                    </h2>
                    <div className="space-y-2">
                      {services.slice(0, 6).map((s) => (
                 <div
                   key={s.id}
                   className={`border border-[#333333] rounded-lg p-4 bg-[#242424] hover:border-[#6ee7a8] transition-all group flex items-center justify-between ${
                     s.status !== "running" ? "opacity-60" : ""
                   }`}
                 >
                   <div className="flex-1">
                     <h4 className="text-base font-bold text-[#f5f5f5] mb-1">
                       {s.name}
                     </h4>
                     {s.status === "running" && (
                       <div className="flex items-center gap-4 text-xs">
                         <span className="text-[#888888]">
                           CPU: <span className="text-[#6ee7a8] font-semibold">{s.cpuUsage.toFixed(1)}%</span>
                         </span>
                       </div>
                     )}
                   </div>
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
                     s.status === "running"
                       ? "bg-[#6ee7a8]/20 text-[#6ee7a8]"
                       : "bg-[#f85149]/20 text-[#f85149]"
                   }`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${
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

               <div>
               <h2 className="text-lg font-bold text-[#f5f5f5] mb-4 uppercase">
               News
               </h2>
               <div className="space-y-3">
               <div>
                 <h3 className="text-sm font-bold text-[#f5f5f5] mb-2">Hacker News</h3>
                 <div className="space-y-2">
                   {hnStories.slice(0, 2).map((story, i) => (
                     <div
                       key={i}
                       className="pb-2 border-b border-[#2a2a2a] last:border-0 text-xs text-[#d5d5d5] hover:text-[#865DFF] transition-colors cursor-pointer"
                     >
                       <p className="leading-tight">{story.title}</p>
                       <div className="text-[#888888] mt-1">{story.score} · {timeAgo(story.time)}</div>
                     </div>
                   ))}
                 </div>
               </div>
               <div>
                 <h3 className="text-sm font-bold text-[#f5f5f5] mb-2">Reddit</h3>
                 <div className="space-y-2">
                   {redditPosts.slice(0, 2).map((post, i) => (
                     <a
                       key={i}
                       href={post.url}
                       target="_blank"
                       rel="noreferrer"
                       className="pb-2 border-b border-[#2a2a2a] last:border-0 text-xs text-[#d5d5d5] hover:text-[#865DFF] transition-colors block"
                     >
                       <p className="leading-tight">{post.title}</p>
                       <div className="text-[#888888] mt-1">{post.score} · {timeAgo(post.created)}</div>
                     </a>
                   ))}
                 </div>
               </div>
               </div>
               </div>
               </div>

               <div className="grid grid-rows-3 gap-4 h-full">
                 <div className="border border-[#333333] rounded-lg p-4 bg-[#242424]">
                   <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-3">Memory</h3>
                   <div className="mb-2">
                     <span className="text-2xl font-black text-[#6ee7a8]">
                       {systemStats?.memory ? `${systemStats.memory.percent.toFixed(0)}%` : "--"}
                     </span>
                   </div>
                   <svg viewBox="0 0 200 40" className="w-full h-16">
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

                 <div className="border border-[#333333] rounded-lg p-4 bg-[#242424]">
                   <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-3">Disk</h3>
                   <div className="mb-2">
                     <span className="text-2xl font-black text-[#f0883e]">
                       {systemStats?.disk ? `${systemStats.disk.percent.toFixed(0)}%` : "--"}
                     </span>
                   </div>
                   <svg viewBox="0 0 200 40" className="w-full h-16">
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

                 <div className="border border-[#333333] rounded-lg p-4 bg-[#242424]">
                   <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-3">CPU</h3>
                   <div className="mb-2">
                     <span className="text-2xl font-black text-[#865DFF]">
                       {systemStats?.cpu ? `${systemStats.cpu.toFixed(1)}%` : "--"}
                     </span>
                   </div>
                   <svg viewBox="0 0 200 40" className="w-full h-16">
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
               </div>
               )}

          <div className="space-y-8">
            <h2 className="text-3xl font-black text-[#f5f5f5] uppercase tracking-wider">
              Dashboard
            </h2>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#f5f5f5] mb-4">
                    Hacker News
                  </h3>
                  <div className="space-y-4">
                    {hnStories.slice(0, 3).map((story, i) => (
                      <div
                        key={i}
                        className="pb-4 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-4 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight mb-2 group-hover:text-[#865DFF] transition-colors">
                          {story.title}
                        </h3>
                        <div className="text-xs text-[#888888] space-x-3 flex items-center">
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

                <div>
                  <h3 className="text-lg font-bold text-[#f5f5f5] mb-4">
                    Reddit - r/SelfHosted
                  </h3>
                  <div className="space-y-4">
                    {redditPosts.slice(0, 3).map((post, i) => (
                      <a
                        key={i}
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="pb-4 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-4 px-4 py-2 rounded-lg transition-all duration-200 block"
                      >
                        <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight mb-2 group-hover:text-[#865DFF] transition-colors">
                          {post.title}
                        </h3>
                        <div className="text-xs text-[#888888] space-x-3 flex items-center">
                          <span className="text-[#6ee7a8] font-semibold">
                            {post.score}
                          </span>
                          <span className="text-[#555555]">·</span>
                          <span>
                            {timeAgo(post.created)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              </div>

            <h2 className="text-3xl font-black text-[#f5f5f5] uppercase tracking-wider">
              Repositories
            </h2>

            <div className="grid grid-cols-3 gap-6">
              {repos.length > 0 ? (
                repos.slice(0, 9).map((repo, i) => (
                  <a
                    key={i}
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-[#333333] rounded-lg p-6 bg-[#242424] hover:border-[#865DFF] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#999999]">
                          cloudglides
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 text-[#666666] group-hover:text-[#865DFF] transition-colors"
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
                    <h4 className="text-lg font-bold text-[#865DFF] mb-3">
                      {repo.name.split("/")[1]}
                    </h4>
                    <p className="text-sm text-[#d5d5d5] mb-4 line-clamp-2 h-10">
                      {repo.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      {repo.language && (
                        <span className="flex items-center gap-1 text-[#d5d5d5]">
                          <span className="w-2 h-2 rounded-full bg-[#865DFF]" />
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
