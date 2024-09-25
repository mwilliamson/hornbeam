import "disposablestack/auto";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { Database } from "../database";
import { createReusableTemporaryDatabase } from "../database/temporaryDatabases";
import { testDatabaseUrl } from "../settings";
import * as testing from "../testing";
import { AppSnapshotRef } from "./snapshotRef";
import { CardRepository, CardRepositoryDatabase, CardRepositoryInMemory } from "./cards";
import { CardHistoryFetcher } from "./cardHistory";
import { CommentRepository, CommentRepositoryDatabase, CommentRepositoryInMemory } from "./comments";
import { MutationLogRepository, MutationLogRepositoryDatabase, MutationLogRepositoryInMemory } from "./mutationLog";
import { ProjectRepository, ProjectRepositoryDatabase, ProjectRepositoryInMemory } from "./projects";

export interface RepositoryFixtures extends AsyncDisposable {
  cardHistoryFetcher: () => Promise<CardHistoryFetcher>;
  cardRepository: () => Promise<CardRepository>;
  categoryRepository: () => Promise<CategoryRepository>;
  commentRepository: () => Promise<CommentRepository>;
  mutationLogRepository: () => Promise<MutationLogRepository>;
  projectRepository: () => Promise<ProjectRepository>;
}

export function repositoryFixturesInMemory(): RepositoryFixtures {
  const snapshot = new AppSnapshotRef(initialAppSnapshot());

  return {
    cardHistoryFetcher: async () => {
      const cardRepository = new CardRepositoryInMemory(snapshot);
      const commentRepository = new CommentRepositoryInMemory(snapshot);
      return new CardHistoryFetcher(cardRepository, commentRepository);
    },
    cardRepository: async () => {
      return new CardRepositoryInMemory(snapshot);
    },
    categoryRepository: async () => {
      return new CategoryRepositoryInMemory(snapshot);
    },
    commentRepository: async () => {
      return new CommentRepositoryInMemory(snapshot);
    },
    mutationLogRepository: async () => {
      return new MutationLogRepositoryInMemory();
    },
    projectRepository: async () => {
      return new ProjectRepositoryInMemory(snapshot);
    },
    [Symbol.asyncDispose]: async () => {
    },
  };
}

const temporaryDatabase = createReusableTemporaryDatabase(testDatabaseUrl());
testing.use(temporaryDatabase);

export function repositoryFixturesDatabase(): RepositoryFixtures {
  let database: Promise<Database> | null = null;
  let disposed = false;

  async function getDatabase(): Promise<Database> {
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }

    if (database === null) {
      database = temporaryDatabase.getDatabase();
    }

    return database;
  }

  return {
    cardHistoryFetcher: async () => {
      const database = await getDatabase();
      const cardRepository = new CardRepositoryDatabase(database);
      const commentRepository = new CommentRepositoryDatabase(database);
      return new CardHistoryFetcher(cardRepository, commentRepository);
    },

    cardRepository: async () => {
      return new CardRepositoryDatabase(await getDatabase());
    },

    categoryRepository: async () => {
      return new CategoryRepositoryDatabase(await getDatabase());
    },

    commentRepository: async () => {
      return new CommentRepositoryDatabase(await getDatabase());
    },

    mutationLogRepository: async () => {
      return new MutationLogRepositoryDatabase(await getDatabase());
    },

    projectRepository: async () => {
      return new ProjectRepositoryDatabase(await getDatabase());
    },

    [Symbol.asyncDispose]: async () => {
      disposed = true;
      await temporaryDatabase.reset();
    },
  };
}
