import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TaskCard({ task }) {
  // const { attributes, listeners, setNodeRef, transform, isDragging } =
  //   useDraggable({
  //     id: String(task.id),
  //   });
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: task.id,
});

  // const style = {
  //   transform: CSS.Translate.toString(transform),
  //   transition: isDragging ? "none" : "all 200ms cubic-bezier(0.2, 0, 0, 1)",
  //   opacity: isDragging ? 0.5 : 1,
  // };
  const style = {
  // If the item is being dragged, make the original one semi-transparent
  opacity: isDragging ? 0.3 : 1, 
  // Optional: add a dashed border to the ghost
  border: isDragging ? '2px dashed #cbd5e1' : 'none',
};

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" };
      case "medium":
        return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", dot: "bg-yellow-500" };
      case "low":
        return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" };
      default:
        return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" };
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const priorityColor = getPriorityColor(task.priority);

  return (
    // <div
    //   ref={setNodeRef}
    //   style={style}
    //   {...listeners}
    //   {...attributes}
    //   className={`group relative bg-white rounded-lg border transition-all duration-200 p-3
    //     ${isDragging 
    //       ? "shadow-2xl ring-2 ring-blue-500 scale-105" 
    //       : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-grab active:cursor-grabbing"
    //     }
    //   `}
    // >
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Priority Indicator Dot */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${priorityColor.dot}`}></div>

      {/* Task Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 pr-4 line-clamp-2 group-hover:text-gray-700">
        {task.title}
      </h3>

      {/* Task Description if available */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer Section */}
      <div className="space-y-2">
        {/* Assigned User */}
        {task.assignedUserName && (
          <div className="flex items-center gap-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 truncate">{task.assignedUserName}</span>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            {isOverdue && <span className="ml-auto">Overdue</span>}
          </div>
        )}

        {/* Priority Badge */}
        <div className="flex items-center justify-between pt-1">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${priorityColor.text} ${priorityColor.bg} border ${priorityColor.border}`}>
            {task.priority === "High" && <AlertCircle className="w-3 h-3" />}
            {task.priority}
          </div>
          <span className="text-xs text-gray-400">#{task.id}</span>
        </div>
      </div>
    </div>
  );
}