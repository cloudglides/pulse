const xml2js = require('xml2js');

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid?: string;
}

interface RSSFeed {
  name: string;
  url: string;
}

const parseRSSFeed = async (feedUrl: string): Promise<RSSItem[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(feedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const items = result.rss?.channel?.[0]?.item || [];
    
    return items.slice(0, 5).map((item: any) => ({
      title: item.title?.[0] || 'No title',
      link: item.link?.[0] || '#',
      description: item.description?.[0] || '',
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
      guid: item.guid?.[0] || item.link?.[0],
    }));
  } catch (error) {
    return [];
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const feedUrls = searchParams.getAll('feeds');

    if (feedUrls.length === 0) {
      return Response.json({ items: [] });
    }

    const allItems = await Promise.all(
      feedUrls.map(async (url) => {
        const items = await parseRSSFeed(url);
        return items;
      })
    );

    const items = allItems
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

    return Response.json({ items }, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    return Response.json({ items: [] });
  }
}
