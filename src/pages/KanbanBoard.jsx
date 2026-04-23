import { createElement, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck2,
} from "lucide-react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import ProjectSelector from "../components/ProjectSelector";
import Column from "../components/Column";
import { TaskCardOverlay } from "../components/TaskCard";
import { getTasksByProject, moveTask } from "../services/taskService";
import { getStatuses } from "../services/statusService";
import { getProjectKey, getTaskKey, getPriorityLevel, isTaskOverdue } from "../utils/kanban";

const BOARD_TABS = ["Summary", "List", "Board", "Calendar", "Timeline"];

const FILTER_LABELS = {
  all: "All issues",
  high: "High priority",
  assigned: "Assigned",
  overdue: "Overdue",
};

function isDoneLikeStatus(statusName = "") {
  const normalized = statusName.toLowerCase();
  return (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("resolved")
  );
}

function LoadingBoardSkeleton() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#f7f8fc] p-4 shadow-sm">
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="min-w-[320px] flex-1 rounded-3xl border border-slate-200 bg-slate-100 p-4"
          >
            <div className="mb-4 h-10 rounded-2xl bg-slate-200/80" />
            <div className="space-y-3">
              {[...Array(3)].map((__, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-36 rounded-2xl border border-slate-200 bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone = "blue", helper }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}
        >
          {createElement(icon, { className: "h-5 w-5" })}
        </span>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [projectId, setProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [moveError, setMoveError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  useEffect(() => {
    let ignore = false;

    if (!projectId) {
      setStatuses([]);
      setTasks([]);
      setLoadError("");
      setIsLoading(false);
      return undefined;
    }

    async function loadBoardData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [statusData, taskData] = await Promise.all([
          getStatuses(projectId),
          getTasksByProject(projectId),
        ]);

        if (!ignore) {
          setStatuses(Array.isArray(statusData) ? statusData : []);
          setTasks(Array.isArray(taskData) ? taskData : []);
        }
      } catch {
        if (!ignore) {
          setLoadError("We couldn't load this board right now. Please try again.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadBoardData();

    return () => {
      ignore = true;
    };
  }, [projectId]);

  async function handleRefreshBoard() {
    if (!projectId) {
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const [statusData, taskData] = await Promise.all([
        getStatuses(projectId),
        getTasksByProject(projectId),
      ]);

      setStatuses(Array.isArray(statusData) ? statusData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setMoveError("");
    } catch {
      setLoadError("We couldn't refresh the board. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleProjectSelect(nextProjectId, project) {
    setProjectId(nextProjectId);
    setSelectedProject(project);
    setSearchQuery("");
    setActiveFilter("all");
    setLoadError("");
    setMoveError("");
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
    setMoveError("");
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const taskId = Number(active.id);
    const overId = String(over.id);

    if (!overId.startsWith("status-")) {
      return;
    }

    const nextStatusId = Number(overId.replace("status-", ""));
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.statusId === nextStatusId) {
      return;
    }

    const previousTasks = tasks;
    const nextTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, statusId: nextStatusId } : item
    );

    setTasks(nextTasks);

    try {
      await moveTask(taskId, nextStatusId);
    } catch {
      setTasks(previousTasks);
      setMoveError("The issue moved visually, but the save failed. Please try again.");
    }
  }

  const projectKey = getProjectKey(selectedProject);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const doneStatusIds = new Set(
    statuses.filter((status) => isDoneLikeStatus(status.name)).map((status) => status.id)
  );

  const filterOptions = [
    { id: "all", label: FILTER_LABELS.all, count: tasks.length },
    {
      id: "high",
      label: FILTER_LABELS.high,
      count: tasks.filter((task) => getPriorityLevel(task.priority) >= 3).length,
    },
    {
      id: "assigned",
      label: FILTER_LABELS.assigned,
      count: tasks.filter((task) => Boolean(task.assignedUserName)).length,
    },
    {
      id: "overdue",
      label: FILTER_LABELS.overdue,
      count: tasks.filter((task) => isTaskOverdue(task) && !doneStatusIds.has(task.statusId)).length,
    },
  ];

  const visibleTasks = tasks.filter((task) => {
    const matchesQuery =
      !normalizedQuery ||
      [task.title, task.description, task.assignedUserName, task.priority, getTaskKey(task, projectKey)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "high" && getPriorityLevel(task.priority) >= 3) ||
      (activeFilter === "assigned" && Boolean(task.assignedUserName)) ||
      (activeFilter === "overdue" && isTaskOverdue(task) && !doneStatusIds.has(task.statusId));

    return matchesQuery && matchesFilter;
  });

  const activeTask = tasks.find((task) => task.id === Number(activeId));
  const totalTasks = tasks.length;
  const visibleTaskCount = visibleTasks.length;
  const doneCount = tasks.filter((task) => doneStatusIds.has(task.statusId)).length;
  const overdueCount = tasks.filter(
    (task) => isTaskOverdue(task) && !doneStatusIds.has(task.statusId)
  ).length;
  const assignedCount = tasks.filter((task) => Boolean(task.assignedUserName)).length;
  const completionRate = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;
  const hasActiveFilters = normalizedQuery.length > 0 || activeFilter !== "all";
  const boardTitle = selectedProject?.name ? `${selectedProject.name} board` : "JIRA-style board";
  const selectedFilter = filterOptions.find((option) => option.id === activeFilter) ?? filterOptions[0];

  return (
    <div className="min-h-full bg-[#f7f8fc] text-slate-900">
      <section className="border-b border-slate-200 bg-white/90 px-6 py-6 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Projects</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{selectedProject?.name ?? "Select a project"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-700">Board</span>
        </div>

        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-200/60">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{boardTitle}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                A denser delivery board with searchable issues, status lanes, and the same at-a-glance
                workflow feel teams expect from JIRA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshBoard}
              disabled={!projectId || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
              Kanban view
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {BOARD_TABS.map((tab) => {
            const isActive = tab === "Board";

            return (
              <button
                key={tab}
                type="button"
                disabled={!isActive}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-100 text-slate-500"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-6 px-6 py-6">
        <section className="grid gap-4 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Board controls
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row">
                <ProjectSelector value={projectId} onSelect={handleProjectSelect} />

                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by summary, assignee, priority, or issue key"
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                  const isActive = activeFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-700">
                  {projectId ? `${visibleTaskCount} visible issue${visibleTaskCount === 1 ? "" : "s"}` : "Choose a project to begin"}
                </span>
                {hasActiveFilters && (
                  <span>
                    Filtered by {selectedFilter.label.toLowerCase()}
                    {normalizedQuery ? ` and "${searchQuery.trim()}"` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <MetricCard
            icon={LayoutGrid}
            label="Visible"
            value={projectId ? visibleTaskCount : 0}
            helper={hasActiveFilters ? `${totalTasks} total on board` : "Board-wide issue count"}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Done"
            tone="emerald"
            value={projectId ? `${completionRate}%` : "0%"}
            helper={`${doneCount} completed issue${doneCount === 1 ? "" : "s"}`}
          />
          <MetricCard
            icon={AlertTriangle}
            label="At Risk"
            tone={overdueCount > 0 ? "amber" : "violet"}
            value={projectId ? overdueCount : 0}
            helper={
              overdueCount > 0
                ? "Overdue work still in progress"
                : `${assignedCount} issue${assignedCount === 1 ? "" : "s"} assigned`
            }
          />
        </section>

        {moveError && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{moveError}</span>
          </div>
        )}

        {!projectId ? (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <LayoutGrid className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                Pick a project to open the board
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once a project is selected, we'll load its statuses and render the issues in a
                JIRA-style board layout with drag-and-drop status updates.
              </p>
              <div className="mt-6 w-full max-w-sm">
                <ProjectSelector value={projectId} onSelect={handleProjectSelect} />
              </div>
            </div>
          </section>
        ) : isLoading ? (
          <LoadingBoardSkeleton />
        ) : loadError ? (
          <section className="rounded-[28px] border border-red-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Board unavailable</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
              <button
                type="button"
                onClick={handleRefreshBoard}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Retry loading board
              </button>
            </div>
          </section>
        ) : statuses.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Loader2 className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                No statuses are configured yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This project doesn&apos;t have any board lanes, so there&apos;s nowhere to place work
                items yet.
              </p>
            </div>
          </section>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <section className="rounded-[28px] border border-slate-200 bg-[#f7f8fc] p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedProject?.name ?? "Selected project"} workflow
                  </p>
                  <p className="text-sm text-slate-500">
                    Drag issues between columns to update their status. Search and board filters stay
                    applied while you work.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <LayoutGrid className="h-4 w-4 text-slate-500" />
                    {statuses.length} lane{statuses.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <UserCheck2 className="h-4 w-4 text-slate-500" />
                    {assignedCount} assigned
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {statuses.map((status) => (
                    <Column
                      key={status.id}
                      status={status}
                      tasks={visibleTasks}
                      projectKey={projectKey}
                      isFiltered={hasActiveFilters}
                    />
                  ))}
                </div>
              </div>
            </section>

            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} projectKey={projectKey} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
