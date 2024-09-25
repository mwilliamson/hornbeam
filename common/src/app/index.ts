import { AppSnapshot, AppUpdate, applyAppMutation, initialAppSnapshot } from "./snapshots";

export class AppState {
  public readonly updateIds: ReadonlyArray<string>;
  private readonly snapshots: ReadonlyArray<AppSnapshot>;

  public constructor(
    updateIds: ReadonlyArray<string>,
    snapshots: ReadonlyArray<AppSnapshot>,
  ) {
    this.updateIds = updateIds;
    this.snapshots = snapshots;
  }

  public addSnapshot(updateId: string, newSnapshot: AppSnapshot): AppState {
    return new AppState(
      [...this.updateIds, updateId],
      [...this.snapshots, newSnapshot],
    );
  }

  public latestSnapshot(): AppSnapshot {
    return this.snapshots[this.latestSnapshotIndex()];
  }

  public latestSnapshotIndex(): number {
    return this.snapshots.length - 1;
  }

  public snapshot(snapshotIndex: number): AppSnapshot {
    return this.snapshots[snapshotIndex];
  }
}

export function initialAppState(): AppState {
  return new AppState([], [initialAppSnapshot()]);
}

export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  const newSnapshot = applyAppMutation(state.latestSnapshot(), update.mutation);

  return state.addSnapshot(update.updateId, newSnapshot);
}
