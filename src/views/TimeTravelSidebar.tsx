import Button from "./widgets/Button";
import ControlGroup from "./widgets/ControlGroup";

interface TimeTravelSidebarProps {
  onTimeTravelStop: () => void;
  timeTravelSnapshotIndex: number;
}

export default function TimeTravelSidebar(props: TimeTravelSidebarProps) {
  const {onTimeTravelStop} = props;

  return (
    <div className="m-md">
      <h2>Time travel</h2>

      <ControlGroup>
        <Button intent="secondary" type="button" onClick={onTimeTravelStop}>
          Stop time travel
        </Button>
      </ControlGroup>
    </div>
  );
}
