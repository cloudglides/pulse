import { config } from "@/app/config";

export async function GET() {
  try {
    const repos = [
      `${config.github.username}/pulse`,
      "glanceapp/glance",
      "go-gitea/gitea",
      "syncthing/syncthing",
      "linuxserver/docker-baseimage-alpine",
    ];

    const data = await Promise.all(
      repos.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            "User-Agent": "pulse-dashboard",
          },
        });
        const json = await res.json();
        return {
          name: json.full_name,
          stars: json.stargazers_count,
          forks: json.forks_count,
          language: json.language,
          url: json.html_url,
        };
      })
    );

    return Response.json({ repos: data });
  } catch (error) {
    return Response.json({ repos: [], error: "Failed to fetch" }, { status: 500 });
  }
}
