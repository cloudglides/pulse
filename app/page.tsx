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
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [hnStories, setHnStories] = useState<HNStory[]>([]);
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [servicesRes, hnRes, redditRes, githubRes, systemRes] =
          await Promise.all([
            fetch("/api/services"),
            fetch("/api/hacker-news"),
            fetch("/api/reddit"),
            fetch("/api/github"),
            fetch("/api/system"),
          ]);

        const [servicesData, hnData, redditData, githubData, systemData] =
          await Promise.all([
            servicesRes.json(),
            hnRes.json().catch(() => ({ stories: [] })),
            redditRes.json().catch(() => ({ posts: [] })),
            githubRes.json().catch(() => ({ repos: [] })),
            systemRes.json().catch(() => ({})),
          ]);

        setServices(servicesData.services || []);
        setHnStories(hnData.stories || []);
        setRedditPosts(redditData.posts || []);
        setRepos(githubData.repos || []);
        setSystemStats(systemData);
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

  const diskHealth = getHealthStatus(systemStats?.disk?.percent || 0);
  const memoryHealth = getHealthStatus(systemStats?.memory?.percent || 0);
  const runningCount = services.filter((s) => s.status === "running").length;

  return (
    <div className="h-screen bg-[#1a1a1a] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-16 py-12 space-y-16">
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

          <div className="space-y-10">
            <h2 className="text-3xl font-black text-[#f5f5f5] uppercase tracking-wider">
              Dashboard
            </h2>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-[#f5f5f5] mb-6">
                    Hacker News
                  </h3>
                  <div className="space-y-8">
                    {hnStories.slice(0, 5).map((story, i) => (
                      <div
                        key={i}
                        className="pb-8 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-6 px-6 py-4 rounded-lg transition-all duration-200 cursor-pointer hover:pl-8"
                      >
                        <h3 className="text-2xl font-black text-[#f5f5f5] leading-tight mb-3 group-hover:text-[#865DFF] transition-colors">
                          {story.title}
                        </h3>
                        <div className="text-base text-[#d5d5d5] space-x-4 flex items-center">
                          <span className="text-[#ffffff] font-bold text-lg">
                            {story.score}
                          </span>
                          <span className="text-[#555555]">·</span>
                          <span className="text-[#d5d5d5] font-medium">
                            {timeAgo(story.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#f5f5f5] mb-6">
                    Reddit - r/SelfHosted
                  </h3>
                  <div className="space-y-8">
                    {redditPosts.slice(0, 5).map((post, i) => (
                      <a
                        key={i}
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="pb-8 border-b border-[#2a2a2a] last:border-0 group hover:bg-[#242424] -mx-6 px-6 py-4 rounded-lg transition-all duration-200 hover:pl-8 block"
                      >
                        <h3 className="text-2xl font-black text-[#f5f5f5] leading-tight mb-3 group-hover:text-[#865DFF] transition-colors">
                          {post.title}
                        </h3>
                        <div className="text-base text-[#d5d5d5] space-x-4 flex items-center">
                          <span className="text-[#ffffff] font-bold text-lg">
                            {post.score}
                          </span>
                          <span className="text-[#555555]">·</span>
                          <span className="text-[#d5d5d5] font-medium">
                            {timeAgo(post.created)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-[#333333] rounded-lg p-6 bg-[#242424] min-h-80">
                  <h3 className="text-sm font-bold text-[#999999] uppercase tracking-wider mb-4">
                    Memory Trend
                  </h3>
                  <svg viewBox="0 0 200 80" className="w-full h-48">
                    <defs>
                      <linearGradient
                        id="memGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6ee7a8"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#6ee7a8"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polyline
                      points="0,65 20,55 40,48 60,52 80,45 100,40 120,50 140,42 160,58 180,35 200,28"
                      fill="none"
                      stroke="#6ee7a8"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points="0,65 20,55 40,48 60,52 80,45 100,40 120,50 140,42 160,58 180,35 200,28 200,80 0,80"
                      fill="url(#memGradient)"
                    />
                  </svg>
                  <div className="text-xs text-[#d5d5d5]">
                    {systemStats?.memory
                      ? `${systemStats.memory.percent.toFixed(1)}% now`
                      : "-- %"}
                  </div>
                </div>

                <div className="border border-[#333333] rounded-lg p-6 bg-[#242424] min-h-80">
                  <h3 className="text-sm font-bold text-[#999999] uppercase tracking-wider mb-4">
                    Disk Trend
                  </h3>
                  <svg viewBox="0 0 200 80" className="w-full h-48">
                    <defs>
                      <linearGradient
                        id="diskGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f0883e"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#f0883e"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polyline
                      points="0,50 20,52 40,51 60,53 80,49 100,52 120,48 140,51 160,49 180,54 200,50"
                      fill="none"
                      stroke="#f0883e"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points="0,50 20,52 40,51 60,53 80,49 100,52 120,48 140,51 160,49 180,54 200,50 200,80 0,80"
                      fill="url(#diskGradient)"
                    />
                  </svg>
                  <div className="text-xs text-[#d5d5d5]">
                    {systemStats?.disk
                      ? `${systemStats.disk.percent.toFixed(1)}% now`
                      : "-- %"}
                  </div>
                </div>

                <div className="border border-[#333333] rounded-lg p-6 bg-[#242424]">
                  <h3 className="text-sm font-bold text-[#999999] uppercase tracking-wider mb-4">
                    GitHub Repos
                  </h3>
                  <div className="space-y-6">
                    {repos.length > 0 ? (
                      repos.slice(0, 4).map((repo, i) => (
                        <div
                          key={i}
                          className="pb-6 border-b border-[#2a2a2a] last:border-0"
                        >
                          <h4 className="text-base font-bold text-[#f5f5f5] mb-2 truncate hover:text-[#865DFF] transition-colors">
                            {repo.name}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-[#888888]">
                            <span className="flex items-center gap-1">
                              <span>⭐</span>
                              <span className="text-[#d5d5d5] font-medium">
                                {repo.stars}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🍴</span>
                              <span className="text-[#d5d5d5] font-medium">
                                {repo.forks}
                              </span>
                            </span>
                            {repo.language && (
                              <span className="text-[#865DFF]">
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>
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

          {services.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-[#f5f5f5] uppercase tracking-wider">
                Services
              </h2>

              <div className="grid grid-cols-2 gap-8">
                {services.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className={`border border-[#333333] rounded-lg p-4 ${
                      s.status === "running"
                        ? "bg-[#242424] hover:border-[#6ee7a8]"
                        : "bg-[#2a1a1a] hover:border-[#f85149]"
                    } transition-all`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          s.status === "running"
                            ? "bg-[#6ee7a8]"
                            : "bg-[#f85149]"
                        }`}
                      />
                      <span className="text-sm font-bold text-[#f5f5f5] truncate">
                        {s.name}
                      </span>
                    </div>
                    {s.status === "running" && (
                      <div className="text-xs text-[#d5d5d5]">
                        CPU:{" "}
                        <span className="text-[#6ee7a8] font-bold">
                          {s.cpuUsage.toFixed(0)}%
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-[#888888] mt-1">
                      {s.status === "running" ? "Running" : "Stopped"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
