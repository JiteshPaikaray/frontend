import { useEffect, useState } from "react";
import { ChevronDown, FolderKanban } from "lucide-react";
import { getProjects } from "../services/projectService";

export default function ProjectSelector({ onSelect, value = null }) {
  const [projects, setProjects] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

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
  }, []);

  function handleSelect(rawValue) {
    const nextValue = rawValue === "" ? null : Number(rawValue);
    const selectedProject =
      projects.find((project) => String(project.id) === String(nextValue)) ?? null;

    onSelect(nextValue, selectedProject);
  }

  return (
    <div className="relative min-w-[240px]">
      <FolderKanban className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        value={value == null ? "" : String(value)}
        onChange={(event) => handleSelect(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isLoading}
        className="w-full appearance-none rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{isLoading ? "Loading projects..." : "Select project"}</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${
          isFocused ? "rotate-180" : ""
        }`}
      />
    </div>
  );
}
