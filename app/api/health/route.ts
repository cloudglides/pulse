export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlStr = searchParams.get("url");

    if (!urlStr) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const url = new URL(urlStr);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url.toString(), {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    }).catch(() =>
      fetch(url.toString(), {
        signal: controller.signal,
        redirect: "follow",
      })
    );

    clearTimeout(timeout);

    return Response.json({
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: 0, ok: false, error: "Request failed" },
      { status: 503 }
    );
  }
}
