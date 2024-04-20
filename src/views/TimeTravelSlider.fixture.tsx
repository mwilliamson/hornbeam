import { useState } from "react";
import TimeTravelSlider from "./TimeTravelSlider";

export default {
  TwentySnapshots: () => {
    const [snapshotIndex, setSnapshotIndex] = useState(4);
    return (
      <TimeTravelSlider
        currentSnapshotIndex={snapshotIndex}
        maxSnapshotIndex={20}
        onCurrentSnapshotIndexChange={newSnapshotIndex => setSnapshotIndex(newSnapshotIndex)}
      />
    );
  },
};
