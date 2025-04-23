import { jwtDecode } from 'jwt-decode';

// 간단한 인메모리 + sessionStorage 기반 JWT 관리

export function setJwtToken(token: string | null) {
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') { 
    if (token) {
      sessionStorage.setItem('jwtToken', token);
    } else {
      sessionStorage.removeItem('jwtToken');
    }
  }
}

export function getJwtToken(): string | null {
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem('jwtToken');
  }
  return null;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getJwtToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error decoding token in isLoggedIn:", error);
    setJwtToken(null);
    return false;
  }
}

// UserPayload 타입도 여기로 옮겨서 관리 (선택 사항)
export interface UserPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  picture?: string;
} 