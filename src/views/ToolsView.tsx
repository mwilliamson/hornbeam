import Button from "./widgets/Button";
import "./ToolsView.scss";

interface ToolsViewProps {
  onCardAddClick: () => void;
}

export default function ToolsView(props: ToolsViewProps) {
  const {onCardAddClick} = props;

  return (
    <div className="ToolsView">
      <Button type="button" intent="primary" onClick={onCardAddClick}>Add Card</Button>
    </div>
  );
}
