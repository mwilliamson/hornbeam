import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { testingAppEffect } from "hornbeam-common/lib/app/snapshots.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { MutationLogRepository } from "./mutationLog";

const MUTATION_1_ID = "01921a31-0000-70e2-bb5d-000000000001";
const MUTATION_2_ID = "01921a31-0000-70e2-bb5d-000000000002";

export function createMutationLogRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  testRepository("adding mutation returns index", async (repository) => {
    const mutation1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    const index1 = await repository.add(MUTATION_1_ID, mutation1);
    const mutation2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    const index2 = await repository.add(MUTATION_2_ID, mutation2);

    assertThat(index1, equalTo(1));
    assertThat(index2, equalTo(2));
  });

  testRepository("latest index is zero when there are no mutations", async (repository) => {
    const latestIndex = await repository.fetchLatestIndex();

    assertThat(latestIndex, equalTo(0));
  });

  testRepository("latest index is index of last added mutation", async (repository) => {
    const mutation1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    await repository.add(MUTATION_1_ID, mutation1);
    const mutation2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    await repository.add(MUTATION_2_ID, mutation2);

    const latestIndex = await repository.fetchLatestIndex();

    assertThat(latestIndex, equalTo(2));
  });

  testRepository("can fetch mutations after they're added", async (repository) => {
    const mutation1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    await repository.add(MUTATION_1_ID, mutation1);
    const mutation2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    await repository.add(MUTATION_2_ID, mutation2);

    const loggedMutations = await repository.fetchAll();

    assertThat(loggedMutations, containsExactly(
      hasProperties({
        id: MUTATION_1_ID,
        mutation: deepEqualTo(mutation1),
      }),
      hasProperties({
        id: MUTATION_2_ID,
        mutation: deepEqualTo(mutation2),
      }),
    ));
  });

  function testRepository(name: string, f: (categories: MutationLogRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      await f(await fixtures.mutationLogRepository());
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createMutationLogRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createMutationLogRepositoryTests(repositoryFixturesDatabase);
  });
});
