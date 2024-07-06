import { useEffect, useState } from "react";

import { AppRequest } from "../app/snapshots";
import { useBackendConnection } from "../backendConnections";
import { AppQuery, QueryResult } from "../backendConnections/queries";
import Spinner from "./widgets/Spinner";

let nextQueryLoadId = 1;

type QueryState<T> =
  | {type: "idle"}
  | {type: "loading", id: number}
  | {type: "error", error: unknown}
  | {type: "success", value: T};

interface BoundaryProps<Q extends {[k: string]: AppQuery<unknown>}> {
  queries: Q,
  render: (
    queryData: {[K in keyof Q]: QueryResult<Q[K]>},
    sendRequest: (update: AppRequest) => Promise<void>,
  ) => React.ReactNode;
}

export default function Boundary<Q extends {[k: string]: AppQuery<unknown>}>(props: BoundaryProps<Q>) {
  type QueryData = {[K in keyof Q]: QueryResult<Q[K]>};

  const {queries, render} = props;

  const backendConnection = useBackendConnection();

  const [queryState, setQueryState] = useState<QueryState<QueryData>>({type: "idle"});

  // TODO: more efficient querying instead of clearing on `queries` change?
  useEffect(() => {
    const id = nextQueryLoadId++;
    setQueryState({type: "loading", id});

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
              };
            } else {
              return queryState;
            }
          });
        }
      );
    }
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
      return render(queryState.value, backendConnection.sendRequest);
  }
}
