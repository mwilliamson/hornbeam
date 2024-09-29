import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { allProjectsQuery } from "hornbeam-common/lib/queries";
import Boundary from "../Boundary";
import { ProjectsView } from "./ProjectsView";

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
          onProjectAdd={mutation => mutate({
            type: "projectAdd",
            projectAdd: {
              ...mutation,
              createdAt: Instant.now(),
              id: uuidv7(),
            },
          })}
          onProjectSelect={onProjectSelect}
        />
      )}
    />
  );
}
