export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#8B5CF6", borderRightColor: "#06B6D4" }}
          />
          <div
            className="absolute inset-2 animate-spin rounded-full border-2 border-transparent"
            style={{
              borderBottomColor: "#A855F7",
              borderLeftColor: "#3B82F6",
              animationDirection: "reverse",
              animationDuration: "1.5s",
            }}
          />
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
