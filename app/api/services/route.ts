import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getServices() {
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

    const services = containers.map((container: any) => {
      const ports = container.Ports ? container.Ports.split(", ").filter((p: string) => p.trim()) : [];
      return {
        id: container.ID.slice(0, 12),
        name: container.Names,
        image: container.Image,
        status: container.State,
        statusRaw: container.Status,
        createdAt: container.CreatedAt,
        startedAt: container.StartedAt,
        ports,
        cpuUsage: 0,
        memoryUsage: 0,
      };
    });

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

    return {
      services: [...enrichedServices, ...stoppedServices],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      services: [],
      timestamp: new Date().toISOString(),
      dockerAvailable: false,
    };
  }
}

export async function GET() {
  const data = await getServices();
  return Response.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, containerId } = body;

    if (!action || !containerId) {
      return Response.json(
        { error: "Missing action or containerId" },
        { status: 400 }
      );
    }

    if (action === "start") {
      await execAsync(`docker start ${containerId}`);
    } else if (action === "stop") {
      await execAsync(`docker stop ${containerId}`);
    } else if (action === "restart") {
      await execAsync(`docker restart ${containerId}`);
    } else if (action === "remove") {
      await execAsync(`docker rm -f ${containerId}`);
    } else {
      return Response.json(
        { error: "Unknown action" },
        { status: 400 }
      );
    }

    const data = await getServices();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
