export async function GET() {
  try {
    const topStoriesRes = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    const storyIds: number[] = await topStoriesRes.json();

    const stories = await Promise.all(
      storyIds.slice(0, 5).map(async (id: number) => {
        try {
          const res = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`
          );
          return res.json();
        } catch {
          return null;
        }
      })
    );

    return Response.json({ stories: stories.filter(Boolean) }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("HN Error:", error);
    return Response.json({ stories: [] });
  }
}
