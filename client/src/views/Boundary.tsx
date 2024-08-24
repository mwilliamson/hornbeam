import { useEffect, useState } from "react";

import { AppRequest } from "hornbeam-common/lib/app/snapshots";
import { useBackendConnection } from "../backendConnections";
import { AppQuery, AppQueries, AppQueriesResult, AppQueryResult } from "hornbeam-common/lib/queries";
import Spinner from "./widgets/Spinner";
import { isEqual } from "lodash";

let nextQueryLoadId = 1;

type QueryState<TQueries extends AppQueries> =
  | {type: "idle"}
  | {type: "loading", id: number, queries: unknown}
  | {type: "error", error: unknown, queries: unknown}
  | {type: "success", value: AppQueriesResult<TQueries>, queries: unknown};


interface BoundaryProps<TQueries extends AppQueries> {
  queries: TQueries,
  render: (
    queryData: AppQueriesResult<TQueries>,
    sendRequest: (update: AppRequest) => Promise<void>,
    query: <R>(query: AppQuery<R>) => Promise<R>,
  ) => React.ReactNode;
}

export default function Boundary<TQueries extends AppQueries>(props: BoundaryProps<TQueries>) {
  const {queries, render} = props;

  const backendConnection = useBackendConnection();

  const [queryState, setQueryState] = useState<QueryState<TQueries>>({type: "idle"});
  const [pendingLoad, setPendingLoad] = useState(false);

  // TODO: indicate stale data
  // TODO: more efficient querying instead of clearing on `queries` change?
  // TODO: use single subscription instead of clearing on `queries` change
  useEffect(() => {
    const subscription = backendConnection.subscribe({
      onConnect: () => {
        setPendingLoad(true);
      },
      onUpdate: () => {
        setPendingLoad(true);
      },
      onTimeTravel: () => {
        setPendingLoad(true);
      },
      onConnectionError: () => {},
      onSyncError: () => {},
    });

    return () => {
      subscription.close();
    };
  }, [backendConnection]);

  useEffect(() => {
    if (
      queryState.type !== "idle" &&
      !pendingLoad &&
      isEqual(queries, queryState.queries)
    ) {
      return;
    }

    const id = nextQueryLoadId++;

    asyncMapValues<TQueries, AppQueriesResult<TQueries>>(
      queries,
      async <K extends keyof TQueries>(query: TQueries[K]) =>
        (await backendConnection.query(query)) as AppQueryResult<TQueries[K]>,
    ).then(
      result => {
        setQueryState(queryState => {
          if (queryState.type === "loading" && queryState.id === id) {
            return {
              type: "success",
              value: result,
              queries,
            };
          } else {
            return queryState;
          }
        });
      },
      error => {
        setQueryState(queryState => {
          if (queryState.type === "loading" && queryState.id === id) {
            return {
              type: "error",
              error,
              queries,
            };
          } else {
            return queryState;
          }
        });
      }
    );

    setQueryState({
      type: "loading",
      id,
      queries,
    });
    setPendingLoad(false);
  }, [backendConnection, pendingLoad, queries, queryState]);

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
      return render(queryState.value, backendConnection.sendRequest, backendConnection.query);
  }
}

async function asyncMapValues<TObj extends object, TResult extends {[key in keyof TObj]: unknown}>(
  obj: TObj,
  f: <K extends keyof TObj>(value: TObj[K]) => Promise<TResult[K]>,
): Promise<TResult> {
  const partialResult: Partial<TResult> = {};

  const entries = Object.entries(obj) as Array<[keyof TObj, TObj[keyof TObj]]>;
  const promises: Array<Promise<void>> = [];

  for (const [key, value] of entries) {
    promises.push(f(value).then(mappedValue => {
      partialResult[key] = mappedValue;
    }));
  }

  for (const promise of promises) {
    await promise;
  }

  return partialResult as TResult;
}
