import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, existsSync } from "fs";

const execAsync = promisify(exec);

const isProcMounted = () => existsSync("/host/proc");

const readCpuStat = () => {
  try {
    const procPath = isProcMounted() ? "/host/proc/stat" : "/proc/stat";
    const stat = readFileSync(procPath, "utf-8");
    const cpuLine = stat.split("\n")[0];
    const parts = cpuLine.split(/\s+/).slice(1, 5).map(Number);
    const [user, nice, system, idle] = parts;
    const usage = (user + nice + system) / (user + nice + system + idle) * 100;
    return usage || 0;
  } catch {
    return 0;
  }
};

export async function GET() {
  try {
    const uptime = await execAsync("uptime -p || uptime");
    const df = await execAsync("df -h / | tail -1");
    const free = await execAsync("free -h | grep Mem");
    const cpuUsage = readCpuStat();

    const parseUptime = (str: string) => {
      if (str.includes("up")) {
        const match = str.match(/up\s+(.+?),/);
        return match ? match[1] : "unknown";
      }
      return "unknown";
    };

    const parseDisk = (str: string) => {
      const parts = str.split(/\s+/);
      return {
        total: parts[1],
        used: parts[2],
        percent: parseFloat(parts[4]),
      };
    };

    const parseMemory = (str: string) => {
      const parts = str.split(/\s+/);
      const total = parseFloat(parts[1].replace("Gi", ""));
      const used = parseFloat(parts[2].replace("Gi", ""));
      return {
        total: `${total.toFixed(1)}G`,
        used: `${used.toFixed(1)}G`,
        percent: (used / total) * 100,
      };
    };

    return Response.json({
      uptime: parseUptime(uptime.stdout),
      disk: parseDisk(df.stdout),
      memory: parseMemory(free.stdout),
      cpu: cpuUsage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { uptime: "unknown", disk: {}, memory: {}, error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
