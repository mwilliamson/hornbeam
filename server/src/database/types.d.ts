/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Card {
  categoryId: string;
  createdAt: Timestamp;
  id: string;
  index: number;
  number: number;
  parentCardId: string | null;
  text: string;
}

export interface Category {
  createdAt: Timestamp;
  id: string;
  index: number;
  name: string;
  presetColorId: string;
}

export interface DB {
  cards: Card;
  categories: Category;
}
