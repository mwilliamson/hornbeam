import { allProjectsQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import { ProjectsView } from "./ProjectsView";
import { appMutations } from "hornbeam-common/lib/app/snapshots";

interface ProjectsViewBoundaryProps {
  onProjectSelect: (id: string) => void;
}

export function ProjectsViewBoundary(props: ProjectsViewBoundaryProps) {
  const {onProjectSelect} = props;

  return (
    <Boundary
      queries={{
        projects: allProjectsQuery,
      }}
      render={({projects}, mutate) => (
        <ProjectsView
          projects={projects}
          onProjectAdd={async mutation => {
            await mutate(appMutations.projectAdd(mutation));
          }}
          onProjectSelect={onProjectSelect}
        />
      )}
    />
  );
}
