import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

export function deserializer<T>(decoder: t.Decoder<unknown, T>): (value: unknown) => T {
  return value => deserialize(decoder, value);
}

export function deserialize<T>(decoder: t.Decoder<unknown, T>, value: unknown): T {
  const result = decoder.decode(value);
  if (isLeft(result)) {
    throw Error(
      `Failed to deserialize: ${PathReporter.report(result).join("\n")}`
    );
  } else {
    return result.right;
  }
}
