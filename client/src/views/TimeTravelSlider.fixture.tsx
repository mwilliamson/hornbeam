import { useState } from "react";
import TimeTravelSlider from "./TimeTravelSlider";
import { TimeTravel } from "../backendConnections";

export default {
  TwentySnapshots: () => {
    const [snapshotIndex, setSnapshotIndex] = useState(4);

    const timeTravel: TimeTravel = {
      snapshotIndex,
      maxSnapshotIndex: 20,
      setSnapshotIndex: newSnapshotIndex => setSnapshotIndex(newSnapshotIndex),
      start: () => console.log("Time travel start"),
      stop: () => console.log("Time travel stop"),
    };

    return (
      <TimeTravelSlider timeTravel={timeTravel} />
    );
  },
};
