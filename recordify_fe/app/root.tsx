import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { getSession, commitSession } from './utils/session.server';
import type { UserPayload } from './utils/auth';
import { useEffect } from "react";
import toast from 'react-hot-toast';
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./tailwind.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || null;
  
  if (!googleClientId) {
    console.error("CRITICAL: GOOGLE_CLIENT_ID environment variable is not set.");
    throw new Response("Server configuration error: Google Client ID is missing.", { status: 500 });
  }

  const session = await getSession(request);
  const jwt = session.get("jwt");
  const message = session.get("globalMessage") || null;

  let user: { isLoggedIn: boolean; email?: string; picture?: string } = {
    isLoggedIn: false,
  };

  if (jwt) {
    try {
      const decoded = jwtDecode<UserPayload>(jwt);
      const currentTime = Date.now() / 1000;
      if (decoded.exp > currentTime) {
        user = {
          isLoggedIn: true,
          email: decoded.email,
          picture: decoded.picture,
        };
      } else {
        console.warn("Expired JWT found in session cookie.");
        session.unset("jwt");
      }
    } catch (error) {
      console.error("Error decoding JWT from session cookie:", error);
      session.unset("jwt");
    }
  }

  return json(
    { googleClientId, user, message },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      }
    }
  );
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

export default function App() {
  const { googleClientId, user, message } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (message) {
      if (typeof message === 'string') {
        toast.success(message, { id: 'global-message' });
      } else {
        console.warn("Received non-string flash message:", message);
      }
    }
  }, [message]);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="bg-neutral">
          <div className="max-w-xl mx-auto min-h-screen flex flex-col bg-white shadow-lg overflow-hidden">
            <Toaster position="bottom-center" />
            <Header />
            <main className="flex flex-grow px-4 py-8 text-primary-dark overflow-y-auto">
              <Outlet />
            </main>
            <Footer />
            <ScrollRestoration />
            <Scripts />
          </div>
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}
