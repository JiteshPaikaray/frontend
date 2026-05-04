import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  FolderKanban,
  Home,
  Layers3,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings2,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../api/axios";
import NotificationBell from "../components/NotificationBell";
import ProfilePanel from "../components/ProfilePanel";
import ProjectDialog from "../components/ProjectDialog";
import ProjectSelector from "../components/ProjectSelector";
import TaskComposerDialog from "../components/TaskComposerDialog";
import TaskDetailsDrawer from "../components/TaskDetailsDrawer";
import { changePassword, getProfile, getTenantUsers, updateProfile } from "../services/authService";
import {
  getDashboardOverdue,
  getDashboardStatusBreakdown,
  getDashboardSummary,
  getDashboardUserBreakdown,
} from "../services/dashboardService";
import { getNotifications, markNotificationAsRead } from "../services/notificationService";
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
import { createTask } from "../services/taskService";
import {
  clearAuthSession,
  getStoredSelectedProjectId,
  getStoredUserId,
  setStoredSelectedProjectId,
} from "../utils/auth";
import { formatDateTime, getInitials } from "../utils/formatters";
import KanbanBoard from "./KanbanBoard";

function SummaryCard({ label, value, helper, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-black text-white shadow-yellow-300/50",
    blue: "bg-yellow-500 text-slate-950 shadow-yellow-200/70",
    emerald: "bg-green-600 text-white shadow-green-200/70",
    amber: "bg-amber-500 text-slate-950 shadow-amber-200/70",
  };

  return (
    <div className={`rounded-[28px] p-5 shadow-lg ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm opacity-80">{helper}</p>
    </div>
  );
}

function StatusBar({ label, count, total }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {count} · {percentage}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [notice, setNotice] = useState(null);

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
    const nextProject =
      projects.find((project) => project.id === selectedProjectId) ?? null;

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
          showNotice("error", getApiErrorMessage(profileResult.reason, "Profile could not be loaded."));
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
        ] = await Promise.all([
          getProjectDetails(selectedProjectId),
          getProjectMembers(selectedProjectId),
          getDashboardSummary(selectedProjectId),
          getDashboardStatusBreakdown(selectedProjectId),
          getDashboardUserBreakdown(selectedProjectId),
          getDashboardOverdue(selectedProjectId),
        ]);

        if (!ignore) {
          setProjectDetails({
            ...detailsData,
            members: Array.isArray(projectMembers) ? projectMembers : detailsData?.members || [],
          });
          setSummary(summaryData);
          setStatusBreakdown(Array.isArray(statusData) ? statusData : []);
          setUserBreakdown(Array.isArray(userData) ? userData : []);
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
        // Realtime is best-effort. The HTTP APIs remain the source of truth.
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

  const navItems = [
    { icon: Home, label: "Overview", active: true },
    { icon: FolderKanban, label: "Projects" },
    { icon: Users, label: "Team" },
    { icon: BarChart3, label: "Reports" },
  ];

  const noticeClasses =
    notice?.tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : notice?.tone === "info"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] text-slate-600">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#eef2f7] text-slate-900">
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden border-r border-yellow-600 bg-black text-white transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-lg font-bold text-slate-950">
                CH
              </div>
              <div>
                <p className="text-lg font-semibold">CollabHub</p>
                <p className="text-sm text-slate-400">API-connected workspace</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  item.active
                    ? "bg-white text-slate-950 shadow-lg shadow-slate-900/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Delivery workspace
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  Frontend mapped to the backend APIs
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Project, task, dashboard, auth, and notification flows are all wired to the backend.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => {
                  setProjectDialogMode("create");
                  setIsProjectDialogOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                New project
              </button>

              <button
                type="button"
                onClick={() => setIsTaskDialogOpen(true)}
                disabled={!selectedProjectId}
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Layers3 className="h-4 w-4" />
                New task
              </button>

              <button
                type="button"
                onClick={handleRefreshWorkspace}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
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
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:border-slate-300"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {getInitials(profile?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium text-slate-900">
                    {profile?.name || "Your account"}
                  </span>
                  <span className="block text-xs text-slate-500">{profile?.email || "No email"}</span>
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {notice && (
            <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${noticeClasses}`}>
              <span>{notice.message}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-full bg-white/70 px-2 py-1 text-xs font-medium text-current"
              >
                Dismiss
              </button>
            </div>
          )}

          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            <SummaryCard
              label="Total Tasks"
              value={summary?.totalTasks ?? 0}
              helper="Live summary from `/api/dashboard/summary`"
              tone="slate"
            />
            <SummaryCard
              label="Completed"
              value={summary?.completedTasks ?? 0}
              helper="Tasks in final statuses"
              tone="emerald"
            />
            <SummaryCard
              label="Pending"
              value={summary?.pendingTasks ?? 0}
              helper="Work still in progress"
              tone="blue"
            />
            <SummaryCard
              label="Overdue"
              value={overdueCount}
              helper="Confirmed by `/api/dashboard/overdue`"
              tone="amber"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Project overview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {selectedProject?.name || "Select a project"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {selectedProject?.description ||
                      "Choose a project to load project details, members, summary metrics, and the board."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProject) {
                        return;
                      }

                      setProjectDialogMode("edit");
                      setIsProjectDialogOpen(true);
                    }}
                    disabled={!selectedProject}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Settings2 className="h-4 w-4" />
                    Edit project
                  </button>
                </div>
              </div>

              {insightsError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {insightsError}
                </div>
              )}

              {insightsLoading ? (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading project insights...
                </div>
              ) : selectedProject ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workflow</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {projectDetails?.workflowName || "Not available"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Created</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(projectDetails?.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Members</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {projectDetails?.members?.length ?? 0} active members
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-slate-900">Status distribution</p>
                      <div className="mt-4 space-y-4">
                        {statusBreakdown.length === 0 ? (
                          <p className="text-sm text-slate-500">No status data yet for this project.</p>
                        ) : (
                          statusBreakdown.map((status) => (
                            <StatusBar
                              key={status.statusName}
                              label={status.statusName}
                              count={status.count}
                              total={summary?.totalTasks ?? 0}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-slate-900">Assignee workload</p>
                      <div className="mt-4 space-y-3">
                        {userBreakdown.length === 0 ? (
                          <p className="text-sm text-slate-500">No user workload has been recorded yet.</p>
                        ) : (
                          userBreakdown.map((user) => (
                            <div
                              key={user.userName}
                              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-700">{user.userName}</span>
                              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                {user.count}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Project insights appear here once a project is selected.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-yellow-50 text-yellow-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Project members</p>
                    <p className="text-sm text-slate-500">
                      Members are inferred by the backend from assigned tasks.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {projectDetails?.members?.length ? (
                    projectDetails.members.map((member) => (
                      <div
                        key={member.userId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{member.userName}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                              {member.taskCount} assigned task{member.taskCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectMember(member.userId)}
                            className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No project members yet. Assign tasks to tenant users to populate this list.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tenant users</p>
                    <p className="text-sm text-slate-500">
                      Available assignees returned by `/api/auth/users`.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {usersLoading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No active users were returned for this tenant.
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {getInitials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                          <p className="truncate text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>

          {!selectedProjectId && projects.length === 0 && (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-8 text-center shadow-sm">
              <div className="mx-auto max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Workspace empty
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Start by creating your first project
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The backend is ready with project, task, dashboard, and notification APIs. Creating a
                  project unlocks the rest of the board flows.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProjectDialogMode("create");
                    setIsProjectDialogOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Create project
                </button>
              </div>
            </div>
          )}

          <KanbanBoard
            projectId={selectedProjectId}
            selectedProject={selectedProject}
            refreshToken={boardRefreshKey}
            onCreateTask={() => setIsTaskDialogOpen(true)}
            onTaskOpen={(task) => setActiveTaskId(task.id)}
            onTaskMoved={handleTaskMoved}
          />
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
