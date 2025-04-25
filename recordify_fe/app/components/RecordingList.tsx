import React from 'react';
import { useNavigate, useSearchParams, useNavigation } from '@remix-run/react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

// Interface for recording items (passed via props)
interface RecordingItem {
  id: string;
  title: string;
  date: string;
  duration: string;
}

// Props expected by RecordingList
interface RecordingListProps {
  recordings: RecordingItem[];
  totalPages: number;
  currentPage: number;
  initialSearchTerm: string;
  initialSearchDate: string;
}

// --- Skeleton Component for Loading State ---
const RecordingItemSkeleton: React.FC = () => (
  <li className="px-4 py-3">
    <div className="flex justify-between items-center animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div> {/* Title placeholder */}
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>      {/* Date placeholder */}
      </div>
      <div className="h-4 bg-gray-200 rounded-full w-12"></div> {/* Duration placeholder */}
    </div>
  </li>
);
// ------------------------------------------

const RecordingList: React.FC<RecordingListProps> = ({
  recordings,
  totalPages,
  currentPage,
  initialSearchTerm,
  initialSearchDate,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation(); // Get navigation state

  // Determine if the list is currently loading new data via the loader
  const isLoading = navigation.state === 'loading' && navigation.location?.search !== searchParams.toString();
  // We check navigation.location.search to avoid showing skeleton on the initial load when current searchParams match the loading location's searchParams.
  // Adjust this condition if skeleton is desired on initial load as well.

  // Convert initialSearchDate string (YYYY-MM-DD or empty) to Date object or null
  const getInitialDateObject = (): Date | null => {
    if (!initialSearchDate) return null;
    try {
      // Ensure correct parsing, consider timezone if necessary.
      // Adding time prevents potential off-by-one day errors due to timezone conversion.
      const date = new Date(initialSearchDate + 'T00:00:00'); 
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      console.error("Error parsing initial date:", e);
      return null;
    }
  };

  // Callback function for SearchBar: Update URL Search Params
  const handleSearchChange = (newSearchTerm: string, newDate: Date | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchTerm) {
        newSearchParams.set('search', newSearchTerm);
    } else {
        newSearchParams.delete('search');
    }
    if (newDate) {
        newSearchParams.set('date', newDate.toISOString().split('T')[0]);
    } else {
        newSearchParams.delete('date');
    }
    newSearchParams.set('page', '1');
    navigate(`?${newSearchParams.toString()}`);
  };

  // Callback function for Pagination: Update URL Search Params
  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex flex-col">
      {/* Pass default values to SearchBar. SearchBar initializes its state based on these. */}
      <SearchBar
          onSearchChange={handleSearchChange}
          defaultSearchTerm={initialSearchTerm}
          defaultSearchDate={getInitialDateObject()} 
      />

      {/* Apply iOS-like list styling: remove outer border/shadow, rely on internal dividers */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200/80 shadow-sm min-h-[320px]"> {/* Adjusted min-height slightly */}
        <ul className="divide-y divide-gray-200/75"> {/* Use slightly lighter divider */}
          {/* Show Skeleton when loading, otherwise show list or empty message */}
          {isLoading ? (
            // Render multiple skeleton items (e.g., 5 for typical page size)
            Array.from({ length: 5 }).map((_, index) => (
              <RecordingItemSkeleton key={index} />
            ))
          ) : recordings.length > 0 ? (
            recordings.map((rec) => (
              // Adjust padding and hover effect for list items
              <li key={rec.id} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    {/* Adjust text size and color */}
                    <p className="font-medium text-gray-800 text-base truncate">{rec.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{rec.date}</p>
                  </div>
                  {/* Adjust duration style - maybe make it less prominent */}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">{rec.duration}</span>
                </div>
              </li>
            ))
          ) : (
            // Style for empty list state
            <li className="p-6 text-center text-gray-500">
              {initialSearchTerm || initialSearchDate ? 'No matching recordings found.' : 'No recordings found.'}
            </li>
          )}
        </ul>
      </div>

      {/* Pass pagination data from props */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default RecordingList;