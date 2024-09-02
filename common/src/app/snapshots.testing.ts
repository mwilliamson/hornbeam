import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { CardAddRequest, CardEditRequest } from "./cards";
import { AppRequest, requests } from "./snapshots";
import { CategoryAddRequest } from "./categories";
import { presetColorWhite } from "./colors";
import { CommentAddRequest } from "./comments";

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export const testRequests = {
  cardAdd: (request: Partial<CardAddRequest>): AppRequest => {
    return requests.cardAdd({
      categoryId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      parentCardId: null,
      text: "<default test text>",
      ...request,
    });
  },
  cardEdit: (request: Partial<CardEditRequest>): AppRequest => {
    return requests.cardEdit({
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      ...request,
    });
  },

  categoryAdd: (request: Partial<CategoryAddRequest>): AppRequest => {
    return requests.categoryAdd({
      color: {presetColorId: presetColorWhite.id},
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      name: "<default test name>",
      ...request,
    });
  },

  commentAdd: (request: Partial<CommentAddRequest>): AppRequest => {
    return requests.commentAdd({
      cardId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      text: "<default test text>",
      ...request,
    });
  },
};
