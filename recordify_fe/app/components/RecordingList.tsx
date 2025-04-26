import React from 'react';
import { useNavigate, useSearchParams, useNavigation } from '@remix-run/react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

// 녹음 항목 인터페이스 (props 통해 전달됨)
interface RecordingItem {
  id: string;
  title: string;
  date: string;
  duration: string;
}

// RecordingList가 받는 props 인터페이스
interface RecordingListProps {
  recordings: RecordingItem[];
  totalPages: number;
  currentPage: number;
  initialSearchTerm: string;
  initialSearchDate: string;
}

// --- 로딩 상태를 위한 스켈레톤 컴포넌트 ---
const RecordingItemSkeleton: React.FC = () => (
  <li className="px-4 py-3">
    <div className="flex justify-between items-center animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div> {/* 제목 플레이스홀더 */}
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>      {/* 날짜 플레이스홀더 */}
      </div>
      <div className="h-4 bg-gray-200 rounded-full w-12"></div> {/* 길이 플레이스홀더 */}
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
  const navigation = useNavigation(); // 네비게이션 상태 가져오기

  // loader를 통해 새 데이터를 로드 중인지 확인
  const isLoading = navigation.state === 'loading' && navigation.location?.search !== searchParams.toString();
  // navigation.location.search를 확인하여 현재 searchParams와 로딩 위치의 searchParams가 일치하는 초기 로드 시 스켈레톤 표시 방지.
  // 초기 로드 시에도 스켈레톤을 표시하려면 이 조건을 조정하세요.

  // initialSearchDate 문자열(YYYY-MM-DD 또는 빈 문자열)을 Date 객체 또는 null로 변환
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

  // SearchBar 콜백 함수: URL 검색 파라미터 업데이트
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

  // Pagination 콜백 함수: URL 검색 파라미터 업데이트
  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex flex-col">
      {/* 기본값을 SearchBar로 전달. SearchBar는 이를 기반으로 내부 상태 초기화. */}
      <SearchBar
          onSearchChange={handleSearchChange}
          defaultSearchTerm={initialSearchTerm}
          defaultSearchDate={getInitialDateObject()} 
      />

      {/* 목록 컨테이너 div: 고정 높이 (h-96, 약 5개 항목) 및 세로 스크롤 */}
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm h-96 overflow-y-auto">
        {/* UL 높이는 이제 auto, h-full 제거 */}
        <ul className="divide-y divide-gray-200/60">
          {/* 로딩 중일 때 스켈레톤 표시, 그렇지 않으면 목록 또는 빈 메시지 표시 */}
          {isLoading ? (
            // 고정 높이에 맞춰 스켈레톤 렌더링
            Array.from({ length: 5 }).map((_, index) => ( // 고정 높이에 맞춰 스켈레톤 개수 조정
              <RecordingItemSkeleton key={index} />
            ))
          ) : recordings.length > 0 ? (
            recordings.map((rec) => (
              <li key={rec.id} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 text-base truncate">{rec.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{rec.date}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">{rec.duration}</span>
                </div>
              </li>
            ))
          ) : (
            // 빈 목록 메시지 - 고정 높이 컨테이너 내 중앙 정렬
            <li className="p-6 text-center text-gray-500 flex items-center justify-center h-full">
              {initialSearchTerm || initialSearchDate ? '검색 결과가 없습니다.' : '녹음된 항목이 없습니다.'}
            </li>
          )}
        </ul>
      </div>

      {/* 페이지네이션은 하단에 유지됨 */}
      {/* 로딩 중 비활성화 고려? */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        // 예시: 로딩 중 페이지네이션 비활성화
        // isDisabled={isLoading} 
        // (Pagination 컴포넌트에 isDisabled prop 추가 필요)
      />
    </div>
  );
};

export default RecordingList;