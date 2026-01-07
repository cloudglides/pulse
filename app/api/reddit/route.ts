export async function GET() {
  try {
    const res = await fetch("https://www.reddit.com/r/selfhosted/top.json?t=day&limit=5", {
      headers: {
        "User-Agent": "pulse-dashboard",
      },
    });
    const data = await res.json();

    const posts = data.data.children.map((post: any) => ({
      title: post.data.title,
      score: post.data.score,
      author: post.data.author,
      created: post.data.created_utc,
      url: `https://reddit.com${post.data.permalink}`,
    }));

    return Response.json({ posts });
  } catch (error) {
    return Response.json({ posts: [], error: "Failed to fetch" }, { status: 500 });
  }
}
