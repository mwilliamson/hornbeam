export enum CardStatus {
  Deleted = "deleted",
  Done = "done",
}

export const allCardStatuses: ReadonlyArray<CardStatus> = [
  CardStatus.Done,
  CardStatus.Deleted,
];
