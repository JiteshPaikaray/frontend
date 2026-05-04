import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpenText,
  Bug,
  CalendarClock,
  CheckSquare,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  formatBoardDate,
  getInitials,
  getIssueType,
  getPriorityLevel,
  getTaskKey,
  isTaskOverdue,
} from "../utils/kanban";

function getIssueTypeVisual(task) {
  const issueType = getIssueType(task);

  switch (issueType) {
    case "bug":
      return {
        icon: Bug,
        label: "Bug",
        iconClasses: "bg-red-100 text-red-700",
      };
    case "story":
      return {
        icon: BookOpenText,
        label: "Story",
        iconClasses: "bg-green-100 text-green-700",
      };
    case "spike":
      return {
        icon: Sparkles,
        label: "Spike",
        iconClasses: "bg-purple-100 text-purple-700",
      };
    default:
      return {
        icon: CheckSquare,
        label: "Task",
        iconClasses: "bg-yellow-100 text-yellow-700",
      };
  }
}

function getPriorityVisual(priority) {
  const level = getPriorityLevel(priority);

  if (level >= 3) {
    return {
      icon: ArrowUp,
      label: priority || "High",
      classes: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  if (level === 2) {
    return {
      icon: ArrowRight,
      label: priority || "Medium",
      classes: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  return {
    icon: ArrowDown,
    label: priority || "Low",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
}

function TaskCardShell({
  task,
  projectKey,
  cardRef,
  style,
  listeners,
  attributes,
  isDragging,
  isOverlay,
  onOpen,
}) {
  const issueType = getIssueTypeVisual(task);
  const priority = getPriorityVisual(task.priority);
  const overdue = isTaskOverdue(task);
  const assigneeInitials = getInitials(task.assignedUserName);
  const IssueIcon = issueType.icon;
  const PriorityIcon = priority.icon;

  return (
    <article
      ref={cardRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition ${
        isOverlay
          ? "w-[296px] rotate-1 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]"
          : isDragging
            ? "cursor-grabbing opacity-40"
            : "cursor-grab hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-xl ${issueType.iconClasses}`}
          >
            <IssueIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {issueType.label}
            </p>
            <p className="text-xs font-semibold text-slate-500">{getTaskKey(task, projectKey)}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${priority.classes}`}
        >
          <PriorityIcon className="h-3.5 w-3.5" />
          {priority.label}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold leading-6 text-slate-900">{task.title || "Untitled issue"}</h3>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              overdue
                ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {formatBoardDate(task.dueDate)}
            {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Assignee</p>
          <p className="truncate text-sm font-medium text-slate-700">
            {task.assignedUserName || "Unassigned"}
          </p>
        </div>

        {task.assignedUserName ? (
          <span
            title={task.assignedUserName}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
          >
            {assigneeInitials}
          </span>
        ) : (
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <UserRound className="h-4 w-4" />
          </span>
        )}
      </div>
    </article>
  );
}

export default function TaskCard({ task, projectKey, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : "transform 180ms ease, box-shadow 180ms ease",
  };

  return (
    <TaskCardShell
      task={task}
      projectKey={projectKey}
      cardRef={setNodeRef}
      style={style}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
      isOverlay={false}
      onOpen={onOpen}
    />
  );
}

export function TaskCardOverlay({ task, projectKey }) {
  return (
    <TaskCardShell
      task={task}
      projectKey={projectKey}
      style={undefined}
      listeners={undefined}
      attributes={undefined}
      isDragging={false}
      isOverlay
      onOpen={undefined}
    />
  );
}
