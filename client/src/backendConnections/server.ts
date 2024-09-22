import { AppQuery, AppQueries, AppQueriesResult } from "hornbeam-common/lib/queries";
import { deserializeAllCategoriesResponse, deserializeAllColorsResponse, deserializeBoardCardTreesResponse, deserializeCardChildCountResponse, deserializeCardHistoryResponse, deserializeCardResponse, deserializeParentBoardResponse, deserializeParentCardResponse, deserializeSearchCardsResponse, ServerQuery } from "hornbeam-common/lib/serialization/serverQueries";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";
import { BackendConnection, BackendSubscriptions } from ".";
import { CategorySet, CategorySetInMemory } from "hornbeam-common/lib/app/categories";
import { ColorSetInMemory, PresetColor } from "hornbeam-common/lib/app/colors";
import { AppUpdate, ProjectContentsMutation } from "hornbeam-common/lib/app/snapshots";
import { QueryRequestBody, UpdateRequestBody, UpdateResponseBody } from "hornbeam-common/lib/serialization/serverApi";
import { uuidv7 } from "uuidv7";
import { assertNever } from "hornbeam-common/lib/util/assertNever";

export function connectServer(uri: string): BackendConnection {
  const queriesSerialization = <R,>(query: AppQuery<R>): [ServerQuery, (response: unknown) => R] => {
    switch (query.type) {
      case "card": {
        const serverQuery: ServerQuery = {
          type: "card",
          cardId: query.cardId,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeCardResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "parentCard": {
        const serverQuery: ServerQuery = {
          type: "parentCard",
          cardId: query.cardId,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeParentCardResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "cardChildCount": {
        const serverQuery: ServerQuery = {
          type: "cardChildCount",
          cardId: query.cardId,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeCardChildCountResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "cardHistory": {
        const serverQuery: ServerQuery = {
          type: "cardHistory",
          cardId: query.cardId,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeCardHistoryResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "searchCards": {
        const serverQuery: ServerQuery = {
          type: "searchCards",
          searchTerm: query.searchTerm,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeSearchCardsResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "boardCardTrees": {
        const serverQuery: ServerQuery = {
          type: "boardCardTrees",
          boardId: query.boardId,
          cardStatuses: Array.from(query.cardStatuses),
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeBoardCardTreesResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "parentBoard": {
        const serverQuery: ServerQuery = {
          type: "parentBoard",
          boardId: query.boardId,
        };

        const deserialize = (response: unknown) => {
          return query.proof(deserializeParentBoardResponse(response));
        };

        return [serverQuery, deserialize];
      }

      case "allCategories": {
        const [serverQuery, deserializeAllCategories] = allCategoriesSerialization();

        const deserialize = (response: unknown) => {
          return query.proof(deserializeAllCategories(response));
        };

        return [serverQuery, deserialize];
      }

      case "availableCategories": {
        const [serverQuery, deserializeAllCategories] = allCategoriesSerialization();

        const deserialize = (response: unknown) => {
          return query.proof(deserializeAllCategories(response).allCategories());
        };

        return [serverQuery, deserialize];
      }

      case "allColors": {
        const serverQuery: ServerQuery = {
          type: "allColors",
        };

        const deserialize = (response: unknown) => {
          const presetColors = deserializeAllColorsResponse(response)
            .map(presetColor => new PresetColor(presetColor));

          return query.proof(new ColorSetInMemory(presetColors));
        };

        return [serverQuery, deserialize];
      }

      default:
        return assertNever(query);
    }
  };

  const allCategoriesSerialization = (): [ServerQuery, (response: unknown) => CategorySet] => {
    const serverQuery: ServerQuery = {
      type: "allCategories",
    };

    const deserialize = (response: unknown) => {
      const allCategories = deserializeAllCategoriesResponse(response);
      return new CategorySetInMemory(allCategories);
    };

    return [serverQuery, deserialize];
  };

  async function executeQueries<TQueries extends AppQueries>(queries: TQueries): Promise<AppQueriesResult<TQueries>> {
    const serverQueries: Array<ServerQuery> = [];
    const responseDeserializers: Array<[string, (response: unknown) => unknown]> = [];

    for (const [key, query] of Object.entries(queries)) {
      if (query !== null) {
        const [serverQuery, deserializeResponse] = queriesSerialization(query);

        serverQueries.push(serverQuery);
        responseDeserializers.push([key, deserializeResponse]);
      }
    }

    const response: ReadonlyArray<unknown> = await fetchQueries(serverQueries);
    const queriesResult: {[k: string]: unknown} = {};

    let serverQueryIndex = 0;
    for (const[key, query] of Object.entries(queries)) {
      if (query === null) {
        queriesResult[key] = null;
      } else {
        const queryResponse = response[serverQueryIndex];
        const [key, deserializeResponse] = responseDeserializers[serverQueryIndex];
        queriesResult[key] = deserializeResponse(queryResponse);
        serverQueryIndex++;
      }
    }

    return queriesResult as AppQueriesResult<TQueries>;
  }

  const fetchQueries = async (queries: Array<ServerQuery>) => {
    return fetchJson("query", QueryRequestBody.encode({
      queries,
    }));
  };

  const mutate = async (mutation: ProjectContentsMutation): Promise<void> => {
    // TODO: send active queries as part of request?

    const updateId = uuidv7();

    const update: AppUpdate = {
      mutation,
      updateId,
    };

    const response = await fetchJson("update", UpdateRequestBody.encode({update}));

    const {snapshotIndex} = deserialize(UpdateResponseBody, response);

    await subscriptions.onLastUpdate({
      snapshotIndex,
    });
  };

  const fetchJson = async (path: string, body: unknown) => {
    const response = await fetch(uri + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 200) {
      throw new Error(`Unexpected status code from server: ${response.status}`);
    }

    return response.json();
  };

  const executeQuery = async <R>(query: AppQuery<R>): Promise<R> => {
    return (await executeQueries({query})).query;
  };

  const subscriptions = new BackendSubscriptions(executeQueries);
  // TODO: get real snapshot index
  subscriptions.onLastUpdate({
    snapshotIndex: 0,
  });

  return {
    close: () => {},
    executeQuery,
    executeQueries,
    mutate,
    subscribeStatus: subscriptions.subscribeConnectionStatus,
    subscribeQueries: subscriptions.subscribeQueries,
    subscribeTimeTravel: subscriptions.subscribeTimeTravel,
    setTimeTravelSnapshotIndex: null,
  };
}
