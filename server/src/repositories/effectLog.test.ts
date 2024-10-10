import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { testingAppEffect } from "hornbeam-common/lib/app/snapshots.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { EffectLogRepository } from "./effectLog";

const EFFECT_1_ID = "01921a31-0000-70e2-bb5d-000000000001";
const EFFECT_2_ID = "01921a31-0000-70e2-bb5d-000000000002";

export function createEffectLogRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  testRepository("adding effect returns index", async (repository) => {
    const effect1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    const index1 = await repository.add(EFFECT_1_ID, effect1);
    const effect2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    const index2 = await repository.add(EFFECT_2_ID, effect2);

    assertThat(index1, equalTo(1));
    assertThat(index2, equalTo(2));
  });

  testRepository("latest index is zero when there are no effects", async (repository) => {
    const latestIndex = await repository.fetchLatestIndex();

    assertThat(latestIndex, equalTo(0));
  });

  testRepository("latest index is index of last added effect", async (repository) => {
    const effect1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    await repository.add(EFFECT_1_ID, effect1);
    const effect2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    await repository.add(EFFECT_2_ID, effect2);

    const latestIndex = await repository.fetchLatestIndex();

    assertThat(latestIndex, equalTo(2));
  });

  testRepository("can fetch effects after they're added", async (repository) => {
    const effect1 = testingAppEffect.cardAdd({
      text: "<card 1>",
    });
    await repository.add(EFFECT_1_ID, effect1);
    const effect2 = testingAppEffect.cardAdd({
      text: "<card 2>",
    });
    await repository.add(EFFECT_2_ID, effect2);

    const loggedEffects = await repository.fetchAll();

    assertThat(loggedEffects, containsExactly(
      hasProperties({
        id: EFFECT_1_ID,
        effect: deepEqualTo(effect1),
      }),
      hasProperties({
        id: EFFECT_2_ID,
        effect: deepEqualTo(effect2),
      }),
    ));
  });

  function testRepository(name: string, f: (categories: EffectLogRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      await f(await fixtures.effectLogRepository());
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createEffectLogRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createEffectLogRepositoryTests(repositoryFixturesDatabase);
  });
});
