import { assertThat, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { testingUserAddEffect } from "hornbeam-common/lib/app/users.testing";
import { UserRepository } from "./users";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";

const USER_1_ID = "01922aa2-f6df-7507-9e6b-000000000001";
const USER_2_ID = "01922aa2-f6df-7507-9e6b-000000000002";

export function createUserRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  testRepository("user auth details cannot be fetched for unrecognised e-mail address", async (userRepository) => {
    await userRepository.add(testingUserAddEffect({
      emailAddress: "user1@example.com",
      id: USER_1_ID,
      passwordHash: "<password hash 1>",
      passwordSalt: "<password salt 1>",
    }));

    const authDetails = await userRepository.fetchAuthDetailsByEmailAddress("user2@example.com");

    assertThat(authDetails, equalTo(null));
  });

  testRepository("user auth details can be fetched by email address", async (userRepository) => {
    await userRepository.add(testingUserAddEffect({
      emailAddress: "user1@example.com",
      id: USER_1_ID,
      passwordHash: "<password hash 1>",
      passwordSalt: "<password salt 1>",
    }));

    await userRepository.add(testingUserAddEffect({
      emailAddress: "user2@example.com",
      id: USER_2_ID,
      passwordHash: "<password hash 2>",
      passwordSalt: "<password salt 2>",
    }));

    const authDetails = await userRepository.fetchAuthDetailsByEmailAddress("user2@example.com");

    assertThat(authDetails, hasProperties({
      id: USER_2_ID,
      passwordHash: "<password hash 2>",
      passwordSalt: "<password salt 2>",
    }));
  });

  function testRepository(name: string, f: (users: UserRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      await f(await fixtures.userRepository());
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createUserRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createUserRepositoryTests(repositoryFixturesDatabase);
  });
});
