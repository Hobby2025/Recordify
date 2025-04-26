import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useRouteLoaderData, useLoaderData, useSearchParams, useRouteError, isRouteErrorResponse, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import axiosInstance from '~/utils/axios.instance'; // Import the configured Axios instance
import { isAxiosError } from 'axios'; // Keep isAxiosError for type checking

// Placeholder imports for components to be created later
import ToggleSwitch from "~/components/ToggleSwitch";
import NewRecording from "~/components/NewRecording";
import RecordingList from "~/components/RecordingList"; // Import the actual component

// --- Type for expected API response (matches backend structure) ---
interface RecordingItem { id: string; title: string; date: string; duration: string; }
interface RecordingsApiResponse {
    recordings: RecordingItem[];
    totalPages: number;
    currentPage: number;
}
// --- Dummy data removed, loader will now fetch --- 
// const allRecordings = [...] 
// const ITEMS_PER_PAGE = 5;

export const meta: MetaFunction = () => {
  return [
    { title: "Recordify - Recordings" },
    { name: "description", content: "Record new audio or browse recordings." },
  ];
};

// --- Remix Loader Function (Using Centralized Axios Instance) ---
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const searchTerm = url.searchParams.get("search") || "";
  const searchDate = url.searchParams.get("date") || "";

  // Params for the API call
  const params = { page, search: searchTerm || undefined, date: searchDate || undefined };
  
  console.log(`[Loader] Axios GET 요청: /recordings, 파라미터:`, params); // Updated log message

  try {
    // --- Make the API call using the configured Axios instance --- 
    // Use relative path '/recordings' as baseURL ('/api') is set in the instance
    const response = await axiosInstance.get<RecordingsApiResponse>('/recordings', { 
        params: params,
        // If you need to pass headers like cookies from the original request:
        // headers: { Cookie: request.headers.get('Cookie') || '' }
        // Note: Be careful about forwarding headers if not necessary
    });

    const data = response.data; 

    return json({
        recordings: data.recordings || [],
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        searchTerm,
        searchDate,
    });

  } catch (error) {
      console.error("[Loader] Axios 인스턴스로 녹음 목록 조회 중 오류:", error);
      // Axios error handling (using isAxiosError from imported axios)
      if (isAxiosError(error)) { // Use isAxiosError for type safety
          if (error.response) {
              console.error("[Loader] Axios API 오류 응답:", error.response.data);
              throw new Response(`API 오류: ${error.response.status} - ${error.response.statusText}`, { status: error.response.status });
          } else if (error.request) {
              console.error("[Loader] Axios 응답 없음:", error.request);
               throw new Error("백엔드 서비스에 연결할 수 없습니다 (응답 없음).");
          } else {
              console.error('[Loader] Axios 요청 설정 오류:', error.message);
               throw new Error(`요청 설정 오류: ${error.message}`);
          }
      } else {
          throw new Error("녹음 목록을 가져오는 중 예상치 못한 오류가 발생했습니다.");
      }
  }
}
// ----------------------------------------------------------------

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
  const loaderData = useLoaderData<typeof loader>();
  const userEmail = rootData?.user?.email || '사용자'; // Default user name in Korean
  const [viewMode, setViewMode] = useState<'new' | 'list'>('list');
  const { recordings, totalPages, currentPage, searchTerm, searchDate } = loaderData;

  return (
    <div className="flex flex-col flex-grow p-4 md:p-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">녹음</h1>
        <ToggleSwitch viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      <main className="flex-grow">
        {viewMode === 'new' ? (
          <NewRecording />
        ) : (
          <RecordingList
            recordings={recordings}
            totalPages={totalPages}
            currentPage={currentPage}
            initialSearchTerm={searchTerm}
            initialSearchDate={searchDate}
          />
        )}
      </main>
    </div>
  );
}

// --- Error Boundary (Translated) ---
export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // Translated toast message
    toast.error("녹음 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.", { id: 'loader-error' });
  }, []);

  console.error("_index ErrorBoundary에서 오류 잡힘:", error);

  // ... error message determination logic ...
  let errorMessage = "예상치 못한 오류가 발생했습니다.";
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleRetry = () => {
    navigate(".", { replace: true });
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center text-center w-full h-[80vh]">
      <h1 className="text-xl font-semibold text-red-600 mb-4">문제가 발생했습니다.</h1>
      <p className="text-gray-600 mb-6">녹음 목록을 불러올 수 없습니다.</p>
      <button 
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        다시 시도
      </button>
    </div>
  );
}
// ----------------------------------
