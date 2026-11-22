// 도구 3 — 명령 보기 · 설정 링크 (작업 0303 · 0312 에 how-page.tsx 에서 나눔)
import { Panel, Stamp } from "@/shared/ui/panel/panel";
import { HOW_TOOLS, toolId } from "../common/how";
import { SrcLink } from "../common/src-link";

export function HowTools() {
  return (
    <div className="adm-tools3">
      {HOW_TOOLS.map((t) => (
        <Panel key={t.name} id={toolId(t.name)} title={t.name} meta={<Stamp>{t.kind}</Stamp>} className="adm-tool">
          <div className="adm-pb">
            <p>{t.text}</p>
            <details className="adm-cmd">
              <summary>명령 보기</summary>
              <pre>{t.commands.join("\n")}</pre>
            </details>
            <SrcLink path={t.source} label="설정 보기" />
          </div>
        </Panel>
      ))}
    </div>
  );
}
