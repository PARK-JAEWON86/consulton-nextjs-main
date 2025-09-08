import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { CommunityPost } from './communityPost.model';
import { CommunityComment } from './communityComment.model';

// 커뮤니티 좋아요 속성 인터페이스
export interface CommunityLikeAttributes {
  id: number;
  userId: number; // 사용자 ID
  targetType: 'post' | 'comment'; // 좋아요 대상 타입
  targetId: number; // 좋아요 대상 ID
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성
export interface CommunityLikeCreationAttributes extends Optional<CommunityLikeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// 커뮤니티 좋아요 모델 클래스
export class CommunityLike extends Model<CommunityLikeAttributes, CommunityLikeCreationAttributes> implements CommunityLikeAttributes {
  public id!: number;
  public userId!: number;
  public targetType!: 'post' | 'comment';
  public targetId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 연관관계 메서드들
  public getUser!: () => Promise<User>;
  public getTarget!: () => Promise<CommunityPost | CommunityComment | null>;
}

// 모델 초기화
CommunityLike.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    targetType: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
      comment: '좋아요 대상 타입 (게시글 또는 댓글)',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '좋아요 대상 ID (게시글 ID 또는 댓글 ID)',
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
    modelName: 'CommunityLike',
    tableName: 'community_likes',
    timestamps: true,
    indexes: [
      { 
        fields: ['userId', 'targetType', 'targetId'], 
        unique: true,
        name: 'unique_user_target_like'
      },
      { fields: ['userId'] },
      { fields: ['targetType'] },
      { fields: ['targetId'] },
      { fields: ['createdAt'] },
    ],
  }
);

// 연관관계 설정
CommunityLike.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// 다형성 연관관계 (targetType에 따라 다른 모델과 연결)
CommunityLike.belongsTo(CommunityPost, {
  foreignKey: 'targetId',
  as: 'post',
  constraints: false,
  scope: {
    targetType: 'post',
  },
});

CommunityLike.belongsTo(CommunityComment, {
  foreignKey: 'targetId',
  as: 'comment',
  constraints: false,
  scope: {
    targetType: 'comment',
  },
});

export default CommunityLike;
