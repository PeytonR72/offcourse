import Link from "next/link";
import { Endless } from "./endless";

export default function EndlessPage() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl px-5 py-8 sm:px-10 sm:py-12">
      <Link
        href="/"
        className="inline-flex min-h-12 items-center text-[#b4cbd0] underline"
      >
        Offcourse · Practice
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Endless Voyage
      </h1>
      <p className="mt-3 leading-relaxed text-[#c4d1dd]">
        Reach consecutive destinations by predicting within 10 percentage
        points, including exactly 10. One miss ends your voyage. Questions never
        repeat within a run.
      </p>
      <p className="mt-5 font-bold text-[#f5c879]">Illustrative results</p>
      <p className="mt-2 text-[#b4c2d1]">
        Percentages are simulated, not real crowd votes. Keep exploring until
        you miss or complete the available demo pool.
      </p>
      <Endless />
    </main>
  );
}
