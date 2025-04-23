import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from '@remix-run/react';
import apiClient from '~/utils/apiClient';
import { type ActionFunctionArgs, redirect, json } from '@remix-run/node';
import { sessionStorage, getSession, commitSession } from '~/utils/session.server';
import { isLoggedIn } from '~/utils/auth';
import toast from 'react-hot-toast';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const credential = formData.get('credential') as string | null;

    if (!credential) {
      console.error("[Action Error] Credential not found in POST request from Google.");
      return json({ error: "Google 로그인 응답 처리 중 오류가 발생했습니다." }, { status: 400 });
    }

    const response = await apiClient.post('/auth/google/callback', {
      credential: credential,
    });

    const token = response.data?.token;

    if (!token) {
      console.error("[Action Error] Token missing from backend response.");
      return json({ error: "백엔드 인증 후 토큰을 받지 못했습니다." }, { status: 500 });
    }

    const session = await getSession(request);
    session.set("jwt", token);
    session.flash("globalMessage", "로그인 성공!");

    console.log("[Action Info] Login successful, flashing message, setting cookie and redirecting...");

    return redirect('/', {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });

  } catch (error: any) {
    console.error("[Action Error] Login failed:", error);
    const errorMessage = error.response?.data?.message || "로그인 처리 중 서버 오류가 발생했습니다.";
    return json({ error: errorMessage }, { status: error.response?.status || 500 });
  }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    console.warn("handleLoginSuccess called unexpectedly in redirect mode.");
  };

  const handleLoginError = () => {
    console.error("Google Login Failed (client-side)");
    toast.error("Google 계정으로 로그인하는데 실패했습니다.");
  };

  return (
    <div className="flex min-h-full flex-grow flex-col items-center justify-center bg-gradient-to-br from-primary-light via-neutral to-white p-6">
      <div className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-center text-3xl font-bold text-primary">
            로그인
          </h1>
          <p className="my-2 text-center text-base text-primary-dark">
            Recordify의 모든 기능을 사용하려면
            <br />
            Google 계정이 필요합니다.
          </p>
          <div className="mt-4 w-full max-w-xs">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              ux_mode="redirect"
              theme="filled_blue"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 