import { useRef } from "react";

export function useOne<T extends {}>(create: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = create();
  }

  return ref.current;
}
