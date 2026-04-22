import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import { ChevronDown } from "lucide-react";

export default function ProjectSelector({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSelect = (value) => {
    setSelectedProject(value);
    onSelect(value);
  };

  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name;

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <select
          value={selectedProject}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full px-4 py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer bg-white hover:bg-gray-50 transition-all"
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {selectedProjectName && (
        <div className="mt-2 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {selectedProjectName}
        </div>
      )}
    </div>
  );
}