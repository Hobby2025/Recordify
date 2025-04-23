import { createCookieSessionStorage } from "@remix-run/node";

// 환경 변수에서 세션 시크릿 가져오기 (강력한 비밀키 필요)
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set as an environment variable");
}

// 세션 스토리지 생성
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // 쿠키 이름
    httpOnly: true, // JavaScript에서 접근 불가
    path: "/", // 쿠키 적용 경로
    sameSite: "lax", // CSRF 보호 수준
    secrets: [sessionSecret], // 쿠키 서명 및 암호화에 사용할 비밀키
    secure: process.env.NODE_ENV === "production", // 프로덕션 환경에서는 HTTPS에서만 전송
    maxAge: 60 * 60 * 24 * 7, // 쿠키 유효 기간 (예: 7일)
  },
});

// 세션 관련 헬퍼 함수 (선택 사항이지만 유용)
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
} 