import { useEffect, useState } from "react";
import { ChevronDown, FolderKanban, RefreshCw } from "lucide-react";
import { getProjects } from "../services/projectService";

export default function ProjectSelector({
  onSelect,
  value = null,
  projects: providedProjects = null,
  loading: providedLoading = false,
  error = "",
  onRetry,
}) {
  const [projects, setProjects] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usingProvidedProjects = Array.isArray(providedProjects);
  const visibleProjects = usingProvidedProjects ? providedProjects : projects;
  const visibleLoading = usingProvidedProjects ? providedLoading : isLoading;

  useEffect(() => {
    let ignore = false;

    if (usingProvidedProjects) {
      return undefined;
    }

    async function loadProjects() {
      setIsLoading(true);

      try {
        const data = await getProjects();

        if (!ignore) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      ignore = true;
    };
  }, [usingProvidedProjects]);

  function handleSelect(rawValue) {
    const nextValue = rawValue === "" ? null : Number(rawValue);
    const selectedProject =
      visibleProjects.find((project) => String(project.id) === String(nextValue)) ?? null;

    onSelect(nextValue, selectedProject);
  }

  return (
    <div className="space-y-2">
      <div className="relative min-w-[230px]">
        <FolderKanban className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c0bcc4]" />
        <select
          value={value == null ? "" : String(value)}
          onChange={(event) => handleSelect(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={visibleLoading}
          className="w-full appearance-none rounded-2xl border border-[#e1dee3] bg-[#fbfaf8] py-3 pl-11 pr-11 text-sm font-medium text-[#8f8a98] outline-none transition focus:border-[#d0ced4] focus:ring-4 focus:ring-[#ece9ef] disabled:cursor-not-allowed disabled:bg-[#f4f3f0] disabled:text-[#bbb7bf]"
        >
          <option value="">{visibleLoading ? "Loading projects..." : "Select project"}</option>
          {visibleProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c0bcc4] transition-transform ${
            isFocused ? "rotate-180" : ""
          }`}
        />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#edd4d5] bg-[#fbefed] px-3 py-2 text-xs text-[#b96f71]">
          <span>{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-medium text-[#b96f71] shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
