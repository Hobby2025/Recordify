import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { getJwtToken, setJwtToken } from "./login";
import { jwtDecode } from "jwt-decode";

interface UserPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Recordify" },
    { name: "description", content: "Welcome to Recordify!" },
  ];
};

export default function Index() {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserPayload | null>(null);

  useEffect(() => {
    const token = getJwtToken();
    let valid = false;
    let decoded: UserPayload | null = null;

    if (token) {
        try {
            decoded = jwtDecode<UserPayload>(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp > currentTime) {
              valid = true;
            } else {
              console.warn("JWT token has expired.");
              setJwtToken(null);
            }
        } catch (error) {
            setJwtToken(null);
        }
    }

    setUserInfo(decoded);
    setIsLoggedIn(valid);
    setIsValidating(false);

    if (!valid) {
        navigate('/login');
    }

  }, [navigate]);

  if (isValidating) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <div>Redirecting to login...</div>;
  }

  const handleLogout = () => {
    setJwtToken(null);
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-8">
        <header className="mb-10 flex w-full items-center justify-between">
            <h1 className="text-3xl font-bold">Recordify</h1>
            {userInfo && (
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                        Logged in as {userInfo.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            )}
        </header>

        <main className="flex flex-grow flex-col items-center justify-center">
            <p className="mb-8 text-center text-lg text-gray-600">
                Your meeting summaries, simplified.
            </p>
            <div className="w-full max-w-2xl rounded border p-4 text-center">
                Main content area
            </div>
        </main>
    </div>
  );
}
