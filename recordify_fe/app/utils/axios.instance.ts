import axios from 'axios';

// TODO: 실제 백엔드 API 구조 및 환경 변수에 맞춰 baseURL을 조정하세요.
const baseURL = '/api'; // 예시: 백엔드 API 라우트가 /api로 시작한다고 가정

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 예시: 요청 시간 제한 설정 (10초)
  headers: {
    'Content-Type': 'application/json',
    // 필요한 경우 다른 공통 헤더 추가
  }
});

// 선택 사항: 요청/응답 처리를 위한 인터셉터 추가 (예: 인증 토큰, 오류 로깅)
/*
axiosInstance.interceptors.request.use(
  (config) => {
    // 예시: 사용 가능한 경우 인증 토큰 첨부
    // const token = getAuthToken(); 
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // 2xx 범위 내의 상태 코드는 이 함수를 트리거합니다.
    return response;
  },
  (error) => {
    // 2xx 범위를 벗어나는 상태 코드는 이 함수를 트리거합니다.
    // 예시: 전역 오류 로깅 또는 특정 오류 코드 처리 (예: 로그아웃을 위한 401)
    console.error("Axios 응답 오류:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);
*/

export default axiosInstance; 