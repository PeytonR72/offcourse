import Link from "next/link";

export function ProgressNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-8 space-y-3 rounded-2xl border border-[#6d8399] p-5"
    >
      <p>{message}</p>
      <p>
        Reload to resume safely, or{" "}
        <Link href="/" className="underline">
          play practice
        </Link>
        .
      </p>
    </div>
  );
}
