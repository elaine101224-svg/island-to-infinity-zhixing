export default function SiteLoading() {
  return (
    <div role="status" aria-label="Loading page" className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-earth-mid text-center mb-8">Loading…</p>
      <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 motion-safe:animate-pulse">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-48 rounded-2xl bg-sand/50" />
        ))}
      </div>
    </div>
  );
}
