import { useEffect, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, AppUpdate, Card, CardAddRequest, CardEditRequest, Request, requests } from "../app";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";
import isInputEvent from "../util/isInputEvent";
import { Deferred, createDeferred } from "../app/util/promises";
import { keyBy } from "../util/maps";
import { ValidCardFormValues } from "./cards/CardForm";
import CardAddForm from "./cards/CardAddForm";
import CardEditForm from "./cards/CardEditForm";

interface ViewState {
  addingCard: boolean,
  selectedCardId: string | null;
  editCardId: string | null;
}

const initialViewState: ViewState = {
  addingCard: false,
  selectedCardId: null,
  editCardId: null,
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

  const handleCardAddClose = () => {
    setViewState({...viewState, addingCard: false});
  };

  const handleCardAdd = async (request: CardAddRequest) => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    await sendRequest(requests.cardAdd(request));
    handleCardAddClose();
  };

  const handleCardEditClose = () => {
    setViewState({...viewState, editCardId: null});
  };

  const handleCardEdit = async (request: CardEditRequest) => {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    await sendRequest(requests.cardEdit(request));
    handleCardEditClose();
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

  const categoriesById = keyBy(state.allCategories(), category => category.id);

  return (
    <div className="AppView">
      <div className="AppView-Cards">
        <CardsView
          cards={state.cards}
          cardSelectedId={viewState.selectedCardId}
          onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
          onCardEdit={(cardId) => setViewState({...viewState, editCardId: cardId})}
          categoriesById={categoriesById}
        />
      </div>
      <div className="AppView-Tools">
        <Sidebar
          appState={state}
          onCardAdd={handleCardAdd}
          onCardAddClick={handleCardAddClick}
          onCardAddClose={handleCardAddClose}
          onCardEdit={handleCardEdit}
          onCardEditClose={handleCardEditClose}
          viewState={viewState}
        />
      </div>
    </div>
  );
}

interface SidebarProps {
  appState: AppState;
  onCardAdd: (values: CardAddRequest) => Promise<void>;
  onCardAddClick: () => void;
  onCardAddClose: () => void;
  onCardEdit: (values: CardEditRequest) => Promise<void>;
  onCardEditClose: () => void;
  viewState: ViewState;
}

function Sidebar(props: SidebarProps) {
  const {
    appState,
    onCardAdd,
    onCardAddClick,
    onCardAddClose,
    onCardEdit,
    onCardEditClose,
    viewState,
  } = props;

  const editCard = viewState.editCardId === null
    ? null
    : appState.findCardById(viewState.editCardId);

  const handleCardAdd = async ({categoryId, text}: ValidCardFormValues) => {
    await onCardAdd({
      categoryId,
      id: generateId(),
      parentCardId: viewState.selectedCardId,
      text,
    });
  };

  const handleCardSave = async (card: Card, {categoryId, text}: ValidCardFormValues) => {
    await onCardEdit({
      categoryId,
      id: card.id,
      parentCardId: card.parentCardId,
      text,
    });
  };

  if (editCard !== null) {
    return (
      <CardEditForm
        availableCategories={appState.availableCategories()}
        allCards={appState}
        card={editCard}
        onClose={onCardEditClose}
        onCardSave={values => handleCardSave(editCard, values)}
      />
    );
  } else if (viewState.addingCard) {
    return (
      <CardAddForm
        availableCategories={appState.availableCategories()}
        allCards={appState}
        initialParentCardId={viewState.selectedCardId}
        onClose={onCardAddClose}
        onCardAdd={handleCardAdd}
      />
    );
  } else {
    return (
      <ToolsView onCardAddClick={onCardAddClick} />
    );
  }
}
