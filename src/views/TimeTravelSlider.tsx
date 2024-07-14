import { useId } from "react";

import "./TimeTravelSlider.scss";
import Button from "./widgets/Button";

interface TimeTravelSliderProps {
  currentSnapshotIndex: number;
  maxSnapshotIndex: number;
  onCurrentSnapshotIndexChange: (snapshotIndex: number) => void;
  onTimeTravelStop: () => void;
}

export default function TimeTravelSlider(props: TimeTravelSliderProps) {
  const {currentSnapshotIndex, maxSnapshotIndex, onCurrentSnapshotIndexChange, onTimeTravelStop} = props;

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
          onChange={event => onCurrentSnapshotIndexChange(parseInt(event.target.value, 10))}
          value={currentSnapshotIndex}
          min={0}
          max={maxSnapshotIndex}
        />
      </div>

      <div>
        <Button type="button" intent="secondary" onClick={onTimeTravelStop}>
          Stop
        </Button>
      </div>
    </div>
  );
}
