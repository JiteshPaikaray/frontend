import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: String(status.id),
  });

  const columnTasks = tasks.filter((t) => t.statusId === status.id);

  const getStatusColor = (statusName) => {
    const name = statusName?.toLowerCase();
    switch (true) {
      case name?.includes("todo") || name?.includes("backlog"):
        return { badge: "bg-slate-100 text-slate-700" };
      case name?.includes("in progress") || name?.includes("doing"):
        return { badge: "bg-blue-100 text-blue-700" };
      case name?.includes("review") || name?.includes("qa"):
        return { badge: "bg-purple-100 text-purple-700" };
      case name?.includes("done") || name?.includes("completed"):
        return { badge: "bg-green-100 text-green-700" };
      default:
        return { badge: "bg-gray-100 text-gray-700" };
    }
  };

  const colorScheme = getStatusColor(status.name);

  return (
    <div
      ref={setNodeRef}
      className={`w-80 flex flex-col rounded-lg border transition-all duration-300 ${
        isOver 
          ? "bg-gray-50 border-blue-400 shadow-md ring-2 ring-blue-200" 
          : "bg-white border-gray-200 shadow-sm"
      }`}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">{status.name}</h3>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${colorScheme.badge}`}>
            {columnTasks.length}
          </span>
        </div>
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto min-h-[500px]">
        <div className="p-3 space-y-2">
          {columnTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-300 mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400">No tasks</p>
            </div>
          ) : (
            columnTasks.map((task) => (
              <div key={task.id}>
                <TaskCard task={task} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}