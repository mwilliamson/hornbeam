import { UserAddEffect, UserAuthDetails } from "hornbeam-common/lib/app/users";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { appEffects } from "hornbeam-common/lib/app/snapshots";

export interface UserRepository {
  add: (effect: UserAddEffect) => Promise<void>;
  fetchAuthDetailsByEmailAddress: (emailAddress: string) => Promise<UserAuthDetails | null>;
}

export class UserRepositoryInMemory implements UserRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  public async add(effect: UserAddEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.userAdd(effect));
  }

  public async fetchAuthDetailsByEmailAddress(emailAddress: string): Promise<UserAuthDetails | null> {
    return this.snapshot.value.fetchUserAuthDetailsByEmailAddress(emailAddress);
  }
}


export class UserRepositoryDatabase implements UserRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async add(effect: UserAddEffect): Promise<void> {
    await this.database.insertInto("users")
      .values({
        emailAddress: effect.emailAddress,
        id: effect.id,
        passwordHash: effect.passwordHash,
        passwordSalt: effect.passwordSalt,
      })
      .execute();
  }

  public async fetchAuthDetailsByEmailAddress(emailAddress: string): Promise<UserAuthDetails | null> {
    return await this.database.selectFrom("users")
      .select(["id", "passwordHash", "passwordSalt"])
      .where("emailAddress", "=", emailAddress)
      .executeTakeFirst() ?? null;
  }
}
