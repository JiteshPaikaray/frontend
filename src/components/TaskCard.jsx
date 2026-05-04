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
        iconClasses: "bg-[#f3dddd] text-[#bc7e80]",
      };
    case "story":
      return {
        icon: BookOpenText,
        label: "Story",
        iconClasses: "bg-[#deece7] text-[#71998f]",
      };
    case "spike":
      return {
        icon: Sparkles,
        label: "Spike",
        iconClasses: "bg-[#e8e2f1] text-[#8b7ca2]",
      };
    default:
      return {
        icon: CheckSquare,
        label: "Task",
        iconClasses: "bg-[#eee5d2] text-[#b18648]",
      };
  }
}

function getPriorityVisual(priority) {
  const level = getPriorityLevel(priority);

  if (level >= 3) {
    return {
      icon: ArrowUp,
      label: priority || "High",
      classes: "bg-[#f9edeb] text-[#b87678] ring-[#f0d5d5]",
    };
  }

  if (level === 2) {
    return {
      icon: ArrowRight,
      label: priority || "Medium",
      classes: "bg-[#f6efe4] text-[#b18648] ring-[#efe0c7]",
    };
  }

  return {
    icon: ArrowDown,
    label: priority || "Low",
    classes: "bg-[#edf5f1] text-[#6e998d] ring-[#d9ebe4]",
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
      className={`rounded-[26px] border border-[#e5e1e6] bg-white/92 p-4 text-left shadow-[0_16px_36px_-30px_rgba(82,82,91,0.45)] transition ${
        isOverlay
          ? "w-[286px] -rotate-1 shadow-[0_28px_60px_-32px_rgba(82,82,91,0.55)]"
          : isDragging
            ? "cursor-grabbing opacity-40"
            : "cursor-grab hover:-translate-y-0.5 hover:border-[#d8d4db] hover:shadow-[0_18px_40px_-28px_rgba(82,82,91,0.5)] active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b8b4bd]">
            {issueType.label} / {getTaskKey(task, projectKey)}
          </p>
          <h3 className="mt-2 text-[15px] font-medium leading-6 text-[#756f7b]">
            {task.title || "Untitled issue"}
          </h3>
        </div>

        <span
          className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${issueType.iconClasses}`}
        >
          <IssueIcon className="h-4 w-4" />
        </span>
      </div>

      {task.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#aaa6b0]">{task.description}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${priority.classes}`}
        >
          <PriorityIcon className="h-3.5 w-3.5" />
          {priority.label}
        </span>

        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              overdue
                ? "bg-[#f9edeb] text-[#b87678] ring-1 ring-[#f0d5d5]"
                : "bg-[#f3f2ef] text-[#9b97a2] ring-1 ring-[#e5e1e6]"
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {formatBoardDate(task.dueDate)}
            {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>

      <div className="mt-4 rounded-[20px] bg-[#f4f3f0] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c2bec6]">
              Assignee
            </p>
            <p className="truncate text-sm font-medium text-[#8f8a98]">
              {task.assignedUserName || "Unassigned"}
            </p>
          </div>

          {task.assignedUserName ? (
            <span
              title={task.assignedUserName}
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#d0cfd5] text-xs font-semibold text-white"
            >
              {assigneeInitials}
            </span>
          ) : (
            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#bcb8c1]">
              <UserRound className="h-4 w-4" />
            </span>
          )}
        </div>
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
