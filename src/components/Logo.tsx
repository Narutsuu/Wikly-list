export default function Logo({ size = 32, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={size} height={size} className="rounded-lg" style={{ width: size, height: size }} />
      {text && <span className="text-2xl font-semibold tracking-tight">DayFlow</span>}
    </span>
  );
}
