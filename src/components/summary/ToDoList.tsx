"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  Calendar,
  User,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Clock,
} from "lucide-react";

interface TodoItem {
  id: number;
  task: string;
  assignee: string;
  dueDate: Date | null;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
}

interface ToDoListProps {
  items: TodoItem[];
  onUpdateItem: (id: number, updates: Partial<TodoItem>) => void;
}

const ToDoList = ({ items, onUpdateItem }: ToDoListProps) => {
  const [editingItem, setEditingItem] = useState<number | null>(null);
  type Priority = "high" | "medium" | "low";
  const [newItem, setNewItem] = useState<{
    task: string;
    dueDate: string;
    priority: Priority;
  }>({
    task: "",
    dueDate: "",
    priority: "medium",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleComplete = (id: number) => {
    const item = items.find((item) => item.id === id);
    if (item) {
      onUpdateItem(id, {
        status: item.status === "completed" ? "pending" : "completed",
      });
    }
  };

  const handleUpdatePriority = (
    id: number,
    priority: "high" | "medium" | "low",
  ) => {
    onUpdateItem(id, { priority });
  };

  const handleUpdateDueDate = (id: number, dueDate: string) => {
    onUpdateItem(id, { dueDate: new Date(dueDate) });
  };

  const handleAddItem = () => {
    if (newItem.task.trim()) {
      const item = {
        id: Date.now(),
        task: newItem.task,
        assignee: "김철수", // 현재 사용자
        dueDate: newItem.dueDate ? new Date(newItem.dueDate) : null,
        status: "pending",
        priority: newItem.priority,
      };

      // 실제로는 부모 컴포넌트에서 상태 업데이트
      console.log("Adding new item:", item);

      setNewItem({ task: "", dueDate: "", priority: "medium" });
      setShowAddForm(false);
    }
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityText = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "높음";
      case "medium":
        return "보통";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  const getRelativeDueDate = (dueDate: Date | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}일 지남`, color: "text-red-600" };
    } else if (diffDays === 0) {
      return { text: "오늘", color: "text-yellow-600" };
    } else if (diffDays === 1) {
      return { text: "내일", color: "text-yellow-600" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}일 후`, color: "text-blue-600" };
    } else {
      return { text: due.toLocaleDateString("ko-KR"), color: "text-gray-600" };
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    // 완료되지 않은 항목을 먼저
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    // 우선순위별 정렬
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    // 마감일별 정렬
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (a.dueDate && b.dueDate)
      return a.dueDate.getTime() - b.dueDate.getTime();

    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            할 일 목록 (
            {items.filter((item) => item.status !== "completed").length}/
            {items.length})
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>추가</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* 새 항목 추가 폼 */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <input
                type="text"
                value={newItem.task}
                onChange={(e) =>
                  setNewItem({ ...newItem, task: e.target.value })
                }
                placeholder="새로운 할 일을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex space-x-3">
                <input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) =>
                    setNewItem({ ...newItem, dueDate: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                  value={newItem.priority}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      priority: e.target.value as "high" | "medium" | "low",
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 할 일 목록 */}
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const dueDateInfo = getRelativeDueDate(item.dueDate);

            return (
              <div
                key={item.id}
                className={`p-4 border rounded-lg transition-all ${
                  item.status === "completed"
                    ? "bg-gray-50 border-gray-200 opacity-75"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className={`mt-1 ${
                      item.status === "completed"
                        ? "text-green-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {item.status === "completed" ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  {/* 할 일 내용 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            item.status === "completed"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {item.task}
                        </p>

                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          {/* 담당자 */}
                          <div className="flex items-center space-x-1 text-gray-500">
                            <User className="h-4 w-4" />
                            <span>{item.assignee}</span>
                          </div>

                          {/* 마감일 */}
                          {item.dueDate && dueDateInfo && (
                            <div
                              className={`flex items-center space-x-1 ${dueDateInfo.color}`}
                            >
                              <Calendar className="h-4 w-4" />
                              <span>{dueDateInfo.text}</span>
                            </div>
                          )}

                          {/* 우선순위 */}
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              item.priority,
                            )}`}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {getPriorityText(item.priority)}
                          </span>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="수정"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onUpdateItem(item.id, { status: "completed" })}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">할 일이 없습니다.</p>
            <p className="text-sm text-gray-400">
              새로운 할 일을 추가해보세요.
            </p>
          </div>
        )}

        {/* 진행률 표시 */}
        {items.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">진행률</span>
              <span className="text-sm text-gray-600">
                {Math.round(
                  (items.filter((item) => item.status === "completed").length /
                    items.length) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (items.filter((item) => item.status === "completed")
                      .length /
                      items.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToDoList;
