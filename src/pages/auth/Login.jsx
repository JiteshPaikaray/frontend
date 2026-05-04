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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
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
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Tenant name</span>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={registerForm.tenantName}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            tenantName: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="acme.local"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Admin name</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Admin email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating workspace..." : "Create workspace"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-slate-500">
              All flows are connected to the backend API
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
