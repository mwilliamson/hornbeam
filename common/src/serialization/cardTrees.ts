import * as t from "io-ts";

import { SerializedCard } from "./cards";

export interface SerializedCardTree {
  readonly card: t.TypeOf<typeof SerializedCard>,
  readonly children: ReadonlyArray<SerializedCardTree>,
}

export interface SerializedCardTreeOutput {
  readonly card: t.OutputOf<typeof SerializedCard>,
  readonly children: ReadonlyArray<SerializedCardTreeOutput>,
}

export const SerializedCardTree: t.Type<SerializedCardTree, SerializedCardTreeOutput> = t.recursion(
  "SerializedCardTree",
  () => t.readonly(t.type({
    card: SerializedCard,
    children: t.readonlyArray(SerializedCardTree),
  }))
);
