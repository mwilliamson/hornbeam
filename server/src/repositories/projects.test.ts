import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { testingProjectAddMutation } from "hornbeam-common/lib/app/projects.testing";
import { ProjectRepository } from "./projects";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";

const PROJECT_1_ID = "01922aa2-f6df-7507-9e6b-000000000001";
const PROJECT_2_ID = "01922aa2-f6df-7507-9e6b-000000000002";

export function createProjectRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchAll()", () => {
    testRepository("no projects", async (repository) => {
      const projects = await repository.fetchAll();

      assertThat(projects, containsExactly());
    });

    testRepository("can fetch projects after they're added", async (repository) => {
      await repository.add(testingProjectAddMutation({
        id: PROJECT_1_ID,
        name: "<project 1 name>",
      }));

      await repository.add(testingProjectAddMutation({
        id: PROJECT_2_ID,
        name: "<project 2 name>",
      }));

      const projects = await repository.fetchAll();

      assertThat(projects, containsExactly(
        hasProperties({
          id: PROJECT_1_ID,
          name: "<project 1 name>",
        }),
        hasProperties({
          id: PROJECT_2_ID,
          name: "<project 2 name>",
        }),
      ));
    });
  });

  function testRepository(name: string, f: (projects: ProjectRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      await f(await fixtures.projectRepository());
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createProjectRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createProjectRepositoryTests(repositoryFixturesDatabase);
  });
});
