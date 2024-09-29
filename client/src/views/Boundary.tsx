import { useEffect, useRef, useState } from "react";

import { AppMutation } from "hornbeam-common/lib/app/snapshots";
import { useBackendConnection } from "../backendConnections";
import { AppQuery, AppQueries, AppQueriesResult } from "hornbeam-common/lib/queries";
import Spinner from "./widgets/Spinner";
import { isEqual } from "lodash";

type QueryState<TQueries extends AppQueries> =
  | {type: "idle"}
  | {type: "loading", id: number, queries: unknown}
  | {type: "error", error: unknown, queries: unknown}
  | {type: "success", value: AppQueriesResult<TQueries>, queries: unknown};

interface BoundaryProps<TQueries extends AppQueries> {
  queries: TQueries,
  render: (
    queryData: AppQueriesResult<TQueries>,
    mutate: (mutation: AppMutation) => Promise<void>,
    query: <R>(query: AppQuery<R>) => Promise<R>,
  ) => React.ReactNode;
}

export default function Boundary<TQueries extends AppQueries>(props: BoundaryProps<TQueries>) {
  const {queries, render} = props;

  const stableQueries = useStable(queries);

  const backendConnection = useBackendConnection();

  const [queryState, setQueryState] = useState<QueryState<TQueries>>({type: "idle"});

  // TODO: indicate stale data
  // TODO: more efficient querying instead of clearing on `queries` change?
  // TODO: use single subscription instead of clearing on `queries` change
  useEffect(() => {
    const subscription = backendConnection.subscribeQueries(
      stableQueries,
      {
        onSuccess: result => {
          setQueryState({type: "success", queries: stableQueries, value: result});
        },
        onError: error => {
          setQueryState({type: "error", queries: stableQueries, error});
        },
      }
    );

    return () => {
      subscription.close();
    };
  }, [backendConnection, stableQueries]);

  switch (queryState.type) {
    case "idle":
    case "loading":
      return (
        <Spinner />
      );
    case "error":
      // TODO: handle error
      return (
        <p>Query error.</p>
      );
    case "success":
      return render(queryState.value, backendConnection.mutate, backendConnection.executeQuery);
  }
}

function useStable<T>(value: T): T {
  const ref = useRef<T>(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
