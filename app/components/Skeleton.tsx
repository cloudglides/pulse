export function SkeletonCard() {
  return (
    <div className="border border-[#333333] rounded p-4 bg-[#242424] animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-[#333333] rounded w-3/4"></div>
        <div className="h-8 bg-[#333333] rounded w-1/2"></div>
        <div className="h-3 bg-[#333333] rounded w-full"></div>
      </div>
    </div>
  );
}

export function SkeletonServiceCard() {
  return (
    <div className="border border-[#333333] rounded p-3 bg-[#242424] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-[#333333] rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-[#333333] rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-[#333333] rounded w-20 flex-shrink-0 ml-2"></div>
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="border border-[#444444] rounded-lg p-6 bg-[#242424] animate-pulse">
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-3">
            <div className="h-3 bg-[#333333] rounded w-3/4 mx-auto"></div>
            <div className="h-16 bg-[#333333] rounded w-2/3 mx-auto"></div>
            <div className="h-3 bg-[#333333] rounded w-1/2 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="border border-[#333333] rounded p-3 bg-[#242424] animate-pulse">
      <div className="h-3 bg-[#333333] rounded w-1/3 mb-2"></div>
      <div className="h-6 bg-[#333333] rounded w-1/4 mb-4"></div>
      <div className="h-20 bg-[#333333] rounded"></div>
    </div>
  );
}

export function SkeletonRepoCard() {
  return (
    <div className="border border-[#333333] rounded p-3 bg-[#242424] animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-[#333333] rounded w-1/2"></div>
        <div className="h-3 bg-[#333333] rounded w-full"></div>
        <div className="h-3 bg-[#333333] rounded w-3/4"></div>
        <div className="flex gap-3 pt-2">
          <div className="h-3 bg-[#333333] rounded w-1/4"></div>
          <div className="h-3 bg-[#333333] rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonNewsItem() {
  return (
    <div className="pb-2 border-b border-[#2a2a2a] last:border-0 animate-pulse">
      <div className="h-4 bg-[#333333] rounded w-full mb-2"></div>
      <div className="h-3 bg-[#333333] rounded w-2/3"></div>
    </div>
  );
}
