import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Simple pagination: Previous, Next buttons. More complex logic (page numbers) can be added later.
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Updated styles for cleaner look
  const buttonBaseStyle = "px-3 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150";
  const activeStyle = "text-blue-600 hover:bg-blue-50 active:bg-blue-100";
  const disabledStyle = "text-gray-400 cursor-not-allowed";

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  return (
    <div className="mt-6 flex justify-center items-center space-x-4"> {/* Increased margin-top and spacing */}
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={`${buttonBaseStyle} ${canGoPrev ? activeStyle : disabledStyle}`}
        aria-label="Go to previous page"
      >
        {/* Simple Text or Icon - using text for now */}
        Previous
      </button>

      {/* Page Info */}
      <span className="text-sm text-gray-500 font-medium">
        Page {currentPage} <span className="text-gray-400">of</span> {totalPages}
      </span>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`${buttonBaseStyle} ${canGoNext ? activeStyle : disabledStyle}`}
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination; 