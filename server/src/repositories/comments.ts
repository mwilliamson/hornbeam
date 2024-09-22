import { Instant } from "@js-joda/core";
import { Comment, CommentAddMutation } from "hornbeam-common/lib/app/comments";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";

export interface CommentRepository {
  add: (mutation: CommentAddMutation) => Promise<void>;
  fetchByCardId: (cardId: string) => Promise<ReadonlyArray<Comment>>;
}

export class CommentRepositoryInMemory implements CommentRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CommentAddMutation): Promise<void> {
    this.snapshot.update(snapshot => snapshot.commentAdd(mutation));
  }

  async fetchByCardId(cardId: string): Promise<ReadonlyArray<Comment>> {
    return this.snapshot.value.findCommentsByCardId(cardId);
  }
}

export class CommentRepositoryDatabase implements CommentRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(mutation: CommentAddMutation): Promise<void> {
    await this.database.insertInto("comments")
      .values({
        cardId: mutation.cardId,
        createdAt: new Date(mutation.createdAt.toEpochMilli()),
        id: mutation.id,
        text: mutation.text,
      })
      .execute();
  }

  async fetchByCardId(cardId: string): Promise<ReadonlyArray<Comment>> {
    const commentRows = await this.database.selectFrom("comments")
      .select(["cardId", "createdAt", "id", "text"])
      .orderBy("createdAt")
      .where("cardId", "=", cardId)
      .execute();

    return commentRows.map(commentRow => ({
      cardId: commentRow.cardId,
      createdAt: Instant.ofEpochMilli(commentRow.createdAt.getTime()),
      id: commentRow.id,
      text: commentRow.text,
    }));
  }
}
