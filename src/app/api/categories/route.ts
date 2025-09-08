import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/lib/db/models';
import { initializeDatabase } from '@/lib/db/init';

// GET: 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // 데이터베이스에서 카테고리 조회
    const whereClause = activeOnly ? { isActive: true } : {};
    
    const categories = await Category.findAll({
      where: whereClause,
      order: [['sortOrder', 'ASC']]
    });
    
    // API 응답 형식에 맞게 변환
    const formattedCategories = categories.map(category => ({
      id: category.id.toString(),
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      order: category.sortOrder,
      consultationCount: category.consultationCount,
      expertCount: category.expertCount,
      averageRating: parseFloat(category.averageRating.toString()),
      createdAt: category.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: category.updatedAt?.toISOString() || new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedCategories,
      total: formattedCategories.length
    });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 카테고리 추가/수정
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { action, category } = body;
    
    if (action === 'create') {
      // 새 카테고리 생성
      const newCategory = await Category.create({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        sortOrder: category.order || 0,
        consultationCount: 0,
        expertCount: 0,
        averageRating: 0.0
      });
      
      return NextResponse.json({
        success: true,
        message: '카테고리가 성공적으로 생성되었습니다.',
        data: {
          id: newCategory.id.toString(),
          name: newCategory.name,
          description: newCategory.description,
          icon: newCategory.icon,
          isActive: newCategory.isActive,
          order: newCategory.sortOrder,
          consultationCount: newCategory.consultationCount,
          expertCount: newCategory.expertCount,
          averageRating: parseFloat(newCategory.averageRating.toString()),
          createdAt: newCategory.createdAt?.toISOString(),
          updatedAt: newCategory.updatedAt?.toISOString()
        }
      });
      
    } else if (action === 'update') {
      // 기존 카테고리 수정
      const existingCategory = await Category.findByPk(parseInt(category.id));
      
      if (!existingCategory) {
        return NextResponse.json(
          { success: false, message: '존재하지 않는 카테고리입니다.' },
          { status: 404 }
        );
      }
      
      await existingCategory.update({
        name: category.name || existingCategory.name,
        description: category.description || existingCategory.description,
        icon: category.icon || existingCategory.icon,
        isActive: category.isActive !== undefined ? category.isActive : existingCategory.isActive,
        sortOrder: category.order !== undefined ? category.order : existingCategory.sortOrder
      });
      
      return NextResponse.json({
        success: true,
        message: '카테고리가 성공적으로 수정되었습니다.',
        data: {
          id: existingCategory.id.toString(),
          name: existingCategory.name,
          description: existingCategory.description,
          icon: existingCategory.icon,
          isActive: existingCategory.isActive,
          order: existingCategory.sortOrder,
          consultationCount: existingCategory.consultationCount,
          expertCount: existingCategory.expertCount,
          averageRating: parseFloat(existingCategory.averageRating.toString()),
          createdAt: existingCategory.createdAt?.toISOString(),
          updatedAt: existingCategory.updatedAt?.toISOString()
        }
      });
      
    } else if (action === 'delete') {
      // 카테고리 삭제 (비활성화)
      const existingCategory = await Category.findByPk(parseInt(category.id));
      
      if (!existingCategory) {
        return NextResponse.json(
          { success: false, message: '존재하지 않는 카테고리입니다.' },
          { status: 404 }
        );
      }
      
      await existingCategory.update({ isActive: false });
      
      return NextResponse.json({
        success: true,
        message: '카테고리가 성공적으로 비활성화되었습니다.',
        data: {
          id: existingCategory.id.toString(),
          name: existingCategory.name,
          description: existingCategory.description,
          icon: existingCategory.icon,
          isActive: existingCategory.isActive,
          order: existingCategory.sortOrder,
          consultationCount: existingCategory.consultationCount,
          expertCount: existingCategory.expertCount,
          averageRating: parseFloat(existingCategory.averageRating.toString()),
          createdAt: existingCategory.createdAt?.toISOString(),
          updatedAt: existingCategory.updatedAt?.toISOString()
        }
      });
      
    } else if (action === 'reorder') {
      // 카테고리 순서 변경
      const { categoryIds } = body;
      
      if (!Array.isArray(categoryIds)) {
        return NextResponse.json(
          { success: false, message: '카테고리 ID 배열이 필요합니다.' },
          { status: 400 }
        );
      }
      
      // 순서 업데이트
      for (let i = 0; i < categoryIds.length; i++) {
        const category = await Category.findByPk(parseInt(categoryIds[i]));
        if (category) {
          await category.update({ sortOrder: i + 1 });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: '카테고리 순서가 성공적으로 변경되었습니다.'
      });
      
    } else {
      return NextResponse.json(
        { success: false, message: '잘못된 액션입니다.' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('카테고리 작업 실패:', error);
    return NextResponse.json(
      { success: false, message: '카테고리 작업에 실패했습니다.' },
      { status: 500 }
    );
  }
}
