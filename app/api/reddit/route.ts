export async function GET() {
  try {
    const res = await fetch(
      "https://www.reddit.com/r/selfhosted/top.json?t=day&limit=5",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      return Response.json(
        { posts: [], error: "Reddit unavailable" },
        { status: 200 },
      );
    }

    const data = await res.json();

    const posts = data.data.children.map((post: any) => ({
      title: post.data.title,
      score: post.data.score,
      author: post.data.author,
      created: post.data.created_utc,
      url: `https://reddit.com${post.data.permalink}`,
    }));

    return Response.json(
      { posts },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      { posts: [], error: "Failed to fetch" },
      { status: 200 },
    );
  }
}
