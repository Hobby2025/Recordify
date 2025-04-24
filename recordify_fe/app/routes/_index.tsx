import type { MetaFunction } from "@remix-run/node";
import { useRouteLoaderData, Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Recordify" },
    { name: "description", content: "Welcome to Recordify!" },
  ];
};

interface RootLoaderData {
  user: {
    isLoggedIn: boolean;
    email?: string;
    picture?: string;
  };
  googleClientId: string | null;
}

export default function Index() {
  const rootData = useRouteLoaderData<RootLoaderData>("root");

  // root loader에서 리디렉션을 처리하므로, 여기서는 항상 로그인된 상태라고 가정할 수 있습니다.
  // 단, rootData가 로드되지 않았을 경우를 대비해 옵셔널 체이닝은 유지하는 것이 안전합니다.
  const userEmail = rootData?.user?.email || 'User';

  return (
    <div className="flex flex-col flex-grow items-center justify-center p-8">
      <main className="flex flex-col items-center">
        <p className="mb-8 text-center text-lg text-gray-600">
          Your meeting summaries, simplified.
        </p>
        <div className="w-full max-w-2xl rounded border p-4 text-center">
           Welcome, {userEmail}!
        </div>
      </main>
    </div>
  );
}
