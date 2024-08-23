import * as t2 from "../util/io-ts";
import { CardStatus } from "../app/cardStatuses";

export const SerializedCardStatus = t2.stringEnum(CardStatus, "CardStatus");
