# 데이터베이스 모델 관리

이 폴더는 Sequelize를 사용한 MySQL 데이터베이스 모델들을 관리합니다.

## 📁 폴더 구조

```
lib/db/
├── models/                 # 데이터베이스 모델들
│   ├── index.ts           # 모델 export 파일
│   ├── associations.ts    # 모델 간 연관관계 설정
│   ├── user.model.ts      # 사용자 모델
│   ├── aiUsage.model.ts   # AI 사용량 모델
│   ├── expert.model.ts    # 전문가 모델
│   ├── expertProfile.model.ts      # 전문가 프로필 모델
│   ├── expertAvailability.model.ts # 전문가 일정 모델
│   ├── consultation.model.ts       # 상담 모델
│   ├── consultationSession.model.ts # 상담 세션 모델
│   ├── consultationSummary.model.ts # 상담 요약 모델
│   ├── category.model.ts  # 카테고리 모델
│   ├── review.model.ts    # 리뷰 모델
│   └── payment.model.ts   # 결제 모델
├── sequelize.ts           # Sequelize 연결 설정
├── init.ts               # 데이터베이스 초기화
└── README.md             # 이 파일
```

## 🚀 시작하기

### 1. 환경 변수 설정

`.env` 파일에 다음 환경 변수를 설정하세요:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=consulton
```

### 2. 데이터베이스 초기화

```typescript
import { initializeDatabase } from '@/lib/db/init';

// 애플리케이션 시작 시 호출
await initializeDatabase();
```

### 3. 모델 사용 예제

```typescript
import { User, Expert, Category, Consultation } from '@/lib/db/models';

// 사용자 생성
const user = await User.create({
  email: 'user@example.com',
  name: '홍길동'
});

// 전문가 생성
const expert = await Expert.create({
  userId: user.id,
  specialty: '심리상담',
  experience: 5
});

// 카테고리 조회
const categories = await Category.findAll({
  where: { isActive: true }
});

// 상담 생성
const consultation = await Consultation.create({
  userId: user.id,
  expertId: expert.id,
  categoryId: categories[0].id,
  title: '스트레스 관리 상담',
  consultationType: 'video',
  status: 'scheduled'
});
```

## 📊 모델 관계도

```
User (1) ──── (1) Expert
  │              │
  │              │ (1)
  │              └── ExpertProfile
  │              │
  │              │ (1)
  │              └── ExpertAvailability
  │
  │ (1) ──── (1) AiUsage
  │
  │ (1) ──── (N) Consultation
  │              │
  │              │ (1) ──── (1) ConsultationSummary
  │              │
  │              │ (1) ──── (N) ConsultationSession
  │              │
  │              │ (1) ──── (1) Review
  │              │
  │              │ (1) ──── (N) Payment
  │
  │ (1) ──── (N) Review
  │
  │ (1) ──── (N) Payment

Category (1) ──── (N) Consultation
```

## 🔧 마이그레이션

### 마이그레이션 실행

```bash
# 모든 마이그레이션 실행
npx sequelize-cli db:migrate

# 특정 마이그레이션까지 실행
npx sequelize-cli db:migrate --to 20250903085553-create-categories-table.js

# 마이그레이션 되돌리기
npx sequelize-cli db:migrate:undo
```

### 시드 데이터 실행

```bash
# 모든 시드 데이터 실행
npx sequelize-cli db:seed:all

# 특정 시드 데이터 실행
npx sequelize-cli db:seed --seed 20250903085856-demo-categories.js
```

## 📝 주요 모델 설명

### User (사용자)
- 기본 사용자 정보 관리
- 이메일, 이름 등 기본 정보

### Expert (전문가)
- 전문가 기본 정보
- 전문 분야, 경력, 평점 등

### ExpertProfile (전문가 프로필)
- 전문가 상세 프로필 정보
- 자기소개, 학력, 자격증 등

### ExpertAvailability (전문가 일정)
- 전문가의 요일별 가능 시간 관리

### Consultation (상담)
- 상담 기본 정보
- 상태, 일정, 가격 등

### ConsultationSession (상담 세션)
- 개별 상담 세션 정보
- 대화 기록, 첨부파일 등

### ConsultationSummary (상담 요약)
- 상담 요약 및 액션 아이템

### Category (카테고리)
- 상담 카테고리 관리
- 심리상담, 법률상담 등

### Review (리뷰)
- 상담 후 리뷰 및 평점

### Payment (결제)
- 결제 정보 관리

## ⚠️ 주의사항

1. **개발 환경에서만** `sync({ force: true })` 사용
2. **프로덕션 환경**에서는 마이그레이션 사용
3. **JSON 필드**는 문자열로 저장되므로 파싱 필요
4. **외래키 제약조건** 확인 후 데이터 삭제

## 🐛 문제 해결

### 연결 오류
```bash
# MySQL 서비스 상태 확인
brew services list | grep mysql

# MySQL 서비스 시작
brew services start mysql
```

### 마이그레이션 오류
```bash
# 마이그레이션 상태 확인
npx sequelize-cli db:migrate:status

# 마이그레이션 초기화 (주의!)
npx sequelize-cli db:migrate:undo:all
```
