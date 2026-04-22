import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-lg shadow p-3 border 
        cursor-grab active:cursor-grabbing
        ${isDragging ? "shadow-xl" : ""}
      `}
    >
      <div className="font-medium">{task.title}</div>

      <div className="text-sm text-gray-500 mt-1">
        {task.assignedUserName}
      </div>

      <div className="mt-2 text-xs flex justify-between">
        <span className="px-2 py-1 bg-red-100 text-red-600 rounded">
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="text-gray-400">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}