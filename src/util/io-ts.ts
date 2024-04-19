import { Instant } from "@js-joda/core";
import * as t from "io-ts";

export function withDefault<T extends t.Any>(
  type: T,
  defaultValue: t.TypeOf<T>,
): t.Type<t.TypeOf<T>, t.InputOf<T>> {
  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(defaultValue)})`,
    type.is,
    (input, context) => input === undefined
      ? t.success(defaultValue)
      : type.validate(input, context),
    type.encode,
  );
}

export const instant: t.Type<Instant, [number, number], Instant> = new t.Type(
  "Instant",
  (input: unknown): input is Instant => input instanceof Instant,
  (input, context) =>
    Array.isArray(input) &&
      input.length === 2 &&
      typeof input[0] === "number" &&
      typeof input[1] === "number"
      ? t.success(Instant.ofEpochSecond(input[0], input[1]))
      : t.failure(input, context),
  (value) => [value.epochSecond(), value.nano()],
);
