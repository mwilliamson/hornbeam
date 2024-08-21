import { useEffect, useState } from "react";

import { AppRequest } from "hornbeam-common/src/app/snapshots";
import { useBackendConnection } from "../backendConnections";
import { AppQuery, QueryResult } from "hornbeam-common/src/queries";
import Spinner from "./widgets/Spinner";
import { isEqual } from "lodash";

let nextQueryLoadId = 1;

type QueryState<T> =
  | {type: "idle"}
  | {type: "loading", id: number, lastUpdateId: string | null, queries: unknown}
  | {type: "error", error: unknown, lastUpdateId: string | null, queries: unknown}
  | {type: "success", value: T, lastUpdateId: string | null, queries: unknown};

interface BoundaryProps<Q extends {[k: string]: AppQuery<unknown>}> {
  queries: Q,
  render: (
    queryData: {[K in keyof Q]: QueryResult<Q[K]>},
    sendRequest: (update: AppRequest) => Promise<void>,
    query: <R>(query: AppQuery<R>) => Promise<R>,
  ) => React.ReactNode;
}

export default function Boundary<Q extends {[k: string]: AppQuery<unknown>}>(props: BoundaryProps<Q>) {
  type QueryData = {[K in keyof Q]: QueryResult<Q[K]>};

  const {queries, render} = props;

  const backendConnection = useBackendConnection();

  const [queryState, setQueryState] = useState<QueryState<QueryData>>({type: "idle"});

  // TODO: more efficient querying instead of clearing on `queries` change?
  useEffect(() => {
    setQueryState(queryState => {
      if (
        queryState.type !== "idle" &&
        queryState.lastUpdateId === backendConnection.lastUpdateId &&
        isEqual(queries, queryState.queries)
      ) {
        return queryState;
      }

      const id = nextQueryLoadId++;

      const partialQueryData: {[k: string]: unknown} = {};

      let completedQueryCount = 0;

      const queryEntries = Object.entries(queries);
      const queryCount = queryEntries.length;

      for (const [key, query] of queryEntries) {
        const promise = backendConnection.query(query);

        promise.then(
          value => {
            partialQueryData[key] = value;
            completedQueryCount++;
            if (completedQueryCount === queryCount) {
              setQueryState(queryState => {
                if (queryState.type === "loading" && queryState.id === id) {
                  return {
                    type: "success",
                    value: partialQueryData as QueryData,
                    lastUpdateId: backendConnection.lastUpdateId,
                    queries,
                  };
                } else {
                  return queryState;
                }
              });
            }
          },
          error => {
            setQueryState(queryState => {
              if (queryState.type === "loading" && queryState.id === id) {
                return {
                  type: "error",
                  error,
                  lastUpdateId: backendConnection.lastUpdateId,
                  queries,
                };
              } else {
                return queryState;
              }
            });
          }
        );
      }

      return {
        type: "loading",
        id,
        lastUpdateId: backendConnection.lastUpdateId,
        queries,
      };
    });
  }, [backendConnection, queries]);

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
