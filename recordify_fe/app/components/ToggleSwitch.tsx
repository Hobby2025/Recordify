import React from 'react';

interface ToggleSwitchProps {
  viewMode: 'new' | 'list';
  setViewMode: (mode: 'new' | 'list') => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ viewMode, setViewMode }) => {
  // Base style for all buttons
  const baseStyle = "relative px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 rounded-md";
  
  // Style for the active button (adds background, shadow, and text color)
  const activeStyle = "bg-white text-blue-600 shadow-sm";
  
  // Style for inactive buttons (sets text color)
  const inactiveStyle = "text-gray-600 hover:text-gray-800";

  return (
    // Container with a light gray background and rounded corners
    <div className="inline-flex items-center bg-gray-200 p-1 rounded-lg space-x-1">
      <button
        onClick={() => setViewMode('list')}
        // Apply base style and conditionally active or inactive styles
        className={`${baseStyle} ${viewMode === 'list' ? activeStyle : inactiveStyle}`}
      >
        List
      </button>
      <button
        onClick={() => setViewMode('new')}
        className={`${baseStyle} ${viewMode === 'new' ? activeStyle : inactiveStyle}`}
      >
        New Recording
      </button>
    </div>
  );
};

export default ToggleSwitch; 