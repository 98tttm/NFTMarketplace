import { CollectionCardSkeleton } from "@/components/collection/CollectionCard";

export default function CollectionsLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
