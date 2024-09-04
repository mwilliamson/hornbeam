import { AppSnapshot } from "hornbeam-common/lib/app/snapshots";

export class AppSnapshotRef {
  public value: AppSnapshot;

  constructor(initialValue: AppSnapshot) {
    this.value = initialValue;
  }

  public update(f: (value: AppSnapshot) => AppSnapshot): void {
    this.value = f(this.value);
  }
}
