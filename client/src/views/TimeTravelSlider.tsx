import { useId } from "react";

import { TimeTravel } from "../backendConnections";
import "./TimeTravelSlider.scss";
import Button from "./widgets/Button";

interface TimeTravelSliderProps {
  timeTravel: TimeTravel;
}

export default function TimeTravelSlider(props: TimeTravelSliderProps) {
  const {timeTravel} = props;

  const sliderId = useId();

  return (
    <div className="TimeTravelSlider">
      <label className="TimeTravelSlider-Label" htmlFor={sliderId}>
        Time travel
      </label>

      <div className="TimeTravelSlider-Slider">
        <input
          id={sliderId}
          type="range"
          onChange={event => timeTravel.setSnapshotIndex(parseInt(event.target.value, 10))}
          value={timeTravel.snapshotIndex ?? timeTravel.maxSnapshotIndex}
          min={0}
          max={timeTravel.maxSnapshotIndex}
        />
      </div>

      <div>
        <Button type="button" intent="secondary" onClick={() => timeTravel.stop()}>
          Stop
        </Button>
      </div>
    </div>
  );
}
