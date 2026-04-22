import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Calendar, User, AlertCircle } from "lucide-react";

export default function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(task.id),
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 1000 : "auto",
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg p-4 border border-gray-200 transition-all duration-200
        cursor-grab active:cursor-grabbing
        ${isDragging ? "shadow-2xl ring-2 ring-blue-500" : ""}
      `}
    >
      {/* Task Title */}
      <div className="font-semibold text-gray-900 mb-3 leading-tight line-clamp-2">
        {task.title}
      </div>

      {/* Task Description if available */}
      {task.description && (
        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Assigned User */}
      {task.assignedUserName && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="truncate">{task.assignedUserName}</span>
        </div>
      )}

      {/* Priority and Due Date */}
      <div className="space-y-2">
        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            {task.priority}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-2 text-xs ${isOverdue ? "text-red-600" : "text-gray-500"}`}>
            <Calendar className="w-4 h-4" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            {isOverdue && <span className="font-semibold">Overdue</span>}
          </div>
        )}
      </div>

      {/* Task ID Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
        #{task.id}
      </div>
    </motion.div>
  );
}