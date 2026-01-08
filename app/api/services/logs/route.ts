import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get("containerId");

    if (!containerId) {
      return Response.json(
        { error: "Missing containerId" },
        { status: 400 }
      );
    }

    const { stdout } = await execAsync(
      `docker logs --tail 100 ${containerId}`
    );

    return Response.json({ logs: stdout });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch logs", logs: "" },
      { status: 500 }
    );
  }
}
