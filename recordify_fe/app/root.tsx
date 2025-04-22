import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { json } from "@remix-run/node";
import { GoogleOAuthProvider } from '@react-oauth/google';

import "./tailwind.css";

// Loader 함수: 서버에서 환경 변수를 읽어 클라이언트로 전달
export async function loader({ request }: LoaderFunctionArgs) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || null;
  return json({ googleClientId });
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  // useLoaderData 훅을 사용하여 loader에서 전달된 데이터 받기
  const { googleClientId } = useLoaderData<typeof loader>();

  if (!googleClientId) {
    return <div>Error: Google Client ID is missing. Cannot initialize Google Login.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return <Outlet />;
}
