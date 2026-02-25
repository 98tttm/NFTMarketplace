import { NFTSkeleton } from "@/components/ui/NFTSkeleton";

export default function MarketplaceLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <NFTSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
