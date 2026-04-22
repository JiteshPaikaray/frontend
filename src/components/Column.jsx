import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import { motion } from "framer-motion";

export default function Column({ status, tasks }) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: String(status.id),
  });

  const columnTasks = tasks.filter((t) => t.statusId === status.id);

  const getStatusColor = (statusName) => {
    const name = statusName?.toLowerCase();
    switch (true) {
      case name?.includes("todo") || name?.includes("backlog"):
        return { bg: "bg-slate-50", border: "border-slate-200", header: "bg-slate-100", hover: "hover:bg-slate-100" };
      case name?.includes("in progress") || name?.includes("doing"):
        return { bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-100", hover: "hover:bg-blue-100" };
      case name?.includes("review") || name?.includes("qa"):
        return { bg: "bg-purple-50", border: "border-purple-200", header: "bg-purple-100", hover: "hover:bg-purple-100" };
      case name?.includes("done") || name?.includes("completed"):
        return { bg: "bg-green-50", border: "border-green-200", header: "bg-green-100", hover: "hover:bg-green-100" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", header: "bg-gray-100", hover: "hover:bg-gray-100" };
    }
  };

  const colorScheme = getStatusColor(status.name);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-80 rounded-2xl border-2 min-h-[500px] flex flex-col transition-all duration-300 ${
        isOver ? `${colorScheme.border} ring-4 ring-blue-400 shadow-2xl ${colorScheme.hover}` : `${colorScheme.border} ${colorScheme.bg}`
      }`}
    >
      {/* Column Header */}
      <div className={`${colorScheme.header} px-4 py-4 rounded-t-xl border-b-2 ${colorScheme.border}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900 text-lg">{status.name}</h4>
          <span className="inline-flex items-center justify-center w-6 h-6 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-300">
            {columnTasks.length}
          </span>
        </div>
      </div>

      {/* Task List Container - The entire area is droppable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px]">
        {columnTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-center">No tasks in this column</p>
          </div>
        ) : (
          columnTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <TaskCard task={task} />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}