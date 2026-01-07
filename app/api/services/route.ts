import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync(
      "docker ps -a --format '{{json .}}'"
    );

    const containers = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const services = containers.map((container: any) => ({
      id: container.ID.slice(0, 12),
      name: container.Names,
      image: container.Image,
      status: container.State,
      statusRaw: container.Status,
      createdAt: container.CreatedAt,
      startedAt: container.StartedAt,
      cpuUsage: 0,
      memoryUsage: 0,
    }));

    // Get stats for running containers
    const statsPromises = services
      .filter((s: any) => s.status === "running")
      .map(async (service: any) => {
        try {
          const { stdout: statsJson } = await execAsync(
            `docker stats ${service.id} --no-stream --format "{{json .}}"`
          );
          const stats = JSON.parse(statsJson);
          return {
            ...service,
            cpuUsage: parseFloat(stats.CPUPerc?.replace("%", "") || 0),
            memoryUsage: parseFloat(stats.MemPerc?.replace("%", "") || 0),
          };
        } catch {
          return service;
        }
      });

    const enrichedServices = await Promise.all(statsPromises);
    const stoppedServices = services.filter((s: any) => s.status !== "running");

    return Response.json({
      services: [...enrichedServices, ...stoppedServices],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        services: [],
        timestamp: new Date().toISOString(),
        dockerAvailable: false,
      },
      { status: 200 }
    );
  }
}
