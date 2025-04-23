import React from 'react';
import { NavLink } from '@remix-run/react';

// 네비게이션 아이템 정의
const navItems = [
  { name: '녹음', path: '/' },
  { name: '회의록', path: '/summary' },
];

const Navigation: React.FC = () => {
  return (
    <nav className="flex space-x-4">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'text-primary-light font-extrabold underline underline-offset-8'
                : 'text-white hover:text-primary-light hover:underline hover:underline-offset-8 transition-all duration-300'
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation; 