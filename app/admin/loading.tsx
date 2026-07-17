export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="mb-8">
        <div className="h-8 w-40 bg-sand rounded animate-pulse" />
        <div className="h-4 w-64 bg-sand/60 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-sand p-5 h-28 bg-white animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden h-80 animate-pulse" />
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden h-80 animate-pulse" />
      </div>
    </div>
  );
}
