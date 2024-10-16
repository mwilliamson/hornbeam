import { Instant } from "@js-joda/core";
import { UserAddEffect } from "./users";

const defaultUserAddId = "0191bed5-0000-7e56-a31e-999999999999";
const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

export function testingUserAddEffect(
  effect: Partial<UserAddEffect>,
): UserAddEffect {
  return {
    createdAt: defaultCreatedAt,
    emailAddress: "hello@example.com",
    id: defaultUserAddId,
    passwordHash: "<default password hash>",
    ...effect,
  };
}
