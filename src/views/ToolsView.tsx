import Button from "./widgets/Button";
import "./ToolsView.scss";
import ControlGroup from "./widgets/ControlGroup";

interface ToolsViewProps {
  onCardAddClick: () => void;
  onTimeTravelStart: () => void;
}

export default function ToolsView(props: ToolsViewProps) {
  const {onCardAddClick, onTimeTravelStart} = props;

  return (
    <div className="ToolsView">
      <ControlGroup>
        <Button type="button" intent="primary" onClick={onCardAddClick}>
          Add card
        </Button>
      </ControlGroup>

      <ControlGroup>
        <Button type="button" intent="primary" onClick={onTimeTravelStart}>
          Time travel
        </Button>
      </ControlGroup>
    </div>
  );
}
