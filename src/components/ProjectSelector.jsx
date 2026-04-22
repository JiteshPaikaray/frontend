import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import { ChevronDown, Folder } from "lucide-react";

export default function ProjectSelector({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSelect = (value) => {
    setSelectedProject(value);
    onSelect(value);
    setIsOpen(false);
  };

  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name;

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <select
          value={selectedProject}
          onChange={(e) => handleSelect(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className="w-full px-4 py-2.5 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer bg-white hover:border-gray-400 transition-all text-gray-900 text-sm"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}