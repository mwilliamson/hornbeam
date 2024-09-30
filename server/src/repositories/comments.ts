import { Instant } from "@js-joda/core";
import { Comment, CommentAddMutation } from "hornbeam-common/lib/app/comments";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";

interface CardCommentQuery {
  cardId: string;
  projectId: string;
}

export interface CommentRepository {
  add: (mutation: CommentAddMutation) => Promise<void>;
  fetchCardComments: (query: CardCommentQuery) => Promise<ReadonlyArray<Comment>>;
}

export class CommentRepositoryInMemory implements CommentRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CommentAddMutation): Promise<void> {
    this.snapshot.mutate({
      type: "commentAdd",
      commentAdd: mutation,
    });
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
