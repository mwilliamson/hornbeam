import { mapValues } from "lodash";
import { AppRequest } from "../app/snapshots";
import { useBackendConnection } from "../backendConnections";
import { AppQuery, QueryResult } from "../backendConnections/queries";

interface BoundaryProps<Q extends {[k: string]: AppQuery<unknown>}> {
  queries: Q,
  render: (
    queryData: {[K in keyof Q]: QueryResult<Q[K]>},
    sendRequest: (update: AppRequest) => Promise<void>,
  ) => React.ReactNode;
}

export default function Boundary<Q extends {[k: string]: AppQuery<unknown>}>(props: BoundaryProps<Q>) {
  const {queries, render} = props;

  const backendConnection = useBackendConnection();

  // TODO: remove cast
  const queryData = mapValues(queries, query => backendConnection.query(query)) as {[K in keyof Q]: QueryResult<Q[K]>};

  return render(queryData, backendConnection.sendRequest);
}
