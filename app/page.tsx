"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  image: string;
  status: string;
  statusRaw: string;
  createdAt: string;
  startedAt: string;
  cpuUsage: number;
  memoryUsage: number;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data.services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const runningServices = services.filter((s) => s.status === "running");
  const stoppedServices = services.filter((s) => s.status !== "running");

  return (
    <div className="min-h-screen bg-[#0b0d10]">
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4 auto-rows-max">
          {/* Stats Row */}
          <div className="col-span-3 widget h-28">
            <div className="widget-header">Running</div>
            <div className="flex-1 flex items-end justify-between">
              <div className="text-4xl font-light text-[#6ee7a8]">
                {runningServices.length}
              </div>
              <div className="text-xs text-[#9aa0aa]">of {services.length}</div>
            </div>
          </div>

          <div className="col-span-3 widget h-28">
            <div className="widget-header">Stopped</div>
            <div className="flex-1 flex items-end justify-between">
              <div className="text-4xl font-light text-[#f87171]">
                {stoppedServices.length}
              </div>
              {stoppedServices.length === 0 && (
                <div className="text-xs text-[#9aa0aa]">healthy</div>
              )}
            </div>
          </div>

          <div className="col-span-3 widget h-28">
            <div className="widget-header">Avg CPU</div>
            <div className="flex-1 flex items-end">
              <div className="text-4xl font-light text-[#e6e6e6]">
                {runningServices.length > 0
                  ? (
                      runningServices.reduce((sum, s) => sum + s.cpuUsage, 0) /
                      runningServices.length
                    ).toFixed(0)
                  : "—"}
                {runningServices.length > 0 && "%"}
              </div>
            </div>
          </div>

          <div className="col-span-3 widget h-28">
            <div className="widget-header">Total Mem</div>
            <div className="flex-1 flex items-end">
              <div className="text-4xl font-light text-[#e6e6e6]">
                {runningServices.length > 0
                  ? runningServices
                      .reduce((sum, s) => sum + s.memoryUsage, 0)
                      .toFixed(0)
                  : "—"}
                {runningServices.length > 0 && "%"}
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="col-span-12 widget h-48">
              <div className="widget-header">Services</div>
              <div className="flex items-center justify-center h-40 text-[#9aa0aa] text-sm">
                Loading...
              </div>
            </div>
          ) : services.length === 0 ? (
            <>
              <div className="col-span-8 widget h-48">
                <div className="widget-header">Services</div>
                <div className="flex items-center justify-center h-40 text-[#9aa0aa] text-sm">
                  No Docker containers found
                </div>
              </div>

              <div className="col-span-4 widget h-48">
                <div className="widget-header">Status</div>
                <div className="flex items-center justify-center h-40 text-[#9aa0aa] text-xs text-center px-4">
                  Docker daemon may not be running or no containers configured
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-8 widget h-96">
                <div className="widget-header">
                  Services ({services.length})
                </div>
                <div className="widget-content">
                  <div className="space-y-0 divide-y divide-[#1f2430]">
                    {services.map((service) => (
                      <ServiceRow key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-4 widget h-96">
                <div className="widget-header">Resource Usage</div>
                <div className="widget-content">
                  {runningServices.length > 0 ? (
                    <div className="space-y-3">
                      {runningServices.slice(0, 6).map((service) => (
                        <div key={service.id} className="space-y-1">
                          <div className="text-xs text-[#e6e6e6] truncate font-mono">
                            {service.name}
                          </div>
                          <div className="flex gap-2 text-xs">
                            <div className="flex-1">
                              <div className="text-[#9aa0aa] mb-0.5">
                                {service.cpuUsage.toFixed(0)}% CPU
                              </div>
                              <div className="h-1.5 bg-[#1f2430] rounded overflow-hidden">
                                <div
                                  className="h-full bg-[#facc15] transition-all"
                                  style={{
                                    width: `${Math.min(service.cpuUsage, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-[#9aa0aa] mb-0.5">
                                {service.memoryUsage.toFixed(0)}% RAM
                              </div>
                              <div className="h-1.5 bg-[#1f2430] rounded overflow-hidden">
                                <div
                                  className="h-full bg-[#6ee7a8] transition-all"
                                  style={{
                                    width: `${Math.min(service.memoryUsage, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#9aa0aa] text-center">
                      All services stopped
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const isRunning = service.status === "running";
  const uptime = new Date(service.startedAt);
  const now = new Date();
  const hours = Math.floor(
    (now.getTime() - uptime.getTime()) / (1000 * 60 * 60),
  );

  return (
    <div className="py-2.5 px-1 first:pt-1 last:pb-1 hover:bg-[#161a22] transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isRunning ? "bg-[#6ee7a8]" : "bg-[#f87171]"
            }`}
          />
          <div className="font-mono text-xs text-[#e6e6e6] truncate">
            {service.name}
          </div>
          <div className="text-xs text-[#9aa0aa] truncate ml-2">
            {service.image.split("/").pop()}
          </div>
        </div>

        {isRunning ? (
          <div className="flex items-center gap-4 text-xs flex-shrink-0">
            <div className="text-right">
              <div className="font-mono text-[#e6e6e6]">
                {service.cpuUsage.toFixed(0)}%
              </div>
              <div className="text-[#9aa0aa] text-xs">cpu</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[#e6e6e6]">
                {service.memoryUsage.toFixed(0)}%
              </div>
              <div className="text-[#9aa0aa] text-xs">mem</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[#e6e6e6]">{hours}h</div>
              <div className="text-[#9aa0aa] text-xs">up</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#f87171] font-medium flex-shrink-0">
            stopped
          </div>
        )}
      </div>
    </div>
  );
}
