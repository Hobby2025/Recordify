import React, { useState, useRef, useEffect } from 'react';
import { Link, useLoaderData, Form } from '@remix-run/react';
import Navigation from './Navigation';

// 추가: Loader 데이터 타입 정의 (root.tsx loader 반환 타입과 일치)
interface LoaderData {
  user: {
    isLoggedIn: boolean;
    email?: string;
    picture?: string;
  };
  // googleClientId는 Header에서 직접 사용하지 않으므로 생략 가능
}

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 변경: useLoaderData 사용
  const { user } = useLoaderData<LoaderData>(); 

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  // 드롭다운 외부 클릭 감지 useEffect는 유지 (UI 상태 관리)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link to="/">
            <img src="/images/Recordify_Logo.webp" alt="Recordify Logo" className="h-10" />
          </Link>
          {/* 변경: user.isLoggedIn으로 조건 확인 */}
          {user.isLoggedIn && (
              <Navigation />
          )}
        </div>

        {/* 변경: user.isLoggedIn 및 user 객체로 조건 확인 */}
        {user.isLoggedIn && user.email ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 focus:ring-offset-primary rounded-full"
            >
              {/* 변경: user.picture 사용 */}
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full" />
              ) : (
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-light">
                  {/* 변경: user.email 사용 */}
                  <span className="text-sm font-medium leading-none text-white">{user.email[0].toUpperCase()}</span>
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 text-primary-dark ring-1 ring-black ring-opacity-5">
                <div className="px-4 py-2 border-b border-neutral">
                  <p className="text-sm font-medium text-gray-900 truncate">Signed in as</p>
                  {/* 변경: user.email 사용 */}
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-neutral"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  {/* 변경: 로그아웃 버튼을 Form으로 감싸기 */}
                  <Form method="post" action="/logout" onSubmit={() => setIsDropdownOpen(false)}>
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral"
                    >
                      Logout
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10"></div>
        )}
      </div>
    </header>
  );
};

export default Header; 