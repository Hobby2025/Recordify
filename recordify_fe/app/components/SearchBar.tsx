import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import default CSS
import '~/styles/datepicker.css'; // Import custom CSS for DatePicker styling

// Custom CSS can be added later for Apple styling

interface SearchBarProps {
  onSearchChange: (searchTerm: string, date: Date | null) => void; // Callback to parent with Date type
  // Add props for initial values (passed from parent, derived from URL params)
  defaultSearchTerm?: string;
  defaultSearchDate?: Date | null;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchChange,
  defaultSearchTerm = '', // Default to empty string
  defaultSearchDate = null // Default to null
}) => {
  // Initialize state with default values from props
  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultSearchDate);
  // isCalendarOpen state is no longer needed as DatePicker handles its own visibility

  // Optional: If you want the SearchBar to react if the defaults change due to external navigation
  // (e.g., browser back/forward), uncomment this useEffect.
  /*
  useEffect(() => {
    setSearchTerm(defaultSearchTerm);
    setSelectedDate(defaultSearchDate);
  }, [defaultSearchTerm, defaultSearchDate]);
  */

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    onSearchChange(newSearchTerm, selectedDate); // Notify parent on change
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    onSearchChange(searchTerm, date); // Notify parent with the new date
  };

  // Custom input for DatePicker - adjusted styles for tighter integration
  const CustomDateInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(({ value, onClick }, ref) => (
      <button
          onClick={onClick}
          ref={ref}
          // Removed border, adjusted padding/margins for seamless look
          className="px-2 py-1.5 bg-transparent text-gray-600 hover:text-gray-800 focus:outline-none text-sm flex items-center justify-start"
        >
          {/* Calendar Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {/* Display selected date or placeholder */}
          <span className={value ? 'text-gray-700' : 'text-gray-400'}>{value || 'Any Date'}</span>
      </button>
  ));
  CustomDateInput.displayName = 'CustomDateInput';

  return (
    // Main container: slightly lighter background, rounded, maybe a subtle border
    <div className="mb-4 p-1.5 bg-gray-100 rounded-lg border border-gray-200/75 flex items-center space-x-1 relative shadow-sm">
      {/* Search Icon (optional, for visual cue) */}
       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      
      {/* Title Search Input: remove border, adjust padding */}
      <div className="flex-grow">
        <input
          type="text"
          placeholder="Search Recordings"
          value={searchTerm}
          onChange={handleSearchTermChange}
          // Removed border, focus ring for seamless look. Added padding.
          className="w-full px-2 py-1 bg-transparent focus:outline-none text-sm placeholder-gray-400"
        />
      </div>

      {/* Vertical Separator (optional) */}
      <div className="h-4 w-px bg-gray-300"></div>

      {/* Date Picker: container for alignment */}
      <div className="relative flex items-center">
         <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            customInput={<CustomDateInput />} // Use the styled custom input
            placeholderText="Any Date" // Placeholder in calendar input
            isClearable
            clearButtonClassName="clear-button-custom" // Assign class for custom styling
            calendarClassName="datepicker-custom" // Assign class for custom styling
            popperPlacement="bottom-end" // Position calendar
          />
      </div>
    </div>
  );
};

export default SearchBar; 