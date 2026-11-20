#!/usr/bin/env bash
# 게이트 — 이게 PASS여야 "완료". 사람도 에이전트도 같은 명령을 쓴다.
#   bash .agents/checks.sh                    루프 자동 판정 (작업 폴더에 sdd·prd 있으면 Full, 없으면 Quick)
#   LOOP=full bash .agents/checks.sh          강제로 Full Loop
#   ALLOW_PROTECTED=1 bash .agents/checks.sh  사람이 보호 파일 변경을 승인할 때만
#   SCOPE_STRICT=1 bash .agents/checks.sh     계획 밖 변경을 경고 대신 실패로
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  local name="$1"; shift
  echo ""; echo "▶ $name"
  if "$@"; then echo "  ✅ PASS — $name"; else echo "  ❌ FAIL — $name"; fail=1; fi
}
has_script() { [ -f package.json ] && node -e "process.exit(require('./package.json').scripts?.['$1']?0:1)"; }

MODE=$(node .agents/scripts/loop-mode.mjs)
echo "🔁 루프: $MODE"

# 1) 작업 기록 · 보호 파일 — 프로젝트 검사보다 먼저 (작업 0243)
#    작업 기록이 실패하면 긴 단계(build · test:e2e)는 돌리지 않고 바로 FAIL — 문서가 비어 18분을 버린 일(0241)을 막음
run "작업 기록 ($MODE)" env LOOP="$MODE" node .agents/scripts/spec-check.mjs
spec_fail=$fail
run "보호 파일" node .agents/scripts/protected-check.mjs

# 2) 프로젝트 검사 — package.json 에 있는 것만 (없으면 건너뜀). 다른 언어면 여기에 명령 추가
#    Quick: typecheck · lint · test   /   Full: + build · test:e2e
#    CI 의 PR 실행은 e2e 를 PR 의 대상 브랜치(GITHUB_BASE_REF)에 따라 고름 (e2e-select.mjs · 작업 0244)
#      main → build + 전체 e2e(넓은 화면 + 휴대폰)   /   develop → build + 연결표로 고른 spec(넓은 화면만)
#      조용한 파일뿐이면 none → 건너뜀 (Full 이어도) · 연결표 밖 화면 파일은 smoke + 경고 줄
#      GITHUB_BASE_REF 가 없으면 예전 규칙(0243): Full 은 늘 · Quick 은 화면에 영향 있는 변경일 때 전체
#    로컬 · push(main) 은 그대로(Quick 은 e2e 없음 · Full 은 전체). 바뀐 파일은 검사 전에 한 번만 구함 (빌드가 만드는 파일이 섞이지 않게)
QUICK_SCRIPTS="typecheck lint test"
WITH_LONG=0
E2E_ARGS=()   # test:e2e 에 더 줄 인자 (고른 프로젝트 · spec) — 비면 전체
if [ "${CI:-}" = "true" ] && [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] && [ -n "${GITHUB_BASE_REF:-}" ]; then
  SEL=$(node .agents/scripts/e2e-select.mjs) || SEL=""
  if [ -z "$SEL" ]; then
    # 고르기가 실패하면 안전하게 전체
    WITH_LONG=1; echo "🔁 CI PR — e2e 고르기 실패, 전체 e2e 로 돎"
  else
    E2E_MODE=$(SEL="$SEL" node -e 'process.stdout.write(JSON.parse(process.env.SEL).mode)')
    SEL="$SEL" node -e 'const r = JSON.parse(process.env.SEL); if (r.warn) console.log("⚠️  " + r.warn);'
    case "$E2E_MODE" in
      none) echo "🔁 CI PR(대상 $GITHUB_BASE_REF) — 문서 · 하네스 · 자료만 바뀌어 e2e 건너뜀" ;;
      full) WITH_LONG=1; echo "🔁 CI PR(대상 $GITHUB_BASE_REF) — build + 전체 e2e (넓은 화면 · 휴대폰)" ;;
      *)
        WITH_LONG=1
        while IFS= read -r line; do E2E_ARGS+=("$line"); done < <(SEL="$SEL" node -e 'const r = JSON.parse(process.env.SEL); for (const p of r.projects) console.log("--project=" + p); for (const s of r.specs) console.log("e2e/" + s);')
        echo "🔁 CI PR(대상 $GITHUB_BASE_REF) — build + 고른 e2e ($E2E_MODE · ${#E2E_ARGS[@]}개 인자)" ;;
    esac
  fi
elif [ "$MODE" = "full" ]; then
  WITH_LONG=1
elif [ "${CI:-}" = "true" ] && [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]; then
  if node --input-type=module -e '
    import { changedFiles } from "./.agents/scripts/lib.mjs";
    import { e2eNeeded } from "./.agents/scripts/e2e-needed.mjs";
    process.exit(e2eNeeded(changedFiles()) ? 0 : 1);
  '; then WITH_LONG=1; echo "🔁 CI PR — 화면에 영향 있는 변경이라 build · test:e2e 도 돎"; else echo "🔁 CI PR — 문서 · 하네스 · 자료만 바뀌어 e2e 건너뜀"; fi
fi
for s in $QUICK_SCRIPTS; do has_script "$s" && run "프로젝트 $s" npm run -s "$s"; done
if [ "$WITH_LONG" = "1" ]; then
  if [ "$spec_fail" -ne 0 ]; then
    echo ""; echo "▶ build · test:e2e 건너뜀 — 작업 기록이 실패해 긴 단계를 돌리지 않음"
  else
    has_script build && run "프로젝트 build" npm run -s build
    # 루트 test:e2e 는 npm -w 를 한 번 더 거쳐서 인자 앞에 -- 가 두 번 필요
    if has_script test:e2e; then
      if [ "${#E2E_ARGS[@]}" -gt 0 ]; then run "프로젝트 test:e2e" npm run -s test:e2e -- -- "${E2E_ARGS[@]}"; else run "프로젝트 test:e2e" npm run -s test:e2e; fi
    fi
  fi
fi

# 3) 하네스
run "하네스 자체 테스트" env -u LOOP node --test .agents/scripts/harness.test.mjs
run "작업 범위 (경고)" node .agents/scripts/scope-check.mjs

echo ""; echo "════════════════════════════════════════"
if [ "$fail" -eq 0 ]; then echo " 결과: ✅ ALL PASS ($MODE) — 완료라고 말해도 됨"; else echo " 결과: ❌ FAIL ($MODE) — 아직 완료 아님"; fi
echo "════════════════════════════════════════"
exit "$fail"
