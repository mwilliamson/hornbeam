import { useState } from "react";
import { BackendConnection } from "../backendConnections";
import { ProjectsViewBoundary } from "./projects/ProjectsViewBoundary";
import BoardView from "./BoardView";

interface AppViewProps {
  backendConnection: BackendConnection;
}

export default function AppView(props: AppViewProps) {
  const {backendConnection} = props;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return selectedProjectId === null ? (
    <ProjectsViewBoundary
      onProjectSelect={(id) => setSelectedProjectId(id)}
    />
  ) : (
    <BoardView
      backendConnection={backendConnection}
      projectId={selectedProjectId}
    />
  );
}
