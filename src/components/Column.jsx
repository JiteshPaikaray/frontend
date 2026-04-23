import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import { getStatusTone } from "../utils/kanban";

export default function Column({ status, tasks, projectKey, isFiltered = false }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status.id}`,
  });

  const columnTasks = tasks.filter((task) => task.statusId === status.id);
  const tone = getStatusTone(status.name);

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[620px] w-[320px] flex-shrink-0 flex-col rounded-[26px] border bg-slate-100/95 transition-all duration-200 ${
        isOver
          ? "border-blue-400 shadow-[0_16px_40px_-20px_rgba(37,99,235,0.45)] ring-4 ring-blue-100"
          : "border-slate-200 shadow-sm"
      }`}
    >
      <div className="rounded-t-[26px] border-b border-slate-200 bg-slate-100/95 backdrop-blur">
        <div className={`h-1.5 rounded-t-[26px] ${tone.accent}`} />
        <div className="px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">{status.name}</h3>
            </div>

            <span
              className={`inline-flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
            >
              {columnTasks.length}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>{columnTasks.length === 1 ? "1 issue" : `${columnTasks.length} issues`}</span>
            <span>{isOver ? "Drop to move" : "Drag issues here"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {columnTasks.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tone.soft}`}
            >
              <div className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {isFiltered ? "No matching issues" : "Nothing in this lane"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isFiltered
                ? "Try clearing search or filters to reveal more work."
                : "Drop an issue here to update its status."}
            </p>
          </div>
        ) : (
          columnTasks.map((task) => <TaskCard key={task.id} task={task} projectKey={projectKey} />)
        )}
      </div>
    </section>
  );
}
