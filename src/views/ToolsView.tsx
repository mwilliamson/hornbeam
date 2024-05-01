import Button from "./widgets/Button";
import "./ToolsView.scss";
import ControlGroup from "./widgets/ControlGroup";

interface ToolsViewProps {
  onCardAddClick: () => void;
  onSettingsClick: () => void;
  onSubboardClose?: () => void;
  onTimeTravelStart: () => void;
}

export default function ToolsView(props: ToolsViewProps) {
  const {onCardAddClick, onSettingsClick, onSubboardClose, onTimeTravelStart} = props;

  return (
    <div className="ToolsView">
      <ControlGroup>
        <Button type="button" intent="secondary" onClick={onCardAddClick} fullWidth>
          Add card
        </Button>
      </ControlGroup>

      <ControlGroup>
        <Button type="button" intent="secondary" onClick={onTimeTravelStart} fullWidth>
          Time travel
        </Button>
      </ControlGroup>

      <ControlGroup>
        <Button type="button" intent="secondary" onClick={onSettingsClick} fullWidth>
          Settings
        </Button>
      </ControlGroup>

      {onSubboardClose !== undefined && (
        <ControlGroup>
          <Button type="button" intent="secondary" onClick={onSubboardClose} fullWidth>
            Close subboard
          </Button>
        </ControlGroup>
      )}
    </div>
  );
}
