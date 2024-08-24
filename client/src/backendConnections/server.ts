import { AppQuery, AppQueries, AppQueriesResult } from "hornbeam-common/lib/queries";
import { deserializeAllCategoriesResponse, deserializeAllColorsResponse, deserializeBoardCardTreesResponse, deserializeCardChildCountResponse, deserializeCardResponse, deserializeParentCardResponse, serializeServerQuery, ServerQuery } from "hornbeam-common/lib/serialization/serverQueries";
import { BackendConnection, BackendSubscriptions } from ".";
import { CategorySet, CategorySetInMemory } from "hornbeam-common/lib/app/categories";
import { ColorSetInMemory, PresetColor } from "hornbeam-common/lib/app/colors";
import { AppRequest, AppUpdate } from "hornbeam-common/lib/app/snapshots";
import { serializeAppUpdate } from "hornbeam-common/lib/serialization/app";
import { uuidv7 } from "uuidv7";
import { asyncMapValues } from "hornbeam-common/lib/util/promises";

export function connectServer(uri: string): BackendConnection {
  const executeQuery = async <R,>(query: AppQuery<R>): Promise<R> => {
    switch (query.type) {
      case "card": {
        const response = await fetchQuery({
          type: "card",
          cardId: query.cardId,
        });

        return query.proof(deserializeCardResponse(response));
      }

      case "parentCard": {
        const response = await fetchQuery({
          type: "parentCard",
          cardId: query.cardId,
        });

        return query.proof(deserializeParentCardResponse(response));
      }

      case "cardChildCount": {
        const response = await fetchQuery({
          type: "cardChildCount",
          cardId: query.cardId,
        });

        return query.proof(deserializeCardChildCountResponse(response));
      }

      case "boardCardTrees": {
        const response = await fetchQuery({
          type: "boardCardTrees",
          boardId: query.boardId,
          cardStatuses: Array.from(query.cardStatuses),
        });

        return query.proof(deserializeBoardCardTreesResponse(response));
      }

      case "allCategories": {
        return query.proof(await fetchAllCategories());
      }

      case "availableCategories": {
        const allCategories = await fetchAllCategories();
        return query.proof(allCategories.availableCategories());
      }

      case "allColors": {
        const response = await fetchQuery({
          type: "allColors",
        });

        const presetColors = deserializeAllColorsResponse(response)
          .map(presetColor => new PresetColor(presetColor));

        return query.proof(new ColorSetInMemory(presetColors));
      }

      default:
        console.error(`missing support for query: ${query.type}`);
        throw new Error("not supported");
    }
  };

  async function queryMany<TQueries extends AppQueries>(queries: TQueries): Promise<AppQueriesResult<TQueries>> {
    return asyncMapValues(
      queries,
      query => executeQuery(query),
    ) as AppQueriesResult<TQueries>;
  }

  const fetchAllCategories = async (): Promise<CategorySet> => {
    const response = await fetchQuery({
      type: "allCategories",
    });

    const allCategories = deserializeAllCategoriesResponse(response);

    return new CategorySetInMemory(allCategories);
  };

  const fetchQuery = async (query: ServerQuery) => {
    return fetchJson("query", {query: serializeServerQuery(query)});
  };

  const sendRequest = async (request: AppRequest): Promise<void> => {
    // TODO: also update data (send active queries as part of request?)

    const updateId = uuidv7();

    const update: AppUpdate = {
      request,
      updateId,
    };

    await fetchJson("update", {update: serializeAppUpdate(update)});

    // TODO: actually subscribe to server
    subscriptions.onLastUpdate({
      updateId: null,
      snapshotIndex: 0,
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

  const subscriptions = new BackendSubscriptions();
  // TODO: get real last update ID
  subscriptions.onLastUpdate({
    updateId: null,
    snapshotIndex: 0,
  });

  return {
    close: () => {},
    query: executeQuery,
    queryMany,
    sendRequest,
    subscribe: subscriptions.subscribe,
    setTimeTravelSnapshotIndex: null,
  };
}
