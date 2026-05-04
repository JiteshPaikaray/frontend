import { useEffect, useState } from "react";
import { FolderKanban, Loader2, Trash2, X } from "lucide-react";

export default function ProjectDialog({
  isOpen,
  mode = "create",
  project = null,
  submitting = false,
  deleting = false,
  onClose,
  onSubmit,
  onDelete,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    code: "",
    workflowId: "1",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      name: project?.name || "",
      description: project?.description || "",
      code: project?.code || "",
      workflowId: project?.workflowId ? String(project.workflowId) : "1",
    });
  }, [isOpen, project]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      code: form.code.trim() || undefined,
    };

    if (mode === "create") {
      payload.workflowId = form.workflowId ? Number(form.workflowId) : 1;
    } else {
      payload.projectId = project?.id;
    }

    await onSubmit?.(payload);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {mode === "create" ? "Create project" : "Edit project"}
              </p>
              <p className="text-sm text-slate-500">
                {mode === "create"
                  ? "Set up a project workspace backed by the new project APIs."
                  : "Update the selected project details."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Project name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Platform revamp"
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
              placeholder="What is this project delivering?"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Code</span>
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="PRJ"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Workflow ID</span>
              <input
                type="number"
                min="1"
                value={form.workflowId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    workflowId: event.target.value,
                  }))
                }
                disabled={mode !== "create"}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {mode === "edit" && project && (
              <button
                type="button"
                onClick={() => onDelete?.(project)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete project
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create project" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
