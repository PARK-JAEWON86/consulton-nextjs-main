import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { CommunityPost } from './communityPost.model';

// 커뮤니티 댓글 속성 인터페이스
export interface CommunityCommentAttributes {
  id: number;
  postId: number; // 게시글 ID
  userId: number; // 작성자 ID
  parentId?: number; // 부모 댓글 ID (대댓글인 경우)
  content: string; // 댓글 내용
  status: 'active' | 'hidden' | 'deleted'; // 상태
  isAnonymous: boolean; // 익명 여부
  likes: number; // 좋아요 수
  depth: number; // 댓글 깊이 (0: 최상위, 1: 대댓글)
  order: number; // 댓글 순서 (같은 depth 내에서)
  expertSpecialty?: string; // 전문가 전문분야 (전문가 댓글인 경우)
  expertLevel?: 'junior' | 'senior' | 'expert' | 'master'; // 전문가 레벨
  expertExperience?: number; // 전문가 경력 (년)
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성
export interface CommunityCommentCreationAttributes extends Optional<CommunityCommentAttributes, 'id' | 'parentId' | 'isAnonymous' | 'likes' | 'depth' | 'order' | 'expertSpecialty' | 'expertLevel' | 'expertExperience' | 'createdAt' | 'updatedAt'> {}

// 커뮤니티 댓글 모델 클래스
export class CommunityComment extends Model<CommunityCommentAttributes, CommunityCommentCreationAttributes> implements CommunityCommentAttributes {
  public id!: number;
  public postId!: number;
  public userId!: number;
  public parentId?: number;
  public content!: string;
  public status!: 'active' | 'hidden' | 'deleted';
  public isAnonymous!: boolean;
  public likes!: number;
  public depth!: number;
  public order!: number;
  public expertSpecialty?: string;
  public expertLevel?: 'junior' | 'senior' | 'expert' | 'master';
  public expertExperience?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 연관관계 메서드들
  public getUser!: () => Promise<User>;
  public getPost!: () => Promise<CommunityPost>;
  public getParent!: () => Promise<CommunityComment | null>;
  public getReplies!: () => Promise<CommunityComment[]>;
}

// 모델 초기화
CommunityComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'community_posts',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'community_comments',
        key: 'id',
      },
      comment: '대댓글인 경우 부모 댓글 ID',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '댓글 깊이 (0: 최상위, 1: 대댓글)',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '댓글 순서 (같은 depth 내에서)',
    },
    expertSpecialty: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전문가 전문분야 (전문가 댓글인 경우에만 사용)',
    },
    expertLevel: {
      type: DataTypes.ENUM('junior', 'senior', 'expert', 'master'),
      allowNull: true,
      comment: '전문가 레벨 (전문가 댓글인 경우에만 사용)',
    },
    expertExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '전문가 경력 (년) (전문가 댓글인 경우에만 사용)',
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
    modelName: 'CommunityComment',
    tableName: 'community_comments',
    timestamps: true,
    indexes: [
      { fields: ['postId'] },
      { fields: ['userId'] },
      { fields: ['parentId'] },
      { fields: ['status'] },
      { fields: ['depth'] },
      { fields: ['order'] },
      { fields: ['expertSpecialty'] },
      { fields: ['expertLevel'] },
      { fields: ['createdAt'] },
    ],
  }
);

// 연관관계 설정
CommunityComment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CommunityComment.belongsTo(CommunityPost, {
  foreignKey: 'postId',
  as: 'post',
});

// 자체 참조 (대댓글)
CommunityComment.belongsTo(CommunityComment, {
  foreignKey: 'parentId',
  as: 'parent',
});

CommunityComment.hasMany(CommunityComment, {
  foreignKey: 'parentId',
  as: 'replies',
});

export default CommunityComment;
