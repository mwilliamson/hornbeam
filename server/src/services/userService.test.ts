import { test } from "mocha";
import { assertThat, equalTo } from "@mwilliamson/precisely";
import { repositoryFixturesInMemory } from "../repositories/fixtures";
import { fileSuite } from "../testing";
import { UserService } from "./userService";

fileSuite(__filename, () => {
  testService("when user with e-mail address does not exist then user cannot be found", async (userService) => {
    await userService.add({
      emailAddress: "user1@example.com",
      password: "password1",
    });

    const authenticatedUserId = await userService.authenticate({
      emailAddress: "user2@example.com",
      password: "password1",
    });

    assertThat(authenticatedUserId, equalTo(null));
  });

  testService("when password is wrong then user cannot be found", async (userService) => {
    await userService.add({
      emailAddress: "user1@example.com",
      password: "password1",
    });

    const authenticatedUserId = await userService.authenticate({
      emailAddress: "user1@example.com",
      password: "password2",
    });

    assertThat(authenticatedUserId, equalTo(null));
  });

  testService("when credentials are correct then user can be found", async (userService) => {
    const userAddEffect1 = await userService.add({
      emailAddress: "user1@example.com",
      password: "password1",
    });
    await userService.add({
      emailAddress: "user2@example.com",
      password: "password2",
    });

    const authenticatedUserId = await userService.authenticate({
      emailAddress: "user1@example.com",
      password: "password1",
    });

    assertThat(authenticatedUserId, equalTo(userAddEffect1.id));
  });
});

function testService(name: string, f: (userService: UserService) => Promise<void>) {
  test(name, async () => {
    const fixtures = repositoryFixturesInMemory();
    await f(new UserService(await fixtures.userRepository()));
  });
}
