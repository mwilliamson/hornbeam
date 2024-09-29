import { Project } from "hornbeam-common/lib/app/projects";

interface ProjectsViewProps {
  projects: ReadonlyArray<Project>;
}

export function ProjectsView(props: ProjectsViewProps) {
  const {projects} = props;

  return (
    <ul>
      {projects.map(project => (
        <li key={project.id}>
          {project.name}
        </li>
      ))}
    </ul>
  );
}
