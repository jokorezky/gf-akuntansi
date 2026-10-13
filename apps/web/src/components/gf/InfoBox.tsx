export function InfoBox({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div
      className="w-[330px] rounded-md border border-gf-border p-2 text-[11px]"
      style={{
        background: "linear-gradient(180deg, var(--color-gf-info-a), var(--color-gf-info-b))",
      }}
    >
      {rows.map((r) => (
        <div key={r.label} className="flex gap-2 leading-[16px]">
          <span className="w-[110px] text-right text-gf-muted">{r.label}</span>
          <span className="text-gf-text">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
