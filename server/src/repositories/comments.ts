import { Instant } from "@js-joda/core";
import { Comment, CommentAddEffect } from "hornbeam-common/lib/app/comments";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { appEffects } from "hornbeam-common/lib/app/snapshots";

interface CardCommentQuery {
  cardId: string;
  projectId: string;
}

export interface CommentRepository {
  add: (effect: CommentAddEffect) => Promise<void>;
  fetchCardComments: (query: CardCommentQuery) => Promise<ReadonlyArray<Comment>>;
}

export class CommentRepositoryInMemory implements CommentRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(effect: CommentAddEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.commentAdd(effect));
  }

  async fetchCardComments(query: CardCommentQuery): Promise<ReadonlyArray<Comment>> {
    return this.snapshot.value
      .fetchProjectContents(query.projectId)
      .findCommentsByCardId(query.cardId);
  }
}

export class CommentRepositoryDatabase implements CommentRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(effect: CommentAddEffect): Promise<void> {
    await this.database.insertInto("comments")
      .values({
        cardId: effect.cardId,
        createdAt: new Date(effect.createdAt.toEpochMilli()),
        id: effect.id,
        text: effect.text,
      })
      .execute();
  }

  async fetchCardComments(query: CardCommentQuery): Promise<ReadonlyArray<Comment>> {
    const commentRows = await this.database.selectFrom("comments")
      .select(["comments.cardId", "comments.createdAt", "comments.id", "comments.text"])
      .innerJoin("cards", "cards.id", "comments.cardId")
      .orderBy("comments.createdAt")
      .where("comments.cardId", "=", query.cardId)
      .where("cards.projectId", "=", query.projectId)
      .execute();

    return commentRows.map(commentRow => ({
      cardId: commentRow.cardId,
      createdAt: Instant.ofEpochMilli(commentRow.createdAt.getTime()),
      id: commentRow.id,
      text: commentRow.text,
    }));
  }
}
