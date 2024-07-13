import { FolderUpIcon } from "lucide-react";

import Button from "./widgets/Button";
import "./TopBar.scss";

interface TopBarProps {
  onBoardUp: (() => void) | undefined;
  onCardAddClick: () => void;
  onSettingsClick: () => void;
  onTimeTravelStart: () => void;
}

export default function TopBar(props: TopBarProps) {
  const {onBoardUp, onCardAddClick, onSettingsClick, onTimeTravelStart} = props;

  return (
    <div className="TopBar">
      <div className="TopBar-Left">
        <h1 className="TopBar-Title">
          Hornbeam
        </h1>

        <Button
          type="button"
          intent="secondary"
          onClick={onBoardUp}
          disabled={onBoardUp === undefined}
        >
          <FolderUpIcon className="TopBar-UpIcon" size={18} /> Up
        </Button>
      </div>

      <div className="TopBar-Right">
        <div>
          <Button type="button" intent="secondary" onClick={onCardAddClick}>
            Add card
          </Button>
        </div>

        <div>
          <Button type="button" intent="secondary" onClick={onTimeTravelStart}>
            Time travel
          </Button>
        </div>

        <div>
          <Button type="button" intent="secondary" onClick={onSettingsClick}>
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
