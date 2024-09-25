import { Instant } from "@js-joda/core";
import { ProjectAddMutation } from "./projects";

const defaultProjectAddId = "0191bed4-0000-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testingProjectAddMutation(
  mutation: Partial<ProjectAddMutation>,
): ProjectAddMutation {
  return {
    createdAt: defaultCreatedAt,
    id: defaultProjectAddId,
    name: "<default test name>",
    ...mutation,
  };
}
