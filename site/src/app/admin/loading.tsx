export default function AdminLoading() {
  return (
    <div id="main-content" className="animate-pulse p-5 md:p-8" aria-busy="true" aria-label="Loading admin workspace">
      <div className="h-4 w-32 bg-mist" />
      <div className="mt-5 h-12 w-72 max-w-full bg-mist" />
      <div className="mt-10 grid grid-cols-2 gap-px bg-[var(--bare-rule)] xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-36 bg-paper" />
        ))}
      </div>
      <div className="mt-8 h-80 border border-[var(--bare-rule)] bg-paper" />
    </div>
  );
}
