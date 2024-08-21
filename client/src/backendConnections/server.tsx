import { AppQuery } from "hornbeam-common/src/queries";
import { deserializeAllCategoriesResponse, deserializeAllColorsResponse, deserializeBoardCardTreesResponse, deserializeCardChildCountResponse, deserializeCardResponse, deserializeParentCardResponse, serializeServerQuery, ServerQuery } from "hornbeam-common/src/serialization/serverQueries";
import { BackendConnection, BackendConnectionProvider } from ".";
import { CategorySetInMemory } from "hornbeam-common/src/app/categories";
import { ColorSetInMemory, PresetColor } from "hornbeam-common/src/app/colors";
import { useRef } from "react";

interface ConnectServerProps {
  children: (connectionState: BackendConnection) => React.ReactNode;
  uri: string;
}

export function ConnectServer(props: ConnectServerProps) {
  const {children, uri} = props;

  const connectionRef = useRef<BackendConnection | null>(null);

  if (connectionRef.current === null) {
    connectionRef.current = createConnection(uri);
  }

  return (
    <BackendConnectionProvider value={connectionRef.current}>
      {children(connectionRef.current)}
    </BackendConnectionProvider>
  );
}

function createConnection(uri: string): BackendConnection {
  const query = async <R,>(query: AppQuery<R>): Promise<R> => {
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
        const response = await fetchQuery({
          type: "allCategories",
        });

        const allCategories = deserializeAllCategoriesResponse(response);

        return query.proof(new CategorySetInMemory(allCategories));
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

  const fetchQuery = async (query: ServerQuery) => {
    const response = await fetch(uri + "query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: serializeServerQuery(query),
      }),
    });

    // TODO: check status code

    return response.json();
  };

  const sendRequest = () => {
    // TODO: refresh data after sending request.
    throw new Error("sending requests not supported");
  };

  return {
    query,
    sendRequest,
    lastUpdateId: null,
    timeTravel: null,
  };
}
