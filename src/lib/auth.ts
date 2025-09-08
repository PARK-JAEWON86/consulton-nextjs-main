import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import bcrypt from 'bcryptjs';

// JWT 시크릿 키 (환경변수에서 가져오거나 기본값 사용)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT 시크릿을 Uint8Array로 변환 (jose 라이브러리 요구사항)
const secretKey = new TextEncoder().encode(JWT_SECRET);

// 사용자 타입 정의
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'client' | 'expert' | 'admin';
  expertId?: number; // 전문가인 경우
}

// JWT 페이로드 타입
export interface JWTPayload {
  userId: number;
  email: string;
  role: 'client' | 'expert' | 'admin';
  expertId?: number;
  iat?: number;
  exp?: number;
}

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 토큰 생성
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const payload: any = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expertId: user.expertId
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuer('consulton')
    .setAudience('consulton-users')
    .sign(secretKey);

  return jwt;
}

/**
 * JWT 토큰 검증
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'consulton',
      audience: 'consulton-users'
    });
    
    return payload as any;
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error);
    return null;
  }
}

/**
 * 요청에서 JWT 토큰 추출
 */
export function extractTokenFromRequest(request: Request): string | null {
  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 쿠키에서 토큰 추출 (fallback)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies['auth-token'] || null;
  }

  return null;
}

/**
 * 인증된 사용자 정보 추출
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthUser | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    expertId: payload.expertId,
    name: '' // 이름은 별도로 조회해야 함
  };
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호는 대문자를 포함해야 합니다.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호는 소문자를 포함해야 합니다.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호는 숫자를 포함해야 합니다.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('비밀번호는 특수문자를 포함해야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 토큰 새로고침 (선택적 구현)
 */
export async function refreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  // 토큰이 만료되기 1시간 전에만 새로고침 허용
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp - now < 3600) {
    return await generateToken({
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      expertId: payload.expertId,
      name: ''
    });
  }

  return null;
}
