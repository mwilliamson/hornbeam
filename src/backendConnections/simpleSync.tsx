
import { useSimpleSync } from "simple-sync/lib/react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate, initialAppState } from "../app";
import { deserializeAppUpdate, serializeAppUpdate } from "../serialization";
import { BackendConnection, BackendConnectionProvider, BackendConnectionState } from ".";
import { AppUpdate, AppRequest } from "../app/snapshots";
import { useEffect, useRef } from "react";
import { Deferred, createDeferred } from "../util/promises";
import { AppQuery } from "./queries";
import { generateCardHistory } from "../app/cards";
import { cardsToTrees } from "../app/cardTrees";

interface ConnectSimpleSyncProps {
  children: (connectionState: BackendConnectionState) => React.ReactNode;
  uri: string;
}

export function ConnectSimpleSync(props: ConnectSimpleSyncProps) {
  const {children, uri} = props;

  const state = useSimpleSync({
    applyAppUpdate,
    initialAppState: initialAppState(),
    uri: uri,

    serializeAppUpdate,
    deserializeAppUpdate,
  });


  if (state.type === "connected") {
    return (
      <ConnectedSimpleSync
        appState={state.appState}
        sendAppUpdate={state.sendAppUpdate}
      >
        {children}
      </ConnectedSimpleSync>
    );
  } else {
    return children(state);
  }
}

interface ConnectedSimpleSyncProps {
  appState: AppState;
  children: (connectionState: BackendConnectionState) => React.ReactNode;
  sendAppUpdate: (update: AppUpdate) => void;
}

function ConnectedSimpleSync(props: ConnectedSimpleSyncProps) {
  const {appState, children, sendAppUpdate} = props;

  const query = appStateToQueryFunction(appState);
  const sendRequest = useCreateSendRequest(sendAppUpdate, appState.updateIds);

  // TODO: ensure connection doesn't change.
  const connection: BackendConnection = {
    appState,
    query,
    sendRequest,
  };

  return (
    <BackendConnectionProvider value={connection}>
      {children({
        type: "connected",
        connection,
      })}
    </BackendConnectionProvider>
  );
}

// TODO: extract to common module?
export function appStateToQueryFunction(appState: AppState) {
  // TODO: time travel
  const snapshot = appState.latestSnapshot();

  return async <R,>(query: AppQuery<R>): Promise<R> => {
    switch (query.type) {
      case "card": {
        return query.proof(snapshot.findCardById(query.cardId));
      }
      case "parentCard": {
        const card = snapshot.findCardById(query.cardId);
        if (card === null || card.parentCardId === null) {
          return query.proof(null);
        }

        return query.proof(snapshot.findCardById(card.parentCardId));
      }
      case "cardChildCount": {
        return query.proof(snapshot.countCardChildren(query.cardId));
      }
      case "cardHistory": {
        const card = snapshot.findCardById(query.cardId);
        const cardHistory = card === null ? [] : generateCardHistory(card, snapshot);
        return query.proof(cardHistory);
      }
      case "cardSearcher": {
        return query.proof({
          searchCards: async (query: string) => {
            return snapshot.searchCards(query);
          }
        });
      }
      case "boardCardTrees": {
        const cards = snapshot.allCards()
          .filter(card => query.cardStatuses.has(card.status));

        return query.proof(cardsToTrees(cards, query.subboardRootId));
      }
      case "parentBoard": {
        let cardId: string | null = query.subboardRootId;

        while (cardId !== null) {
          const card = snapshot.findCardById(cardId);
          if (card === null) {
            cardId = null;
          } else if (card.isSubboardRoot && cardId !== query.subboardRootId) {
            break;
          } else {
            cardId = card.parentCardId;
          }
        }

        return query.proof(cardId);
      }
      case "allCategories": {
        return query.proof(snapshot);
      }
      case "availableCategories": {
        return query.proof(snapshot.availableCategories());
      }
      case "allColors": {
        return query.proof(snapshot);
      }
    }
  };
}

function useCreateSendRequest(
  sendUpdate: (update: AppUpdate) => void,
  updateIds: ReadonlyArray<string>,
): (request: AppRequest) => Promise<void> {
  const pendingRef = useRef({
    requests: new Map<string, Deferred<void>>(),
    lastUpdateIndex: -1,
  });

  const sendRequestRef = useRef(async (request: AppRequest) => {
    const updateId = uuidv7();
    sendUpdate({
      updateId,
      request,
    });

    const deferred = createDeferred<void>();

    pendingRef.current.requests.set(updateId, deferred);

    return deferred.promise;
  });

  useEffect(() => {
    for (
      let updateIndex = pendingRef.current.lastUpdateIndex + 1;
      updateIndex < updateIds.length;
      updateIndex++
    ) {
      const updateId = updateIds[updateIndex];
      const pendingRequest = pendingRef.current.requests.get(updateId);
      if (pendingRequest !== undefined) {
        pendingRequest.resolve();
        pendingRef.current.requests.delete(updateId);
      }

      pendingRef.current.lastUpdateIndex = updateIndex;
    }
  }, [updateIds]);

  return sendRequestRef.current;
}
