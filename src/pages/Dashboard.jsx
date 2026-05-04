import { createElement, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Layers3,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Users,
  UserCircle2,
} from "lucide-react";
import { getApiErrorMessage } from "../api/axios";
import NotificationBell from "../components/NotificationBell";
import ProfilePanel from "../components/ProfilePanel";
import ProjectDialog from "../components/ProjectDialog";
import ProjectSelector from "../components/ProjectSelector";
import TaskComposerDialog from "../components/TaskComposerDialog";
import TaskDetailsDrawer from "../components/TaskDetailsDrawer";
import {
  changePassword,
  getProfile,
  getTenantUsers,
  updateProfile,
} from "../services/authService";
import {
  getDashboardOverdue,
  getDashboardStatusBreakdown,
  getDashboardSummary,
  getDashboardUserBreakdown,
} from "../services/dashboardService";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationService";
import {
  createProject,
  deleteProject,
  getProjectDetails,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject,
} from "../services/projectService";
import signalRService from "../services/signalr";
import { createTask, getTasksByProject } from "../services/taskService";
import {
  clearAuthSession,
  getStoredSelectedProjectId,
  getStoredUserId,
  setStoredSelectedProjectId,
} from "../utils/auth";
import { formatShortDate, getInitials } from "../utils/formatters";
import KanbanBoard from "./KanbanBoard";

function buildSeries(source = [], minimumLength = 7) {
  const values = source
    .map((value) => Number(value) || 0)
    .filter((value) => value >= 0);

  if (values.length === 0) {
    return Array.from({ length: minimumLength }, (_, index) => (index % 3 === 0 ? 3 : 2));
  }

  const padded = [...values];

  while (padded.length < minimumLength) {
    const previous = padded[padded.length - 1] || 1;
    const nextValue = Math.max(1, previous - (padded.length % 2 === 0 ? 0 : 1));
    padded.push(nextValue);
  }

  return padded.slice(0, minimumLength);
}

function addDays(baseDate, amount) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + amount);
  return date;
}

function WorkspaceMetric({ icon, label, value, helper, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-[#d7d6dc] text-[#6c6874]",
    warm: "bg-[#eedfc7] text-[#b48543]",
    mint: "bg-[#d8ece7] text-[#6b9a8f]",
    sky: "bg-[#d9e5f3] text-[#7c97b9]",
    rose: "bg-[#efd6d6] text-[#bf7d7d]",
    violet: "bg-[#e3ddf0] text-[#87789f]",
  };

  return (
    <div className="rounded-[28px] border border-[#e2dfe4] bg-white/70 px-5 py-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b0adb5]">
            {label}
          </p>
          <p className="mt-3 text-[31px] font-semibold tracking-[-0.03em] text-[#6a6671]">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#b2afb7]">{helper}</p>
        </div>
        <span
          className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}
        >
          {createElement(icon, { className: "h-5 w-5" })}
        </span>
      </div>
    </div>
  );
}

function InsightBadge({ label }) {
  return (
    <span className="inline-flex rounded-full bg-[#d0d0d6] px-3 py-1 text-[11px] font-semibold text-white">
      {label}
    </span>
  );
}

function InsightCard({ eyebrow, title, preview, footer, badges = [] }) {
  return (
    <article className="rounded-[28px] border border-[#e1dee3] bg-white/85 p-4 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bebac2]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-medium leading-7 text-[#8a8693]">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <InsightBadge key={badge} label={badge} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[22px] bg-[#f4f3f0] px-3 py-3">{preview}</div>
      <p className="mt-3 text-sm leading-6 text-[#c0bcc4]">{footer}</p>
    </article>
  );
}

function ScheduledReportsPanel({ reports = [], loading = false }) {
  return (
    <section className="rounded-[28px] border border-[#e2dfe4] bg-white/78 px-5 py-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b8b4bd]">
            Scheduled Reports
          </p>
          <p className="mt-2 text-sm leading-6 text-[#b2afb7]">
            Weekly delivery snapshots and stakeholder-ready summaries.
          </p>
        </div>
        {loading && <Loader2 className="mt-1 h-4 w-4 animate-spin text-[#bbb7bf]" />}
      </div>

      <div className="mt-4 space-y-4">
        {reports.map((report) => (
          <div key={report.name} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#8f8a98]">{report.name}</p>
              <p className="mt-1 text-xs text-[#c0bcc4]">
                Next run: {formatShortDate(report.nextRun, "Soon")}
              </p>
            </div>
            <button
              type="button"
              onClick={report.onEdit}
              className="rounded-xl bg-[#cfcfd5] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#c5c5cc]"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniLinePreview({ values = [], compareValues = [] }) {
  const primary = buildSeries(values, 7);
  const secondary = buildSeries(
    compareValues.length
      ? compareValues
      : primary.map((value, index) => Math.max(value - (index % 2 === 0 ? 1 : 0), 1)),
    7
  );

  const width = 260;
  const height = 90;
  const padding = 8;
  const highestValue = Math.max(...primary, ...secondary, 1);

  function toPoints(series) {
    return series
      .map((value, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
        const y = height - padding - (value / highestValue) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  const guideLines = [20, 46, 72];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
      {guideLines.map((line) => (
        <line
          key={line}
          x1={0}
          x2={width}
          y1={line}
          y2={line}
          stroke="#d9d6dd"
          strokeDasharray="3 6"
          strokeWidth="1"
        />
      ))}
      <polyline
        fill="none"
        stroke="#e8cb78"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={toPoints(primary)}
      />
      <polyline
        fill="none"
        stroke="#b3b1b8"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={toPoints(secondary)}
      />
      <line x1={0} x2={width} y1={height - 4} y2={height - 4} stroke="#bbb7be" strokeWidth="2.5" />
    </svg>
  );
}

function MiniBarsPreview({ items = [] }) {
  const visibleItems = items.length
    ? items
    : [
        { label: "Alex", value: 4 },
        { label: "Mia", value: 3 },
        { label: "Sam", value: 2 },
      ];
  const highestValue = Math.max(...visibleItems.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {visibleItems.slice(0, 4).map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#a4a0aa]">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-4 rounded-full bg-white">
            <div
              className="h-4 rounded-full bg-[#b5b4bc]"
              style={{ width: `${Math.max((item.value / highestValue) * 100, 16)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStatusPreview({ items = [] }) {
  const tones = ["bg-[#c4e6df]", "bg-[#dfd7ef]", "bg-[#f0d9d9]", "bg-[#eedfc7]"];
  const visibleItems = items.length
    ? items
    : [
        { label: "Todo", value: 4 },
        { label: "Doing", value: 3 },
        { label: "Done", value: 2 },
      ];
  const total = visibleItems.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex h-12 overflow-hidden rounded-[18px] bg-white">
        {visibleItems.slice(0, 4).map((item, index) => (
          <div
            key={item.label}
            className={tones[index % tones.length]}
            style={{ width: `${Math.max((item.value / total) * 100, 10)}%` }}
          />
        ))}
      </div>
      <div className="space-y-2">
        {visibleItems.slice(0, 4).map((item, index) => (
          <div key={item.label} className="flex items-center justify-between text-xs text-[#a4a0aa]">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${tones[index % tones.length]}`} />
              {item.label}
            </span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTablePreview({ rows = [] }) {
  const visibleRows = rows.length
    ? rows
    : [
        { key: "TASK-17", owner: "ML", due: "May 8" },
        { key: "TASK-21", owner: "AR", due: "May 10" },
        { key: "TASK-34", owner: "PT", due: "May 12" },
      ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e3e1e6] bg-white">
      <div className="grid grid-cols-[1.4fr,0.8fr,0.9fr] gap-2 border-b border-[#efedf1] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bbb7bf]">
        <span>Task</span>
        <span>Owner</span>
        <span>Due</span>
      </div>
      <div className="divide-y divide-[#f0eef2]">
        {visibleRows.slice(0, 4).map((row) => (
          <div
            key={`${row.key}-${row.owner}`}
            className="grid grid-cols-[1.4fr,0.8fr,0.9fr] gap-2 px-3 py-2.5 text-sm text-[#8e8996]"
          >
            <span className="truncate">{row.key}</span>
            <span>{row.owner}</span>
            <span>{row.due}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualizationTile({ variant = "line" }) {
  const sharedCardClass =
    "rounded-[18px] border bg-white/85 p-3 shadow-[0_12px_28px_-28px_rgba(82,82,91,0.45)]";

  if (variant === "bars") {
    return (
      <div className={sharedCardClass}>
        <div className="flex h-16 items-end gap-2">
          {[38, 52, 28, 60, 44].map((height, index) => (
            <span
              key={height}
              className={`w-full rounded-t-md ${index % 2 === 0 ? "bg-[#cfd8e8]" : "bg-[#e8dfca]"}`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "radial") {
    return (
      <div className={sharedCardClass}>
        <div className="flex h-16 items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-[conic-gradient(#f0d9d9_0_24%,#e8dfca_24%_48%,#d7ebe7_48%_75%,#d9e5f3_75%_100%)] p-3">
            <div className="h-full w-full rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "matrix") {
    return (
      <div className={sharedCardClass}>
        <div className="grid h-16 grid-cols-5 gap-1">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={index}
              className={`rounded-sm ${
                index % 4 === 0
                  ? "bg-[#f0d9d9]"
                  : index % 3 === 0
                    ? "bg-[#d9e5f3]"
                    : index % 2 === 0
                      ? "bg-[#d7ebe7]"
                      : "bg-[#eedfc7]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={sharedCardClass}>
      <svg viewBox="0 0 140 64" className="h-16 w-full">
        {[14, 30, 46].map((line) => (
          <line
            key={line}
            x1="0"
            x2="140"
            y1={line}
            y2={line}
            stroke="#e8e5ea"
            strokeDasharray="3 6"
          />
        ))}
        <polyline
          fill="none"
          stroke="#c5ddd9"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="2,52 24,42 46,48 68,18 90,35 112,12 138,27"
        />
        <polyline
          fill="none"
          stroke="#e8dfca"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="2,28 24,30 46,16 68,24 90,18 112,36 138,20"
        />
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [pageLoading, setPageLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [activeLibraryTab, setActiveLibraryTab] = useState("Pre-built");

  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [projectDetails, setProjectDetails] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState("create");
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [insightRefreshKey, setInsightRefreshKey] = useState(0);

  const navigate = useNavigate();

  function showNotice(tone, message) {
    setNotice({ tone, message });
  }

  function openCreateProjectDialog() {
    setProjectDialogMode("create");
    setIsProjectDialogOpen(true);
  }

  function openEditProjectDialog() {
    if (!selectedProject) {
      return;
    }

    setProjectDialogMode("edit");
    setIsProjectDialogOpen(true);
  }

  async function loadProfileData() {
    const data = await getProfile();
    setProfile(data);
    return data;
  }

  async function loadTenantUsers() {
    setUsersLoading(true);

    try {
      const data = await getTenantUsers();
      setUsers(Array.isArray(data) ? data : []);
      return data;
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadNotificationsData() {
    setNotificationsLoading(true);

    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      return data;
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function loadProjectsData(preferredProjectId = null) {
    setProjectsLoading(true);
    setProjectError("");

    try {
      const data = await getProjects();
      const projectList = Array.isArray(data) ? data : [];
      const rememberedProjectId = getStoredSelectedProjectId();
      const nextProjectId =
        [preferredProjectId, selectedProjectId, rememberedProjectId, projectList[0]?.id]
          .filter(Boolean)
          .find((projectId) => projectList.some((project) => project.id === projectId)) ?? null;

      setProjects(projectList);
      setSelectedProjectId(nextProjectId);
      return projectList;
    } catch (error) {
      setProjectError(getApiErrorMessage(error, "Projects could not be loaded."));
      throw error;
    } finally {
      setProjectsLoading(false);
    }
  }

  useEffect(() => {
    const nextProject = projects.find((project) => project.id === selectedProjectId) ?? null;

    setSelectedProject(nextProject);
    setStoredSelectedProjectId(nextProject?.id ?? null);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      setPageLoading(true);

      try {
        const [profileResult, usersResult, projectsResult, notificationsResult] =
          await Promise.allSettled([
            getProfile(),
            getTenantUsers(),
            getProjects(),
            getNotifications(),
          ]);

        if (ignore) {
          return;
        }

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
        } else {
          showNotice(
            "error",
            getApiErrorMessage(profileResult.reason, "Profile could not be loaded.")
          );
        }

        if (usersResult.status === "fulfilled") {
          setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
        }

        if (notificationsResult.status === "fulfilled") {
          setNotifications(Array.isArray(notificationsResult.value) ? notificationsResult.value : []);
        }

        if (projectsResult.status === "fulfilled") {
          const projectList = Array.isArray(projectsResult.value) ? projectsResult.value : [];
          const rememberedProjectId = getStoredSelectedProjectId();
          const nextProjectId =
            [rememberedProjectId, projectList[0]?.id]
              .filter(Boolean)
              .find((projectId) => projectList.some((project) => project.id === projectId)) ?? null;

          setProjects(projectList);
          setSelectedProjectId(nextProjectId);
        } else {
          setProjectError(getApiErrorMessage(projectsResult.reason, "Projects could not be loaded."));
        }
      } finally {
        if (!ignore) {
          setPageLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    if (!selectedProjectId) {
      setProjectDetails(null);
      setSummary(null);
      setStatusBreakdown([]);
      setUserBreakdown([]);
      setProjectTasks([]);
      setOverdueCount(0);
      setInsightsError("");
      setInsightsLoading(false);
      return undefined;
    }

    async function loadInsights() {
      setInsightsLoading(true);
      setInsightsError("");

      try {
        const [
          detailsData,
          projectMembers,
          summaryData,
          statusData,
          userData,
          overdueData,
          taskData,
        ] = await Promise.all([
          getProjectDetails(selectedProjectId),
          getProjectMembers(selectedProjectId),
          getDashboardSummary(selectedProjectId),
          getDashboardStatusBreakdown(selectedProjectId),
          getDashboardUserBreakdown(selectedProjectId),
          getDashboardOverdue(selectedProjectId),
          getTasksByProject(selectedProjectId),
        ]);

        if (!ignore) {
          setProjectDetails({
            ...detailsData,
            members: Array.isArray(projectMembers) ? projectMembers : detailsData?.members || [],
          });
          setSummary(summaryData);
          setStatusBreakdown(Array.isArray(statusData) ? statusData : []);
          setUserBreakdown(Array.isArray(userData) ? userData : []);
          setProjectTasks(Array.isArray(taskData) ? taskData : []);
          setOverdueCount(Number(overdueData?.count) || 0);
        }
      } catch (error) {
        if (!ignore) {
          setInsightsError(getApiErrorMessage(error, "Project insights could not be loaded."));
        }
      } finally {
        if (!ignore) {
          setInsightsLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      ignore = true;
    };
  }, [selectedProjectId, insightRefreshKey]);

  useEffect(() => {
    let isCancelled = false;
    let detachNotification = () => {};
    let detachTaskMoved = () => {};

    async function connectRealtime() {
      try {
        const userId = getStoredUserId();

        if (!userId) {
          return;
        }

        await signalRService.start(userId);

        if (isCancelled) {
          return;
        }

        detachNotification = signalRService.onNotification((payload) => {
          setNotifications((current) => [
            {
              id: `live-${Date.now()}`,
              message: payload?.message || "New notification",
              createdAt: payload?.createdAt || new Date().toISOString(),
              isRead: false,
            },
            ...current,
          ]);
          showNotice("info", payload?.message || "A new notification arrived.");
        });

        detachTaskMoved = signalRService.onTaskMoved(() => {
          setInsightRefreshKey((current) => current + 1);
        });
      } catch {
        // Realtime is best-effort. HTTP APIs remain the source of truth.
      }
    }

    connectRealtime();

    return () => {
      isCancelled = true;
      detachNotification();
      detachTaskMoved();
      signalRService.stop();
    };
  }, []);

  async function handleLogout() {
    await signalRService.stop();
    clearAuthSession();
    navigate("/login");
  }

  async function handleProfileSave(payload) {
    setSavingProfile(true);

    try {
      await updateProfile(payload);
      await loadProfileData();
      showNotice("success", "Profile updated successfully.");
      return true;
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Profile could not be updated."));
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(payload) {
    setChangingPassword(true);

    try {
      await changePassword(payload);
      showNotice("success", "Password changed successfully.");
      return true;
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Password could not be changed."));
      return false;
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleProjectSubmit(payload) {
    setProjectSubmitting(true);

    try {
      if (projectDialogMode === "create") {
        const created = await createProject(payload);
        await loadProjectsData(created?.projectId || null);
        showNotice("success", "Project created successfully.");
      } else {
        await updateProject(payload);
        await loadProjectsData(payload.projectId);
        setInsightRefreshKey((current) => current + 1);
        showNotice("success", "Project updated successfully.");
      }

      setIsProjectDialogOpen(false);
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Project changes could not be saved."));
    } finally {
      setProjectSubmitting(false);
    }
  }

  async function handleProjectDelete(project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? The backend will soft-delete its tasks and remove the project.`
    );

    if (!confirmed) {
      return;
    }

    setProjectDeleting(true);

    try {
      await deleteProject(project.id);
      await loadProjectsData();
      setBoardRefreshKey((current) => current + 1);
      setInsightRefreshKey((current) => current + 1);
      setIsProjectDialogOpen(false);
      showNotice("success", "Project deleted successfully.");
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Project could not be deleted."));
    } finally {
      setProjectDeleting(false);
    }
  }

  async function handleTaskCreate(payload) {
    setTaskSubmitting(true);

    try {
      await createTask(payload);
      setBoardRefreshKey((current) => current + 1);
      setInsightRefreshKey((current) => current + 1);
      setIsTaskDialogOpen(false);
      showNotice("success", "Task created successfully.");
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Task could not be created."));
    } finally {
      setTaskSubmitting(false);
    }
  }

  async function handleTaskSaved() {
    setActiveTaskId(null);
    setBoardRefreshKey((current) => current + 1);
    setInsightRefreshKey((current) => current + 1);
    showNotice("success", "Task updated successfully.");
  }

  async function handleTaskDeleted() {
    setActiveTaskId(null);
    setBoardRefreshKey((current) => current + 1);
    setInsightRefreshKey((current) => current + 1);
    showNotice("success", "Task deleted successfully.");
  }

  async function handleTaskMoved() {
    setInsightRefreshKey((current) => current + 1);
    showNotice("success", "Task status updated.");
  }

  async function handleRefreshWorkspace() {
    await Promise.allSettled([
      loadProjectsData(selectedProjectId),
      loadTenantUsers(),
      loadNotificationsData(),
    ]);

    setBoardRefreshKey((current) => current + 1);
    setInsightRefreshKey((current) => current + 1);
    showNotice("success", "Workspace refreshed.");
  }

  function handleExportWorkspace() {
    showNotice("info", "Export actions are not wired yet, but the dashboard layout is ready for them.");
  }

  function handlePinSelection() {
    showNotice("info", "Pinning is not wired yet, so I kept the control as a design placeholder.");
  }

  async function handleRemoveProjectMember(userId) {
    if (!selectedProjectId) {
      return;
    }

    try {
      await removeProjectMember(selectedProjectId, userId);
      setBoardRefreshKey((current) => current + 1);
      setInsightRefreshKey((current) => current + 1);
      showNotice("success", "Project member removed and unassigned from project tasks.");
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Member could not be removed."));
    }
  }

  async function handleMarkNotification(id) {
    if (typeof id !== "number") {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      return;
    }

    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      showNotice("error", getApiErrorMessage(error, "Notification could not be marked as read."));
    }
  }

  const noticeClasses =
    notice?.tone === "error"
      ? "border-[#edcfce] bg-[#fbefed] text-[#b66f71]"
      : notice?.tone === "info"
        ? "border-[#d8e2f2] bg-[#edf3fb] text-[#6e89ab]"
        : "border-[#d7e8df] bg-[#edf6f1] text-[#698f7e]";

  const totalTasks = Number(summary?.totalTasks) || projectTasks.length;
  const completedTasks = Number(summary?.completedTasks) || 0;
  const pendingTasks = Number(summary?.pendingTasks) || Math.max(totalTasks - completedTasks, 0);
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const onTimeRate = totalTasks ? Math.max(0, Math.round(((totalTasks - overdueCount) / totalTasks) * 100)) : 0;
  const assignedTaskCount = userBreakdown.reduce((sum, user) => sum + (Number(user.count) || 0), 0);
  const utilizationRate = totalTasks ? Math.min(100, Math.round((assignedTaskCount / totalTasks) * 100)) : 0;
  const memberCount = projectDetails?.members?.length ?? 0;
  const healthState = !selectedProject
    ? "Idle"
    : insightsError
      ? "Attention"
      : overdueCount > 0
        ? "Watch"
        : "Stable";
  const healthTone = insightsError ? "rose" : overdueCount > 0 ? "warm" : "neutral";

  const statusSeries = buildSeries(statusBreakdown.map((status) => status.count), 7);
  const workloadItems =
    userBreakdown.length > 0
      ? userBreakdown.map((user) => ({
          label: user.userName,
          value: Number(user.count) || 0,
        }))
      : (projectDetails?.members ?? []).map((member) => ({
          label: member.userName,
          value: Number(member.taskCount) || 0,
        }));
  const recentTaskRows = projectTasks.slice(0, 4).map((task) => ({
    key: task.title || `Task ${task.id}`,
    owner: getInitials(task.assignedUserName),
    due: formatShortDate(task.dueDate, "Open"),
  }));
  const previewStatusItems =
    statusBreakdown.length > 0
      ? statusBreakdown.map((status) => ({
          label: status.statusName,
          value: Number(status.count) || 0,
        }))
      : [
          { label: "Pending", value: pendingTasks },
          { label: "Completed", value: completedTasks },
          { label: "Overdue", value: overdueCount },
        ];

  const highlightCards = [
    {
      eyebrow: "Project progress",
      title: selectedProject?.name ? `${selectedProject.name} rollout` : "Portfolio overview",
      badges: ["Pin", "Share"],
      preview: (
        <MiniLinePreview
          values={statusSeries}
          compareValues={statusSeries.map((value, index) => Math.max(value - (index % 2 === 0 ? 1 : 0), 1))}
        />
      ),
      footer: `Owner: ${profile?.name || "Workspace owner"} / Updated: ${formatShortDate(
        projectTasks[0]?.updatedAt || projectDetails?.createdAt,
        "Recently"
      )}`,
    },
    {
      eyebrow: "Resource utilization",
      title: memberCount > 0 ? `${memberCount}-person delivery team` : "Assignee workload",
      badges: ["Pin", "Share"],
      preview: <MiniBarsPreview items={workloadItems} />,
      footer: `${assignedTaskCount} assigned task${assignedTaskCount === 1 ? "" : "s"} flowing through the project`,
    },
    {
      eyebrow: "Sprint burn-down",
      title: "Delivery momentum",
      badges: ["Pin", "Share"],
      preview: <MiniStatusPreview items={previewStatusItems} />,
      footer: `On-time rate: ${onTimeRate}% / Open risks: ${overdueCount}`,
    },
    {
      eyebrow: "Time tracking",
      title: "Weekly summary",
      badges: ["Pin", "Share"],
      preview: <MiniTablePreview rows={recentTaskRows} />,
      footer: `Recent tasks across ${selectedProject?.name || "the selected workspace"}`,
    },
  ];

  const scheduledReports = [
    {
      name: "Weekly Executive Summary",
      nextRun: addDays(new Date(), 1),
      onEdit: openEditProjectDialog,
    },
    {
      name: "Resource Utilization Digest",
      nextRun: addDays(new Date(), 3),
      onEdit: () => setIsTaskDialogOpen(true),
    },
    {
      name: "Client Snapshot",
      nextRun: addDays(new Date(), 7),
      onEdit: handleRefreshWorkspace,
    },
  ];

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center  px-4 text-[#7b7883]">
        <div className="flex items-center gap-3 rounded-[28px] border border-[#dedbe2] bg-white px-5 py-4 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#686570]">
      <div className="mx-auto flex flex-col overflow-hidden border border-[#d7d4da] bg-[#f6f5f2]">
        <header className="border-b border-[#cfccd3] bg-[#b9b7bc] px-5 py-4 text-white/90 lg:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">CollabHub</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                    Reporting workspace
                  </p>
                </div>
              </div>

              <label className="relative lg:ml-5 lg:max-w-[460px] lg:flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  type="search"
                  value={workspaceQuery}
                  onChange={(event) => setWorkspaceQuery(event.target.value)}
                  placeholder="Search reports, projects, people"
                  className="w-full rounded-2xl border border-white/10 bg-white/60 py-3 pl-11 pr-4 text-sm text-[#6f6b75] outline-none transition placeholder:text-[#c5c2c8] focus:border-white/30 focus:bg-white/80 focus:ring-4 focus:ring-white/20"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {[
                {
                  label: "Create Report",
                  onClick: () => setIsTaskDialogOpen(true),
                  disabled: !selectedProjectId,
                },
                {
                  label: "Export",
                  onClick: handleExportWorkspace,
                  disabled: false,
                },
                {
                  label: "Schedule",
                  onClick: openEditProjectDialog,
                  disabled: !selectedProject,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className="rounded-full px-4 py-2 text-sm text-white/88 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleRefreshWorkspace}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/12"
                title="Refresh workspace"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <NotificationBell
                notifications={notifications}
                loading={notificationsLoading}
                onRefresh={loadNotificationsData}
                onMarkRead={handleMarkNotification}
              />

              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-sm font-semibold text-[#8b8794] shadow-sm transition hover:bg-white"
                title={profile?.name || "Profile"}
              >
                {getInitials(profile?.name)}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/12 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          {notice && (
            <div className={`mb-6 flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-sm ${noticeClasses}`}>
              <span>{notice.message}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-current"
              >
                Dismiss
              </button>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.3fr]">
            <WorkspaceMetric
              icon={Sparkles}
              label="Project Health"
              value={healthState}
              helper={selectedProject?.name || "Pick a project to begin"}
              tone={healthTone}
            />
            <WorkspaceMetric
              icon={CheckCircle2}
              label="On-time %"
              value={`${onTimeRate}%`}
              helper={`Compared to ${completionRate}% completed work`}
              tone="warm"
            />
            <WorkspaceMetric
              icon={Users}
              label="Resource Utilization"
              value={`${utilizationRate}%`}
              helper={memberCount > 0 ? `${memberCount} active members in the project` : "Team usage appears here"}
              tone="mint"
            />
            <WorkspaceMetric
              icon={FolderKanban}
              label="Active Tasks"
              value={pendingTasks}
              helper={`${totalTasks} total tasks on the selected board`}
              tone="sky"
            />
            <WorkspaceMetric
              icon={AlertTriangle}
              label="Open Risks"
              value={overdueCount}
              helper={overdueCount > 0 ? "Critical work needs attention" : "No overdue work detected"}
              tone="rose"
            />
            <ScheduledReportsPanel reports={scheduledReports} loading={insightsLoading} />
          </section>

          <section className="mt-6 rounded-[30px] border border-[#dfdce2] bg-white/70 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="flex flex-wrap gap-2">
                  {["Pre-built", "Custom", "Dashboards"].map((tab) => {
                    const isActive = activeLibraryTab === tab;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveLibraryTab(tab)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-[#cfcfd5] text-white shadow-sm"
                            : "bg-transparent text-[#b1aeb7] hover:bg-[#f3f2f0]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 xl:ml-4">
                  <ProjectSelector
                    value={selectedProjectId}
                    onSelect={(projectId) => setSelectedProjectId(projectId)}
                    projects={projects}
                    loading={projectsLoading}
                    error={projectError}
                    onRetry={() => loadProjectsData(selectedProjectId)}
                  />
                  <button
                    type="button"
                    onClick={openCreateProjectDialog}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f2f0] text-[#a9a5af] transition hover:bg-[#ece9ef] hover:text-[#7d7783]"
                    title="Create project"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-[#c1bec5]">
                  Data Source: {selectedProject?.name || "All Projects"} / Filter by task, owner
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRefreshWorkspace}
                  className="rounded-2xl bg-[#cfcfd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c5c5cc]"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaskDialogOpen(true)}
                  disabled={!selectedProjectId}
                  className="rounded-2xl bg-[#cfcfd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c5c5cc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  New Report
                </button>
                <button
                  type="button"
                  onClick={handlePinSelection}
                  className="rounded-2xl bg-[#cfcfd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c5c5cc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pin Selected
                </button>
              </div>
            </div>
          </section>

          {!selectedProjectId && projects.length === 0 ? (
            <section className="mt-6 rounded-[30px] border border-dashed border-[#dbd8de] bg-white/65 px-6 py-12 text-center shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
              <div className="mx-auto max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b8b4bd]">
                  Workspace empty
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#706b76]">
                  Start by creating your first project
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#aaa6b0]">
                  The backend is already wired up for projects, tasks, dashboard insights, and realtime
                  notifications. Once a project exists, the rest of this workspace will populate.
                </p>
                <button
                  type="button"
                  onClick={openCreateProjectDialog}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#cfcfd5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#c5c5cc]"
                >
                  <Plus className="h-4 w-4" />
                  Create project
                </button>
              </div>
            </section>
          ) : (
            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-6">
                {insightsError && (
                  <div className="rounded-[24px] border border-[#edd4d5] bg-[#fbefed] px-4 py-3 text-sm text-[#b96f71]">
                    {insightsError}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {highlightCards.map((card) => (
                    <InsightCard
                      key={card.eyebrow}
                      eyebrow={card.eyebrow}
                      title={card.title}
                      preview={card.preview}
                      footer={card.footer}
                      badges={card.badges}
                    />
                  ))}
                </div>

                <KanbanBoard
                  projectId={selectedProjectId}
                  selectedProject={selectedProject}
                  refreshToken={boardRefreshKey}
                  onCreateTask={() => setIsTaskDialogOpen(true)}
                  onTaskOpen={(task) => setActiveTaskId(task.id)}
                  onTaskMoved={handleTaskMoved}
                  workspaceQuery={workspaceQuery}
                />

                <section className="rounded-[28px] border border-[#e1dee3] bg-white/76 p-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ece8f2] text-[#8d7da4]">
                      <UserCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8f8a98]">Project members</p>
                      <p className="text-xs text-[#c0bcc4]">Visible assignees for the active workspace</p>
                    </div>
                    {usersLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-[#bbb7bf]" />}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {projectDetails?.members?.length ? (
                      projectDetails.members.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-[#f4f3f0] px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#8f8a98]">
                              {member.userName}
                            </p>
                            <p className="truncate text-xs text-[#bbb7bf]">{member.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectMember(member.userId)}
                            className="rounded-full border border-[#edcfce] bg-white px-3 py-1.5 text-xs font-medium text-[#b96f71] transition hover:bg-[#fbefed]"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-[#f4f3f0] px-4 py-8 text-center text-sm text-[#b3aeba] md:col-span-2 xl:col-span-3">
                        No project members yet. Assign tasks to users to populate this list.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-[28px] border border-[#e1dee3] bg-white/80 p-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bbb7bf]">
                    Visualization Gallery
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <VisualizationTile variant="line" />
                    <VisualizationTile variant="bars" />
                    <VisualizationTile variant="radial" />
                    <VisualizationTile variant="matrix" />
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#e1dee3] bg-white/80 p-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bbb7bf]">
                    Quick Templates
                  </p>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsTaskDialogOpen(true)}
                      disabled={!selectedProjectId}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#cfcfd5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#c5c5cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Sprint Summary
                    </button>
                    <button
                      type="button"
                      onClick={openEditProjectDialog}
                      disabled={!selectedProject}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#cfcfd5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#c5c5cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Settings2 className="h-4 w-4" />
                      Utilization Overview
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#e1dee3] bg-white/80 p-5 shadow-[0_18px_40px_-34px_rgba(82,82,91,0.45)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bbb7bf]">
                    Workspace Actions
                  </p>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={openCreateProjectDialog}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f3f2f0] px-4 py-3 text-sm font-medium text-[#8f8a98] transition hover:bg-[#ece9ef]"
                    >
                      <FolderKanban className="h-4 w-4" />
                      Create Project
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshWorkspace}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f3f2f0] px-4 py-3 text-sm font-medium text-[#8f8a98] transition hover:bg-[#ece9ef]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Workspace
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f3f2f0] px-4 py-3 text-sm font-medium text-[#8f8a98] transition hover:bg-[#ece9ef]"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </section>
              </div>
            </section>
          )}
        </main>
      </div>

      <ProfilePanel
        isOpen={isProfileOpen}
        profile={profile}
        savingProfile={savingProfile}
        changingPassword={changingPassword}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={handleProfileSave}
        onChangePassword={handlePasswordChange}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        mode={projectDialogMode}
        project={projectDialogMode === "edit" ? projectDetails || selectedProject : null}
        submitting={projectSubmitting}
        deleting={projectDeleting}
        onClose={() => setIsProjectDialogOpen(false)}
        onSubmit={handleProjectSubmit}
        onDelete={handleProjectDelete}
      />

      <TaskComposerDialog
        isOpen={isTaskDialogOpen}
        project={selectedProject}
        users={users}
        submitting={taskSubmitting}
        onClose={() => setIsTaskDialogOpen(false)}
        onSubmit={handleTaskCreate}
      />

      <TaskDetailsDrawer
        isOpen={Boolean(activeTaskId)}
        taskId={activeTaskId}
        users={users}
        onClose={() => setActiveTaskId(null)}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
