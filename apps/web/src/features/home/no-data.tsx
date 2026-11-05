// 숫자를 만들지 않고 이유를 보여 줌 (FX-02)
export function NoData({ reason }: { reason: string }) {
  return (
    <div className="rounded-card border border-line p-8">
      <p className="text-lg font-semibold text-fg">자료 없음</p>
      <p className="mt-2 text-sm text-fg-2">{reason}</p>
    </div>
  );
}
