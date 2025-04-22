import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';

// 간단한 인메모리 또는 sessionStorage 기반 상태 관리 (예시)
// 실제 앱에서는 Context API, Zustand, Jotai 등을 사용하는 것이 좋습니다.
let jwtToken: string | null = null;

export function setJwtToken(token: string | null) {
  jwtToken = token;
  if (typeof sessionStorage !== 'undefined') { // sessionStorage 사용 가능 환경인지 확인
    if (token) {
      sessionStorage.setItem('jwtToken', token);
    } else {
      sessionStorage.removeItem('jwtToken');
    }
  }
}

export function getJwtToken(): string | null {
  if (!jwtToken && typeof sessionStorage !== 'undefined') {
    jwtToken = sessionStorage.getItem('jwtToken');
  }
  return jwtToken;
}

export function isLoggedIn(): boolean {
  // TODO: 토큰 유효성 검증 로직 추가 (예: 만료 시간 확인)
  if (typeof document === 'undefined') return false; // 서버 사이드 렌더링 시 false
  return !!getJwtToken();
}

export default function LoginPage() {
  const navigate = useNavigate();

  // 백엔드 API URL 환경 변수
  const apiUrl = typeof document !== 'undefined' ? import.meta.env.VITE_API_URL : process.env.VITE_API_URL;

  useEffect(() => {
    // 이미 로그인되어 있다면 메인 페이지로 리디렉션
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      // TODO: 사용자에게 에러 메시지 표시
      return;
    }

    if (!apiUrl) {
      // TODO: 사용자에게 에러 메시지 표시
      return;
    }

    try {
      // 백엔드로 credential(ID 토큰) 전송
      const response = await fetch(`${apiUrl}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // TODO: 사용자에게 에러 메시지 표시
        throw new Error('Backend authentication failed');
      }

      const data = await response.json(); // { token: "..." } 형태 예상

      if (!data.token) {
         throw new Error('Token missing from response');
      }

      // JWT 토큰 저장
      setJwtToken(data.token);

      // 로그인 성공 후 메인 페이지로 이동
      navigate('/');

    } catch (error) {
       // TODO: 사용자에게 에러 메시지 표시
      setJwtToken(null); // 에러 시 토큰 제거
    }
  };

  const handleLoginError = () => {
    // TODO: 사용자에게 로그인 실패 메시지 표시
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-2xl font-bold">Login</h1>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
        useOneTap // 원탭 로그인 사용 (선택 사항)
      />
       <p className="text-sm text-gray-500">Login with your Google account to continue.</p>
    </div>
  );
} 