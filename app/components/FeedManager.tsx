import { useState, useEffect } from "react";

interface FeedManagerProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: string[];
  onFeedsChange: (feeds: string[]) => void;
}

export function FeedManager({ isOpen, onClose, feeds, onFeedsChange }: FeedManagerProps) {
  const [newFeed, setNewFeed] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addFeed = async () => {
    if (!newFeed.trim()) {
      setError("Feed URL cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rss?feeds=${encodeURIComponent(newFeed)}`);
      if (!response.ok) throw new Error("Invalid feed");
      
      if (!feeds.includes(newFeed)) {
        const updatedFeeds = [...feeds, newFeed];
        onFeedsChange(updatedFeeds);
        localStorage.setItem("rss_feeds", JSON.stringify(updatedFeeds));
        setNewFeed("");
      } else {
        setError("Feed already added");
      }
    } catch (err) {
      setError("Invalid feed URL or cannot fetch feed");
    } finally {
      setLoading(false);
    }
  };

  const removeFeed = (url: string) => {
    const updatedFeeds = feeds.filter(f => f !== url);
    onFeedsChange(updatedFeeds);
    if (updatedFeeds.length > 0) {
      localStorage.setItem("rss_feeds", JSON.stringify(updatedFeeds));
    } else {
      localStorage.removeItem("rss_feeds");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#242424] border border-[#444444] rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-[#444444] flex items-center justify-between sticky top-0 bg-[#242424]">
          <h2 className="text-sm font-bold text-[#f5f5f5] uppercase">Manage RSS Feeds</h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#f5f5f5] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#999999] uppercase">Add Feed</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/feed.xml"
                value={newFeed}
                onChange={(e) => setNewFeed(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addFeed()}
                className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-[#f5f5f5] placeholder-[#666666] focus:outline-none focus:border-[#6ee7a8]"
              />
              <button
                onClick={addFeed}
                disabled={loading}
                className="px-3 py-2 bg-[#6ee7a8]/20 text-[#6ee7a8] rounded text-xs font-semibold hover:bg-[#6ee7a8]/30 disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : "Add"}
              </button>
            </div>
            {error && <p className="text-xs text-[#f85149]">{error}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#999999] uppercase">Active Feeds ({feeds.length})</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {feeds.length === 0 ? (
                <p className="text-xs text-[#666666]">No feeds added</p>
              ) : (
                feeds.map((feed, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded border border-[#333333] group">
                    <p className="text-xs text-[#d5d5d5] truncate flex-1">{feed}</p>
                    <button
                      onClick={() => removeFeed(feed)}
                      className="ml-2 px-2 py-1 bg-[#f85149]/20 text-[#f85149] rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#f85149]/30"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
