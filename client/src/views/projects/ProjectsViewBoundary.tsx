import { allProjectsQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import { ProjectsView } from "./ProjectsView";

export function ProjectsViewBoundary() {
  return (
    <Boundary
      queries={{
        projects: allProjectsQuery,
      }}
      render={({projects}) => (
        <ProjectsView projects={projects} />
      )}
    />
  );
}
