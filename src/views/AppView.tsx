import { AppState, AppUpdate } from "../app";

import "../scss/style.scss";
import "./AppView.scss";
import ToolsView from "./ToolsView";

interface AppViewProps {
  sendUpdate: (update: AppUpdate) => void;
  state: AppState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AppView(props: AppViewProps) {
  return (
    <div className="AppView">
      <ToolsView />
    </div>
  );
}
