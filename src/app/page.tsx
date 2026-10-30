export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
      <p className="mb-8 flex items-center gap-3 text-sm text-[#b4cbd0]">
        <span aria-hidden="true" className="size-2 rounded-full bg-[#f5c879]" />
        Prototype in progress
      </p>
      <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
        Offcourse
      </h1>
      <p className="mt-6 max-w-xl text-xl leading-relaxed text-[#c4d1dd] sm:text-2xl">
        Guess what humanity thinks to steer a tiny rocket through space.
      </p>
      <div className="mt-12 border-t border-[#344354] pt-6">
        <p className="text-sm font-bold text-[#f5c879]">Illustrative results</p>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-[#b4c2d1]">
          The game is taking shape. Prototype answer percentages will be
          simulated, not real crowd votes.
        </p>
      </div>
    </main>
  );
}
