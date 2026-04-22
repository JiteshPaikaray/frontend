import { useEffect, useState } from "react";
import { getTasksByProject, moveTask } from "../services/taskService";
import { getStatuses } from "../services/statusService";
import ProjectSelector from "../components/ProjectSelector";
import Column from "../components/Column";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor
} from "@dnd-kit/core";

export default function KanbanBoard() {
  const [projectId, setProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    if (projectId) {
      getStatuses(projectId).then(setStatuses);
      getTasksByProject(projectId).then(setTasks);
    }
  }, [projectId]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = parseInt(active.id);
    const newStatusId = parseInt(over.id);

    await moveTask(taskId, newStatusId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, statusId: newStatusId } : t
      )
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Kanban Board</h2>

      <ProjectSelector onSelect={setProjectId} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 mt-6 overflow-x-auto">
          {statuses.map((status) => (
            <Column key={status.id} status={status} tasks={tasks} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}