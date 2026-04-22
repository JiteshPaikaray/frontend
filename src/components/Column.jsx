import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: String(status.id),
  });

  const columnTasks = tasks.filter((t) => t.statusId === status.id);

  return (
    <div whileDrag={{ scale: 1.05 }}
      ref={setNodeRef}
      className={`w-72 p-3 rounded-xl border bg-gray-100 min-h-[300px] transition-all duration-200 ${
        isOver ? "bg-blue-100" : ""
      }`}
    >
      <h4 className="font-semibold mb-2">{status.name}</h4>

      <div className="space-y-2">
        {columnTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}