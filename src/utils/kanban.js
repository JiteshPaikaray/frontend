const STATUS_THEMES = {
  todo: {
    accent: "bg-slate-500",
    badge: "bg-slate-200 text-slate-700",
    soft: "bg-slate-200/70",
    dot: "bg-slate-500",
  },
  progress: {
    accent: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    soft: "bg-blue-100",
    dot: "bg-blue-500",
  },
  review: {
    accent: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    soft: "bg-violet-100",
    dot: "bg-violet-500",
  },
  done: {
    accent: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    soft: "bg-emerald-100",
    dot: "bg-emerald-500",
  },
  default: {
    accent: "bg-slate-400",
    badge: "bg-slate-200 text-slate-700",
    soft: "bg-slate-200/70",
    dot: "bg-slate-400",
  },
};

export function getProjectKey(project) {
  if (project?.key) {
    return String(project.key).toUpperCase();
  }

  const source = String(project?.code || project?.name || "PROJ");
  const tokens = source.match(/[A-Za-z0-9]+/g) ?? ["PROJ"];

  if (tokens.length === 1) {
    return tokens[0].slice(0, 4).toUpperCase();
  }

  return tokens
    .slice(0, 4)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export function getTaskKey(task, projectKey = "PROJ") {
  return task?.issueKey || task?.key || `${projectKey}-${task?.id ?? "NEW"}`;
}

export function getPriorityLevel(priority = "") {
  switch (String(priority).toLowerCase()) {
    case "highest":
    case "high":
    case "critical":
      return 3;
    case "medium":
      return 2;
    case "low":
    case "lowest":
      return 1;
    default:
      return 1;
  }
}

export function getIssueType(task = {}) {
  const haystack = `${task.type || ""} ${task.title || ""} ${task.description || ""}`.toLowerCase();

  if (haystack.includes("bug") || haystack.includes("fix") || haystack.includes("error")) {
    return "bug";
  }

  if (haystack.includes("story") || haystack.includes("feature")) {
    return "story";
  }

  if (haystack.includes("spike") || haystack.includes("research") || haystack.includes("discovery")) {
    return "spike";
  }

  return "task";
}

export function getStatusTone(statusName = "") {
  const normalized = statusName.toLowerCase();

  if (normalized.includes("todo") || normalized.includes("backlog")) {
    return STATUS_THEMES.todo;
  }

  if (normalized.includes("progress") || normalized.includes("doing") || normalized.includes("active")) {
    return STATUS_THEMES.progress;
  }

  if (
    normalized.includes("review") ||
    normalized.includes("qa") ||
    normalized.includes("test") ||
    normalized.includes("verify")
  ) {
    return STATUS_THEMES.review;
  }

  if (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("resolved")
  ) {
    return STATUS_THEMES.done;
  }

  return STATUS_THEMES.default;
}

export function getInitials(name = "") {
  const tokens = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) {
    return "NA";
  }

  return tokens.map((token) => token[0].toUpperCase()).join("");
}

export function formatBoardDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isTaskOverdue(task = {}) {
  if (!task?.dueDate) {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate < new Date();
}
