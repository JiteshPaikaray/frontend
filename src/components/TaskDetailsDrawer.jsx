import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  MessageSquareText,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../api/axios";
import {
  addTaskComment,
  deleteTask,
  getTaskComments,
  getTaskDetails,
  updateTask,
} from "../services/taskService";
import { formatDateTime, toDateInputValue } from "../utils/formatters";

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export default function TaskDetailsDrawer({
  isOpen,
  taskId,
  users = [],
  onClose,
  onSaved,
  onDeleted,
}) {
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
  });
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!isOpen || !taskId) {
      setDetail(null);
      setComments([]);
      setError("");
      return undefined;
    }

    async function loadTask() {
      setLoading(true);
      setError("");

      try {
        const [taskData, commentData] = await Promise.all([
          getTaskDetails(taskId),
          getTaskComments(taskId),
        ]);

        if (!ignore) {
          setDetail(taskData);
          setComments(Array.isArray(commentData) ? commentData : []);
          setForm({
            title: taskData?.title || "",
            description: taskData?.description || "",
            priority: taskData?.priority || "Medium",
            assignedTo: taskData?.assignedTo ? String(taskData.assignedTo) : "",
            dueDate: toDateInputValue(taskData?.dueDate),
          });
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getApiErrorMessage(loadError, "We couldn't load that task right now."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      ignore = true;
    };
  }, [isOpen, taskId]);

  if (!isOpen) {
    return null;
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        taskId,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      };

      if (form.assignedTo) {
        payload.assignedTo = Number(form.assignedTo);
      }

      await updateTask(payload);
      await onSaved?.();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "The task changes could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this task? It will be soft-deleted in the backend.");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteTask(taskId);
      await onDeleted?.();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "The task could not be deleted."));
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    setCommentSaving(true);
    setError("");

    try {
      const createdComment = await addTaskComment({
        taskId,
        comment: commentText.trim(),
      });

      setComments((current) => [createdComment, ...current]);
      setCommentText("");
    } catch (commentError) {
      setError(getApiErrorMessage(commentError, "The comment could not be added."));
    } finally {
      setCommentSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Task details</p>
            <p className="text-sm text-slate-500">Review and update this task using the backend task APIs.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading task details...
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {detail && (
                <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {detail.type || "Task"} #{detail.id}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {detail.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Status: <span className="font-medium text-slate-800">{detail.statusName}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Created by</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{detail.createdByName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(detail.createdAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Last updated</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{formatDateTime(detail.updatedAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">Project ID {detail.projectId}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Edit task</p>
                    <p className="text-sm text-slate-500">
                      Title, description, priority, assignee, and due date map directly to `/api/tasks/update`.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Priority</span>
                      <select
                        value={form.priority}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            priority: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        Assignee
                      </span>
                      <select
                        value={form.assignedTo}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            assignedTo: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">
                          {detail?.assignedUserName ? "Keep current assignee" : "Unassigned"}
                        </option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Due date
                      </span>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            dueDate: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save task changes
                  </button>
                </form>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Comments</p>
                    <p className="text-sm text-slate-500">
                      New comments are posted to `/api/tasks/comments`.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddComment} className="mt-5 space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Share a delivery note or status update."
                  />
                  <button
                    type="submit"
                    disabled={commentSaving || !taskId}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {commentSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Add comment
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      No comments returned yet for this task.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={`${comment.id}-${comment.createdAt}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{comment.userName}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
