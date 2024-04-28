export enum CardStatus {
  Deleted = "deleted",
  Done = "done",
  None = "none",
}

export const allCardStatuses: ReadonlyArray<CardStatus> = [
  CardStatus.None,
  CardStatus.Done,
  CardStatus.Deleted,
];
