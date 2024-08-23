import { useEffect, useState } from "react";
import { TimeTravel, useBackendConnection } from "../backendConnections";

export function useTimeTravel(): TimeTravel | null {
  const backendConnection = useBackendConnection();
  const setBackendSnapshotIndex = backendConnection.setTimeTravelSnapshotIndex;
  const [snapshotIndex, setSnapshotIndex] = useState<number | null>(null);
  const [maxSnapshotIndex, setMaxSnapshotIndex] = useState(0);

  useEffect(() => {
    const subscription = backendConnection.subscribe({
      onConnect: ({snapshotIndex}) => {
        setMaxSnapshotIndex(snapshotIndex);
      },
      onUpdate: ({snapshotIndex}) => {
        setMaxSnapshotIndex(snapshotIndex);
      },
      onTimeTravel: (newSnapshotIndex) => {
        setSnapshotIndex(newSnapshotIndex);
      },
    });

    return () => {
      subscription.close();
    };
  }, [backendConnection]);

  if (setBackendSnapshotIndex === null) {
    return null;
  }

  return {
    maxSnapshotIndex,
    snapshotIndex,
    setSnapshotIndex: setBackendSnapshotIndex,
    start: () => {
      setBackendSnapshotIndex(maxSnapshotIndex);
    },
    stop: () => {
      setBackendSnapshotIndex(null);
    },

  };
}
