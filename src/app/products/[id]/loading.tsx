import { AppLogo } from "@/components/AppLogo";

export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-5 sm:px-8">
          <div className="h-10 w-28 rounded-full bg-[#e4e9ea]" />
          <AppLogo compact />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 pb-10 pt-5 sm:px-8 md:pb-14 md:pt-6">
        <div className="flex flex-col gap-3 border-b border-white/12 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-9 w-44 rounded-lg" />
            <Skeleton className="mt-3 h-5 w-48 rounded-full" />
          </div>
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>

        <section className="mt-6 overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[110px_220px_1fr_130px_150px_140px] gap-5 border-b border-[#edf0f1] px-5 py-5 last:border-b-0">
              <Skeleton className="h-8 w-16 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="mt-3 h-4 w-24 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-40 rounded-full" />
                <Skeleton className="mt-3 h-4 w-[min(360px,48vw)] rounded-full" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-[#e4e9ea] ${className}`} />;
}
