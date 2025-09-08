// 쿠키 기반 인증 유틸리티 함수들

// 쿠키 설정
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  
  // 로컬 스토리지도 함께 업데이트하여 탭 간 동기화
  localStorage.setItem(`cookie-${name}`, value);
  
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('authStateChanged', { 
    detail: { type: 'login', name, value } 
  }));
};

// 쿠키 가져오기
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// 쿠키 삭제
export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  
  // 로컬 스토리지에서도 제거
  localStorage.removeItem(`cookie-${name}`);
  
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('authStateChanged', { 
    detail: { type: 'logout', name } 
  }));
};

// 인증 토큰 설정
export const setAuthToken = (token: string) => {
  setCookie('auth-token', token, 7);
  localStorage.setItem('consulton-auth', 'true');
};

// 인증 토큰 가져오기
export const getAuthToken = (): string | null => {
  return getCookie('auth-token');
};

// 사용자 정보 설정
export const setUserData = (userData: any) => {
  setCookie('user-data', JSON.stringify(userData), 7);
  localStorage.setItem('consulton-user', JSON.stringify(userData));
};

// 사용자 정보 가져오기
export const getUserData = (): any | null => {
  const userData = getCookie('user-data');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
};

// 로그아웃 처리
export const logout = () => {
  deleteCookie('auth-token');
  deleteCookie('user-data');
  localStorage.removeItem('consulton-auth');
  localStorage.removeItem('consulton-user');
  localStorage.removeItem('consulton-viewMode');
  
  // API 상태도 초기화
  fetch('/api/app-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout', data: {} })
  }).catch(console.error);
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData);
};

// 인증 상태 동기화
export const syncAuthState = async () => {
  try {
    const token = getAuthToken();
    const userData = getUserData();
    
    if (token && userData) {
      // API 상태와 동기화
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setAuthenticated', data: { isAuthenticated: true } })
      });
      
      await fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setUser', data: { user: userData } })
      });
      
      return { isAuthenticated: true, user: userData };
    }
    
    return { isAuthenticated: false, user: null };
  } catch (error) {
    console.error('인증 상태 동기화 실패:', error);
    return { isAuthenticated: false, user: null };
  }
};

// 인증 상태 변경 이벤트 리스너 설정
export const setupAuthStateListener = (callback: (isAuthenticated: boolean, user: any) => void) => {
  const handleAuthChange = (event: CustomEvent) => {
    const { type } = event.detail;
    if (type === 'login' || type === 'logout') {
      const auth = isAuthenticated();
      const user = getUserData();
      callback(auth, user);
    }
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'consulton-auth' || event.key === 'consulton-user') {
      const auth = isAuthenticated();
      const user = getUserData();
      callback(auth, user);
    }
  };

  window.addEventListener('authStateChanged', handleAuthChange as EventListener);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    window.removeEventListener('storage', handleStorageChange);
  };
};
