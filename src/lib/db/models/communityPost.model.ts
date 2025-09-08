import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Category } from './category.model';
import { Consultation } from './consultation.model';
import { Expert } from './expert.model';

// 커뮤니티 게시글 속성 인터페이스
export interface CommunityPostAttributes {
  id: number;
  userId: number; // 작성자 ID
  categoryId?: number; // 카테고리 ID
  title: string; // 제목
  content: string; // 내용
  postType: 'general' | 'consultation_request' | 'consultation_review' | 'expert_intro'; // 게시글 타입
  status: 'draft' | 'published' | 'hidden' | 'deleted'; // 상태
  isPinned: boolean; // 상단 고정 여부
  isAnonymous: boolean; // 익명 여부
  views: number; // 조회수
  likes: number; // 좋아요 수
  comments: number; // 댓글 수
  tags?: string[]; // 태그 배열
  attachments?: any[]; // 첨부파일 정보
  consultationId?: number; // 관련 상담 ID
  expertId?: number; // 관련 전문가 ID
  publishedAt?: Date; // 게시일
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성
export interface CommunityPostCreationAttributes extends Optional<CommunityPostAttributes, 'id' | 'categoryId' | 'isPinned' | 'isAnonymous' | 'views' | 'likes' | 'comments' | 'tags' | 'attachments' | 'consultationId' | 'expertId' | 'publishedAt' | 'createdAt' | 'updatedAt'> {}

// 커뮤니티 게시글 모델 클래스
export class CommunityPost extends Model<CommunityPostAttributes, CommunityPostCreationAttributes> implements CommunityPostAttributes {
  public id!: number;
  public userId!: number;
  public categoryId?: number;
  public title!: string;
  public content!: string;
  public postType!: 'general' | 'consultation_request' | 'consultation_review' | 'expert_intro';
  public status!: 'draft' | 'published' | 'hidden' | 'deleted';
  public isPinned!: boolean;
  public isAnonymous!: boolean;
  public views!: number;
  public likes!: number;
  public comments!: number;
  public tags?: string[];
  public attachments?: any[];
  public consultationId?: number;
  public expertId?: number;
  public publishedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 연관관계 메서드들
  public getUser!: () => Promise<User>;
  public getCategory!: () => Promise<Category | null>;
  public getConsultation!: () => Promise<Consultation | null>;
  public getExpert!: () => Promise<Expert | null>;
}

// 모델 초기화
CommunityPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    postType: {
      type: DataTypes.ENUM('general', 'consultation_request', 'consultation_review', 'expert_intro'),
      allowNull: false,
      defaultValue: 'general',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'hidden', 'deleted'),
      allowNull: false,
      defaultValue: 'published',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '태그 배열 (JSON)',
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '첨부파일 정보 (JSON)',
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'consultations',
        key: 'id',
      },
      comment: '관련 상담 ID (상담후기나 상담요청인 경우)',
    },
    expertId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'experts',
        key: 'id',
      },
      comment: '관련 전문가 ID (전문가소개인 경우)',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '게시일 (draft에서 published로 변경된 시점)',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CommunityPost',
    tableName: 'community_posts',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['categoryId'] },
      { fields: ['postType'] },
      { fields: ['status'] },
      { fields: ['isPinned'] },
      { fields: ['publishedAt'] },
      { fields: ['createdAt'] },
      { fields: ['views'] },
      { fields: ['likes'] },
      { fields: ['consultationId'] },
      { fields: ['expertId'] },
    ],
  }
);

// 연관관계 설정
CommunityPost.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CommunityPost.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

CommunityPost.belongsTo(Consultation, {
  foreignKey: 'consultationId',
  as: 'consultation',
});

CommunityPost.belongsTo(Expert, {
  foreignKey: 'expertId',
  as: 'expert',
});

export default CommunityPost;
