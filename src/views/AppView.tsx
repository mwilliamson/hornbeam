import { useEffect, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, AppUpdate, Request, requests } from "../app";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";
import CardAddModal from "./CardAddModal";
import isInputEvent from "../util/isInputEvent";
import { Deferred, createDeferred } from "../app/util/promises";

interface ViewState {
  addingCard: boolean,
  selectedCardId: string | null;
}

const initialViewState: ViewState = {
  addingCard: false,
  selectedCardId: null,
};

interface AppViewProps {
  sendUpdate: (update: AppUpdate) => void;
  state: AppState;
}

function useSendRequest(
  sendUpdate: (update: AppUpdate) => void,
  state: AppState,
): (request: Request) => Promise<void> {
  const pendingRef = useRef({
    requests: new Map<string, Deferred<void>>(),
    lastUpdateIndex: -1,
  });

  const sendRequestRef = useRef(async (request: Request) => {
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
      updateIndex < state.updateIds.length;
      updateIndex++
    ) {
      const updateId = state.updateIds[updateIndex];
      const pendingRequest = pendingRef.current.requests.get(updateId);
      if (pendingRequest !== undefined) {
        pendingRequest.resolve();
        pendingRef.current.requests.delete(updateId);
      }

      pendingRef.current.lastUpdateIndex = updateIndex;
    }
  }, [state.updateIds]);

  return sendRequestRef.current;
}

export default function AppView(props: AppViewProps) {
  const {sendUpdate, state} = props;

  const [viewState, setViewState] = useState(initialViewState);

  const sendRequest = useSendRequest(sendUpdate, state);

  // TODO: separate button for adding a child card?
  const handleCardAddClick = () => {
    setViewState({...viewState, addingCard: true});
  };

  const handleCardAddModalClose = () => {
    setViewState({...viewState, addingCard: false});
  };

  const handleCardAdd = async (text: string) => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    await sendRequest(requests.cardAdd({
      id: generateId(),
      parentCardId: viewState.selectedCardId,
      text,
    }));
    handleCardAddModalClose();
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // TODO: use proper selection of the cards and put the event on the cards?
      if (isInputEvent(event)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (viewState.selectedCardId !== null) {
          // TODO: wait
          sendRequest(requests.cardDelete({id: viewState.selectedCardId}));
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewState.selectedCardId, sendRequest]);

  return (
    <div className="AppView">
      <div className="AppView-Tools">
        <ToolsView onCardAddClick={handleCardAddClick} />
      </div>
      <div className="AppView-Cards">
        <CardsView
          cards={state.cards}
          cardSelectedId={viewState.selectedCardId}
          onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
        />
      </div>
      {viewState.addingCard && (
        <CardAddModal
          onClose={handleCardAddModalClose}
          onCardAdd={handleCardAdd}
          parent={
            viewState.selectedCardId === null
              ? null
              : state.findCardById(viewState.selectedCardId)
          }
        />
      )}
    </div>
  );
}
