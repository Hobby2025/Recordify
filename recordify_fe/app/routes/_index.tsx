import type { MetaFunction } from "@remix-run/node";
import { useRouteLoaderData } from "@remix-run/react";

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

  return (
    <div className="flex flex-col flex-grow items-center justify-center p-8">
      <main className="flex flex-col items-center">
        <p className="mb-8 text-center text-lg text-gray-600">
          Your meeting summaries, simplified.
        </p>
        <div className="w-full max-w-2xl rounded border p-4 text-center">
          {rootData?.user?.isLoggedIn 
            ? `Welcome, ${rootData.user.email || 'User'}!` 
            : 'Main content area (Should not see this if not logged in)'}
        </div>
      </main>
    </div>
  );
}
