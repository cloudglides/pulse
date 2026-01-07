import { config } from "@/app/config";

export async function GET() {
  try {
    const res = await fetch(
      `https://gh-pinned-repos-tsj7ta5xfhep.deno.dev/?username=${config.github.username}`
    );
    const data = await res.json();

    const repos = data.map((repo: any) => ({
      name: repo.repo,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      description: repo.description,
      url: repo.link,
    }));

    return Response.json({ repos });
  } catch (error) {
    return Response.json({ repos: [], error: "Failed to fetch" }, { status: 500 });
  }
}
