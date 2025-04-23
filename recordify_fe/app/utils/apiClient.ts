import axios from 'axios';
import { getJwtToken } from '../utils/auth';

// 환경 변수에서 API 기본 URL 가져오기
const baseURL = import.meta.env.VITE_API_URL;

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가: 모든 요청에 JWT 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getJwtToken(); // 토큰 가져오기
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (선택 사항): 예를 들어, 401 에러 시 자동 로그아웃 처리 등
/*
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // TODO: 토큰 제거 및 로그인 페이지로 리디렉션 로직 추가
      // setJwtToken(null);
      // window.location.href = '/login';
      console.error("Unauthorized request - Redirecting to login");
    }
    return Promise.reject(error);
  }
);
*/

export default apiClient; 