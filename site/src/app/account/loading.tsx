export default function AccountLoading() {
  return (
    <div id="main-content" className="min-h-screen animate-pulse bg-cream p-5 md:p-8" aria-busy="true" aria-label="Loading account">
      <div className="mx-auto max-w-[1440px]">
        <div className="h-12 w-64 max-w-full bg-mist" />
        <div className="mt-10 grid grid-cols-1 gap-px bg-[var(--bare-rule)] sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 bg-paper" />
          ))}
        </div>
        <div className="mt-8 h-72 border border-[var(--bare-rule)] bg-paper" />
      </div>
    </div>
  );
}
