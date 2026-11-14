// Worker 바인딩 — 바인딩 타입은 wrangler.jsonc 에서 생성 (worker-configuration.d.ts · npm run typegen) · 비밀값은 설정에 없어 이름만 여기
//   비밀값 값은 wrangler secret · 로컬은 .dev.vars
export type Env = Pick<Cloudflare.Env, "DB"> &
  Partial<Pick<Cloudflare.Env, "CF_VERSION_METADATA">> & {
    /** 한국수출입은행 Open API 인증키 — 없으면 Frankfurter 예비로 */
    KOREAEXIM_KEY?: string;
    /** 공공데이터포털 인증키 (관세청 과세환율 · 활용신청 후 발급) — 없으면 과세환율 수집을 건너뜀 (작업 0163) */
    KCS_KEY?: string;
    /** KOSIS(통계청) 공유서비스 OpenAPI 인증키 (소비자물가 여행 품목 · 활용신청 후 발급) — 없으면 KOSIS 수집을 건너뜀 (작업 0164) */
    KOSIS_KEY?: string;
    /** 한국은행 ECOS OpenAPI 인증키 (수입물가지수 · 인증키 신청 후 발급) — 없으면 ECOS 수집을 건너뜀 (작업 0165) */
    ECOS_KEY?: string;
    /** 관리용 수집 API(POST /fx/collect) 토큰 — 없으면 그 경로는 꺼짐 */
    ADMIN_TOKEN?: string;
    /** 실시간 작업 기록(POST /activity) 토큰 — 에이전트 훅만 씀 · 없으면 그 경로는 꺼짐 */
    ACTIVITY_TOKEN?: string;
    /** Cloudflare Pages 배포 훅 주소 — 새 환율을 저장하면 사이트를 바로 다시 빌드 (비밀값 · deploy-api 가 GitHub Secrets 에서 넣음 · 작업 0094) · 없으면 안 함 */
    PAGES_DEPLOY_HOOK?: string;
  };
