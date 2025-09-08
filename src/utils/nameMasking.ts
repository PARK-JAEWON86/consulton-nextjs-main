/**
 * 프로필 공개설정에 따라 이름을 마스킹 처리하는 유틸리티 함수
 */

export type ProfileVisibility = "public" | "experts" | "private";

/**
 * 이름을 마스킹 처리합니다
 * @param name 원본 이름
 * @param visibility 프로필 공개설정
 * @param isExpertViewer 전문가가 보는 경우인지 여부
 * @returns 마스킹 처리된 이름
 */
export function maskName(
  name: string, 
  visibility: ProfileVisibility, 
  isExpertViewer: boolean = false
): string {
  if (!name || name.trim() === "") {
    return "익명";
  }

  // 전체 공개인 경우 원본 이름 반환
  if (visibility === "public") {
    return name;
  }

  // 전문가만 설정이고 전문가가 보는 경우 원본 이름 반환
  if (visibility === "experts" && isExpertViewer) {
    return name;
  }

  // 그 외의 경우 (전문가만 + 일반 사용자, 비공개) 마스킹 처리
  return maskNameString(name);
}

/**
 * 이름 문자열을 마스킹 처리합니다
 * @param name 원본 이름
 * @returns 마스킹 처리된 이름 (예: "김*", "홍길*")
 */
function maskNameString(name: string): string {
  const trimmedName = name.trim();
  
  if (trimmedName.length <= 1) {
    return trimmedName + "*";
  }
  
  if (trimmedName.length === 2) {
    return trimmedName.charAt(0) + "*";
  }
  
  // 3글자 이상인 경우: 첫 글자 + 마지막 글자 + *
  return trimmedName.charAt(0) + "*" + trimmedName.charAt(trimmedName.length - 1);
}

/**
 * 사용자 정보에서 이름을 마스킹 처리합니다
 * @param user 사용자 정보
 * @param visibility 프로필 공개설정
 * @param isExpertViewer 전문가가 보는 경우인지 여부
 * @returns 마스킹 처리된 사용자 정보
 */
export function maskUserInfo(
  user: { 
    name?: string; 
    displayName?: string; 
    profileVisibility?: ProfileVisibility;
  },
  isExpertViewer: boolean = false
): { 
  name: string; 
  displayName: string; 
  isMasked: boolean;
} {
  const visibility = user.profileVisibility || "experts";
  const name = user.name || "";
  const displayName = user.displayName || "";
  
  const maskedName = maskName(name, visibility, isExpertViewer);
  const maskedDisplayName = maskName(displayName, visibility, isExpertViewer);
  
  const isMasked = maskedName !== name || maskedDisplayName !== displayName;
  
  return {
    name: maskedName,
    displayName: maskedDisplayName,
    isMasked
  };
}

/**
 * 게시글 작성자 정보를 마스킹 처리합니다
 * @param author 작성자 이름
 * @param profileVisibility 프로필 공개설정
 * @param isExpertViewer 전문가가 보는 경우인지 여부
 * @returns 마스킹 처리된 작성자 정보
 */
export function maskPostAuthor(
  author: string,
  profileVisibility: ProfileVisibility,
  isExpertViewer: boolean = false
): string {
  return maskName(author, profileVisibility, isExpertViewer);
}
