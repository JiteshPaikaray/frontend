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
import { Zap, Settings, Plus } from "lucide-react";

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = parseInt(active.id);
    const newStatusId = parseInt(over.id);

    // Check if task actually moved to a different status
    const task = tasks.find(t => t.id === taskId);
    if (task?.statusId === newStatusId) return;

    await moveTask(taskId, newStatusId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, statusId: newStatusId } : t
      )
    );
  };

  const activeTask = tasks.find(t => t.id === parseInt(activeId));

  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage your project tasks efficiently</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {projectId && totalTasks > 0 && (
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">
                    <span className="font-bold text-lg">{totalTasks}</span> Tasks
                  </p>
                </div>
              )}
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Project Selector */}
          <div className="mt-6 flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Select Project:</label>
            <ProjectSelector onSelect={setProjectId} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Project Selected</h3>
            <p className="text-gray-500 text-center max-w-md">
              Please select a project from the dropdown above to view and manage your tasks.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your board...</p>
          </div>
        ) : statuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6m0 0H0m0 0v6m0 0v6" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Statuses Found</h3>
            <p className="text-gray-500 text-center max-w-md">
              This project doesn't have any statuses configured yet.
            </p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div className="flex gap-6 overflow-x-auto pb-4">
              {statuses.map((status) => (
                <Column key={status.id} status={status} tasks={tasks} />
              ))}

              {/* Add New Column Button */}
              <div className="flex-shrink-0 flex items-center">
                <button className="w-80 h-32 border-2 border-dashed border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2 group">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-gray-600 font-medium group-hover:text-gray-900">Add Column</span>
                </button>
              </div>
            </div>

            {/* Drag Overlay - Shows dragged item attached to cursor */}
            <DragOverlay>
              {activeTask ? (
                <div className="bg-white rounded-xl shadow-2xl p-4 border-2 border-blue-500 w-80 cursor-grabbing">
                  <div className="font-semibold text-gray-900 mb-2">{activeTask.title}</div>
                  {activeTask.description && (
                    <div className="text-sm text-gray-600 mb-2 line-clamp-1">{activeTask.description}</div>
                  )}
                  <div className="text-xs text-gray-500">Dragging...</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}