import { CardStatus } from "./cardStatuses";

export interface Lens {
  id: string;
  rule: LensRule;
}

export type LensRule =
  | {type: "exclude", condition: CardCondition}

export const defaultLens: Lens = {
  id: "018f06d4-8785-7d08-8bd7-058bb1f58274",
  rule: {
    type: "exclude",
    condition: {
      type: "status:notIn",
      statuses: [CardStatus.Deleted],
    },
  },
};

export type CardCondition =
  | {type: "status:notIn", statuses: ReadonlyArray<CardStatus | null>}
