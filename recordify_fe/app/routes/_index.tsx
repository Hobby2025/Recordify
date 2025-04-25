import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useRouteLoaderData, useLoaderData, useSearchParams, useRouteError, isRouteErrorResponse, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';

// Placeholder imports for components to be created later
import ToggleSwitch from "~/components/ToggleSwitch";
import NewRecording from "~/components/NewRecording";
import RecordingList from "~/components/RecordingList"; // Import the actual component

// --- Dummy Data (Simulating API/DB) ---
interface RecordingItem { id: string; title: string; date: string; duration: string; }
const allRecordings: RecordingItem[] = [
  { id: '1', title: 'Meeting Summary 1', date: '2024-07-28', duration: '15:30' },
  { id: '2', title: 'Project Brainstorm', date: '2024-07-27', duration: '45:10' },
  { id: '3', title: 'Client Call Follow-up', date: '2024-07-26', duration: '08:05' },
  { id: '4', title: 'Weekly Standup', date: '2024-07-25', duration: '22:45' },
  { id: '5', title: 'Design Review', date: '2024-07-24', duration: '35:00' },
  { id: '6', title: 'Marketing Sync', date: '2024-07-23', duration: '18:15' },
  { id: '7', title: 'Feature Planning', date: '2024-07-22', duration: '55:55' },
  { id: '8', title: 'Bug Bash Session', date: '2024-07-21', duration: '12:30' },
  // Add more data if needed
];
const ITEMS_PER_PAGE = 5;
// -------------------------------------

export const meta: MetaFunction = () => {
  return [
    { title: "Recordify - Recordings" },
    { name: "description", content: "Record new audio or browse recordings." },
  ];
};

// --- Remix Loader Function ---
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const searchTerm = url.searchParams.get("search") || "";
  const searchDate = url.searchParams.get("date") || ""; // Dates usually passed as YYYY-MM-DD string

  // --- Simulate API Error ---
  if (searchTerm.toLowerCase() === 'fail_load') {
    console.error("[Simulated Loader Error] Throwing error due to search term.");
    // Simulate different kinds of errors
    // throw new Response("Failed to load recordings from simulated API.", { status: 500 });
    throw new Error("Simulated database connection error.");
  }
  // -------------------------

  // Simulate API filtering
  let filtered = allRecordings.filter(rec => {
    const titleMatch = searchTerm
      ? rec.title.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const dateMatch = searchDate ? rec.date === searchDate : true;
    return titleMatch && dateMatch;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.min(Math.max(page, 1), totalPages || 1); // Ensure page is within bounds

  // Simulate API pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecordings = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // TODO: Replace above simulation with actual API call
  // Example: const response = await fetch(`/api/recordings?page=${currentPage}&search=${searchTerm}&date=${searchDate}`);
  // const data = await response.json();

  return json({
    recordings: paginatedRecordings, // Pass only the data for the current page
    totalPages,
    currentPage,
    searchTerm,
    searchDate,
  });
}
// -------------------------

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
  const loaderData = useLoaderData<typeof loader>(); // Get data from our loader
  const [searchParams] = useSearchParams(); // Get current search params
  const error = useRouteError();
  const navigate = useNavigate();

  // root loader에서 리디렉션을 처리하므로, 여기서는 항상 로그인된 상태라고 가정할 수 있습니다.
  // 단, rootData가 로드되지 않았을 경우를 대비해 옵셔널 체이닝은 유지하는 것이 안전합니다.
  const userEmail = rootData?.user?.email || 'User';

  // State to manage the current view ('new' or 'list')
  const [viewMode, setViewMode] = useState<'new' | 'list'>('list');

  // Extract data for RecordingList props
  const { recordings, totalPages, currentPage, searchTerm, searchDate } = loaderData;

  return (
    <div className="flex flex-col flex-grow p-4 md:p-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recordings</h1>
        <ToggleSwitch viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      <main className="flex-grow">
        <div className="mb-4 text-sm text-gray-600">
          Welcome, {userEmail}!
        </div>

        {viewMode === 'new' ? (
          // Placeholder for NewRecording component
          <NewRecording />
        ) : (
          <RecordingList
            recordings={recordings} // Pass data from loader
            totalPages={totalPages}
            currentPage={currentPage}
            // Pass current search params for consistency, though RecordingList will use useSearchParams soon
            initialSearchTerm={searchTerm}
            initialSearchDate={searchDate}
          />
        )}
      </main>
    </div>
  );
}

// --- Error Boundary for this route ---
export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // Display toast notification on error
    toast.error("Failed to load recordings. Please try again later.", { id: 'loader-error' });
  }, []); // Run only once when boundary mounts

  // Log the error to the console for debugging
  console.error("Error caught by _index ErrorBoundary:", error);

  // Determine the message to display based on the error type
  let errorMessage = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    // Remix-specific error response (e.g., from `throw new Response(...)`)
    errorMessage = `${error.status} ${error.statusText}: ${error.data}`;
  } else if (error instanceof Error) {
    // Standard JavaScript error (e.g., from `throw new Error(...)`)
    errorMessage = error.message;
  }

  const handleRetry = () => {
    // Navigate back to the index page without the error-causing params (or reload)
    navigate(".", { replace: true });
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center text-center h-full">
      <h1 className="text-xl font-semibold text-red-600 mb-4">Oops! Something went wrong.</h1>
      <p className="text-gray-600 mb-6">We couldn't load the recordings.</p>
      {/* Optional: Display error details for debugging (remove in production) */}
      {/* <pre className="text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-w-full mb-4">
        {errorMessage}
      </pre> */}
      <button 
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  );
}
// ----------------------------------
