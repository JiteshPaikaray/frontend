import { useEffect, useState } from "react";
import { getTasksByProject, moveTask } from "../services/taskService";
import { getStatuses } from "../services/statusService";
import ProjectSelector from "../components/ProjectSelector";
import Column from "../components/Column";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from "@dnd-kit/core";

export default function KanbanBoard() {
  const [projectId, setProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      Promise.all([
        getStatuses(projectId),
        getTasksByProject(projectId),
      ]).then(([statusData, taskData]) => {
        setStatuses(statusData);
        setTasks(taskData);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [projectId]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // const handleDragEnd = async (event) => {
  //   const { active, over } = event;
  //   setActiveId(null);

  //   if (!over) return;

  //   const taskId = parseInt(active.id);
  //   const newStatusId = parseInt(over.id);

  //   const task = tasks.find(t => t.id === taskId);
  //   if (task?.statusId === newStatusId) return;

  //   await moveTask(taskId, newStatusId);

  //   setTasks((prev) =>
  //     prev.map((t) =>
  //       t.id === taskId ? { ...t, statusId: newStatusId } : t
  //     )
  //   );
  // };
const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    // If dropped outside any droppable area
    if (!over) return;

    const taskId = parseInt(active.id);
    let newStatusId;

    // 1. Check if the drop target is a Column (Status)
    const isOverColumn = statuses.some(status => status.id === parseInt(over.id));

    if (isOverColumn) {
      // User dropped it on the empty space of a column
      newStatusId = parseInt(over.id);
    } else {
      // 2. User dropped it on top of another Task
      // Find the task they dropped it over to figure out what column it belongs to
      const overTask = tasks.find(t => t.id === parseInt(over.id));
      
      if (overTask) {
        newStatusId = overTask.statusId;
      } else {
        // Unknown drop target, abort
        return; 
      }
    }

    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    
    // If it's already in the correct column, do nothing
    if (task?.statusId === newStatusId) return;

    // Optimistic UI Update (Update state before API call for a snappy feel)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, statusId: newStatusId } : t
      )
    );

    // Make the API call in the background
    try {
      await moveTask(taskId, newStatusId);
    } catch (error) {
      console.error("Failed to move task:", error);
      // Optional: Revert state here if API fails
    }
  };
  const activeTask = tasks.find(t => t.id === parseInt(activeId));
  const totalTasks = tasks.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and organize your tasks</p>
          </div>
          {totalTasks > 0 && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm font-medium">{totalTasks} Total Tasks</p>
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <span className="text-gray-700 text-sm font-medium">Project:</span>
          <ProjectSelector onSelect={setProjectId} />
        </div>
      </div>

      {/* Content */}
      {isLoading && projectId ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading board...</p>
        </div>
      ) : !projectId ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Project</h3>
          <p className="text-gray-500 text-center max-w-md">
            Choose a project from the dropdown above to view and manage tasks
          </p>
        </div>
      ) : statuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Statuses Found</h3>
          <p className="text-gray-500">This project doesn't have any statuses configured</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors} 
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => (
              <Column key={status.id} status={status} tasks={tasks} />
            ))}
          </div>

          {/* Inside your DndContext */}
          <DragOverlay>
            {activeTask ? (
              <div className="cursor-grabbing" style={{ transform: 'rotate(3deg)' }}>
                {/* Assuming you have a TaskCard component, render it here! */}
                <TaskCard task={activeTask} isOverlay={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}