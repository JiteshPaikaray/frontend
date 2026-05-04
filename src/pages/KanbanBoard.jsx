import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Column from "../components/Column";
import { TaskCardOverlay } from "../components/TaskCard";
import { moveTask, getTasksByProject } from "../services/taskService";
import { getStatuses } from "../services/statusService";
import {
  getPriorityLevel,
  getProjectKey,
  getTaskKey,
  isTaskOverdue,
} from "../utils/kanban";

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
    <div className="rounded-[28px] border border-[#ddd9e2] bg-[#efecee] p-4">
      <div className="flex gap-4 overflow-hidden">
        {[...Array(3)].map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="min-w-[300px] flex-1 rounded-[26px] border border-[#e1dee3] bg-white/80 p-4"
          >
            <div className="mb-4 h-10 rounded-2xl bg-[#ece9ef]" />
            <div className="space-y-3">
              {[...Array(3)].map((__, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-40 rounded-[24px] border border-[#ece8ed] bg-[#f8f7f5]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardStatPill({ icon, label, value, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-[#efeeeb] text-[#8f8a98]",
    mint: "bg-[#e9f3ef] text-[#789b8f]",
    warm: "bg-[#f5efe4] text-[#b1874a]",
    rose: "bg-[#f9edeb] text-[#ba787a]",
  };
  const Icon = icon;

  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 ${toneClasses[tone]}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  projectId,
  selectedProject,
  refreshToken = 0,
  onTaskOpen,
  onCreateTask,
  onTaskMoved,
  workspaceQuery = "",
}) {
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
  }, [projectId, refreshToken]);

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
      await onTaskMoved?.();
    } catch {
      setTasks(previousTasks);
      setMoveError("The issue moved visually, but the save failed. Please try again.");
    }
  }

  const projectKey = getProjectKey(selectedProject);
  const internalQuery = searchQuery.trim().toLowerCase();
  const externalQuery = workspaceQuery.trim().toLowerCase();
  const activeQueries = [externalQuery, internalQuery].filter(Boolean);
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
    const haystack = [
      task.title,
      task.description,
      task.assignedUserName,
      task.priority,
      getTaskKey(task, projectKey),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      activeQueries.length === 0 || activeQueries.every((token) => haystack.includes(token));

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
  const hasActiveFilters = activeQueries.length > 0 || activeFilter !== "all";
  const selectedFilter = filterOptions.find((option) => option.id === activeFilter) ?? filterOptions[0];

  return (
    <section className="rounded-[30px] border border-[#dfdce2] bg-[#f1efed] p-4 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
      <div className="rounded-[28px] border border-[#e3e0e5] bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b8b4bd]">
              Live Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#6f6a75]">
              {selectedProject?.name || "Workflow board"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a9a5af]">
              Search, filter, and drag tasks across workflow lanes without leaving the reporting
              workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreateTask}
              disabled={!projectId}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#cfcfd5] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c5c5cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Create task
            </button>
            <button
              type="button"
              onClick={handleRefreshBoard}
              disabled={!projectId || isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#e1dee3] bg-white px-4 py-2.5 text-sm font-medium text-[#8f8a98] transition hover:bg-[#f7f6f4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
            <label className="relative w-full xl:max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c0bcc4]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by summary, assignee, priority, or issue key"
                className="w-full rounded-2xl border border-[#e1dee3] bg-[#fbfaf8] py-3 pl-11 pr-4 text-sm text-[#8f8a98] outline-none transition placeholder:text-[#c0bcc4] focus:border-[#d0ced4] focus:ring-4 focus:ring-[#ece9ef]"
              />
            </label>

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
                        ? "bg-[#d0d0d6] text-white"
                        : "bg-[#f3f2f0] text-[#aba7b1] hover:bg-[#ece9ef]"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs ${
                        isActive ? "bg-white/20 text-white" : "bg-white text-[#b0acb5]"
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <BoardStatPill label="Visible" value={visibleTaskCount} icon={LayoutGrid} tone="neutral" />
            <BoardStatPill
              label="Done"
              value={`${completionRate}%`}
              icon={CheckCircle2}
              tone="mint"
            />
            <BoardStatPill label="Assigned" value={assignedCount} icon={UserCheck2} tone="warm" />
            <BoardStatPill label="At Risk" value={overdueCount} icon={AlertTriangle} tone="rose" />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 rounded-2xl bg-[#f4f3f0] px-4 py-3 text-sm text-[#a4a0aa]">
            Showing {visibleTaskCount} issue{visibleTaskCount === 1 ? "" : "s"} filtered by{" "}
            {selectedFilter.label.toLowerCase()}
            {externalQuery ? ` and workspace search "${workspaceQuery.trim()}"` : ""}
            {internalQuery ? ` and board search "${searchQuery.trim()}"` : ""}.
          </div>
        )}

        {moveError && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#edd4d5] bg-[#fbefed] px-4 py-3 text-sm text-[#b96f71]">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{moveError}</span>
          </div>
        )}

        <div className="mt-5">
          {!projectId ? (
            <section className="rounded-[28px] border border-dashed border-[#dbd8de] bg-[#faf9f7] px-6 py-16 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#ece9ef] text-[#938e9a]">
                  <LayoutGrid className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#6f6a75]">
                  Pick a project to open the board
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aaa6b0]">
                  Once a project is selected, we&apos;ll load its statuses and render the tasks in a
                  drag-and-drop board layout.
                </p>
              </div>
            </section>
          ) : isLoading ? (
            <LoadingBoardSkeleton />
          ) : loadError ? (
            <section className="rounded-[28px] border border-[#edd4d5] bg-[#faf9f7] px-6 py-16 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#fbefed] text-[#b96f71]">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#6f6a75]">
                  Board unavailable
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aaa6b0]">{loadError}</p>
                <button
                  type="button"
                  onClick={handleRefreshBoard}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#cfcfd5] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c5c5cc]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry loading board
                </button>
              </div>
            </section>
          ) : statuses.length === 0 ? (
            <section className="rounded-[28px] border border-[#ddd9e2] bg-[#faf9f7] px-6 py-16 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#ece9ef] text-[#938e9a]">
                  <Loader2 className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#6f6a75]">
                  No statuses are configured yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#aaa6b0]">
                  This project doesn&apos;t have any workflow lanes yet, so there&apos;s nowhere to place
                  work items.
                </p>
              </div>
            </section>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <section className="rounded-[28px] border border-[#ddd9e2] bg-[#edeaee] p-4">
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[24px] bg-white/70 px-4 py-3 text-sm text-[#a4a0aa]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f2f0] px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-[#b2a17e]" />
                    {statuses.length} lane{statuses.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f2f0] px-3 py-1.5">
                    <UserCheck2 className="h-4 w-4 text-[#8da59a]" />
                    {assignedCount} assigned
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f2f0] px-3 py-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#8da59a]" />
                    {doneCount} completed
                  </span>
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
                        onTaskOpen={onTaskOpen}
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
    </section>
  );
}
