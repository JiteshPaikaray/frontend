import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { getApiErrorMessage } from "../../api/axios";
import { login, register } from "../../services/authService";
import { saveAuthSession } from "../../utils/auth";

const DEFAULT_LOGIN_FORM = {
  email: "",
  password: "",
};

const DEFAULT_REGISTER_FORM = {
  tenantName: "",
  domain: "",
  name: "",
  email: "",
  password: "",
};

export default function Login() {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN_FORM);
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await login(loginForm);
      saveAuthSession(session);
      navigate("/");
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(registerForm);
      const session = await login({
        email: registerForm.email,
        password: registerForm.password,
      });
      saveAuthSession(session);
      navigate("/");
    } catch (registerError) {
      setError(getApiErrorMessage(registerError, "Registration failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]" />
      <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="hidden rounded-[36px] border border-white/10 bg-white/5 p-10 text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.85)] backdrop-blur lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              Backend ready
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
              Ship work from a frontend that matches your API surface.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Authentication, profile, projects, tasks, dashboard reporting, and notifications are all
              connected to the backend contract you implemented.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Auth + profile</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Login, tenant registration, profile updates, password changes, and tenant users.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Delivery board</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Project-aware kanban, task CRUD, comments, summary metrics, and notifications.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/95 p-6 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.85)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  CollabHub
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {mode === "login" ? "Welcome back" : "Create your workspace"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === "login"
                    ? "Sign in with the backend auth API."
                    : "Register a tenant and admin account, then we’ll sign you in automatically."}
                </p>
              </div>

              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    mode === "login" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    mode === "register" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Tenant name</span>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={registerForm.tenantName}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            tenantName: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        placeholder="Acme Corp"
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Domain</span>
                    <input
                      type="text"
                      value={registerForm.domain}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          domain: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="acme.local"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Admin name</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Admin email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create workspace
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
