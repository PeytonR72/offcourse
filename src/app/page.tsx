import { Practice } from "./practice";

export default function Home() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl px-5 py-8 sm:px-10 sm:py-12">
      <p className="mb-4 flex items-center gap-3 text-sm text-[#b4cbd0]">
        <span aria-hidden="true" className="size-2 rounded-full bg-[#f5c879]" />
        Prototype in progress
      </p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Offcourse
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-[#c4d1dd]">
        Guess what humanity thinks to steer a tiny rocket through space.
      </p>
      <div className="mt-5">
        <p className="text-sm font-bold text-[#f5c879]">Illustrative results</p>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-[#b4c2d1]">
          Practice percentages are simulated, not real crowd votes. No ranked
          score is recorded.
        </p>
      </div>
      <Practice />
    </main>
  );
}
