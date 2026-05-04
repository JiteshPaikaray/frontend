import { useEffect, useState } from "react";
import { KeyRound, Loader2, UserRound, X } from "lucide-react";
import { formatDateTime } from "../utils/formatters";

export default function ProfilePanel({
  isOpen,
  profile,
  savingProfile = false,
  changingPassword = false,
  onClose,
  onSaveProfile,
  onChangePassword,
}) {
  const [name, setName] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || "");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLocalError("");
    }
  }, [isOpen, profile]);

  if (!isOpen) {
    return null;
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setLocalError("");
    await onSaveProfile?.({ name: name.trim() });
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setLocalError("New password and confirmation must match.");
      return;
    }

    setLocalError("");

    const succeeded = await onChangePassword?.(passwords);

    if (succeeded) {
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/25 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Your profile</p>
            <p className="text-sm text-slate-500">Manage your account details and password.</p>
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
          <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{profile?.name || "Unknown user"}</p>
                <p className="text-sm text-slate-500">{profile?.email || "No email available"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Joined {formatDateTime(profile?.createdAt, "recently")}
                </p>
              </div>
            </div>
          </section>

          {localError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError}
            </div>
          )}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Profile details</p>
                <p className="text-sm text-slate-500">Keep your display name up to date.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Display name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Your name"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{profile?.email || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tenant ID</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{profile?.tenantId || "-"}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                Save profile
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Change password</p>
                <p className="text-sm text-slate-500">Use your current password to set a new one.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Current password</span>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  minLength={6}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  minLength={6}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
