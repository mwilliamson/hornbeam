import { Instant } from "@js-joda/core";
import { useEffect, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, AppUpdate, Request, requests } from "../app";
import { CardStatus } from "../app/cardStatuses";
import { Card, CardAddRequest, CardEditRequest } from "../app/cards";
import { CommentAddRequest } from "../app/comments";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import isInputEvent from "../util/isInputEvent";
import { Deferred, createDeferred } from "../util/promises";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";
import CardAddForm from "./cards/CardAddForm";
import CardDetailView from "./cards/CardDetailView";
import CardEditForm from "./cards/CardEditForm";
import { ValidCardFormValues } from "./cards/CardForm";

interface ViewState {
  addingCard: Partial<CardAddRequest> | null,
  selectedCardId: string | null;
  editCardId: string | null;
}

const initialViewState: ViewState = {
  addingCard: null,
  selectedCardId: null,
  editCardId: null,
};

interface AppViewProps {
  sendUpdate: (update: AppUpdate) => void;
  appState: AppState;
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
  const {sendUpdate, appState} = props;

  const [viewState, setViewState] = useState(initialViewState);

  const sendRequest = useSendRequest(sendUpdate, appState);

  // TODO: separate button for adding a child card?
  const handleCardAddClick = (initialCardAddRequest: Partial<CardAddRequest>) => {
    setViewState({...viewState, addingCard: initialCardAddRequest});
  };

  const handleCardAddClose = () => {
    setViewState({...viewState, addingCard: null});
  };

  const handleCardAdd = async (request: CardAddRequest) => {
    await sendRequest(requests.cardAdd(request));
    handleCardAddClose();
  };

  const handleCardEditClose = () => {
    setViewState({...viewState, editCardId: null});
  };

  const handleCardEdit = async (request: CardEditRequest) => {
    await sendRequest(requests.cardEdit(request));
    handleCardEditClose();
  };

  const handleCardSave = async (request: CardEditRequest) => {
    await sendRequest(requests.cardEdit(request));
  };

  const handleCommentAdd = async (request: CommentAddRequest) => {
    await sendRequest(requests.commentAdd(request));
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
          sendRequest(requests.cardEdit({
            id: viewState.selectedCardId,
            status: CardStatus.Deleted,
          }));
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
      <div className="AppView-Cards">
        <CardsView
          appState={appState}
          cards={appState.cards.filter(card => card.status !== CardStatus.Deleted)}
          cardSelectedId={viewState.selectedCardId}
          onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
          onCardEdit={(cardId) => setViewState({...viewState, editCardId: cardId})}
          onCardAddChildClick={(cardId) => handleCardAddClick({parentCardId: cardId})}
        />
      </div>
      <div className="AppView-Tools">
        <Sidebar
          appState={appState}
          onCardAdd={handleCardAdd}
          onCardAddClick={handleCardAddClick}
          onCardAddClose={handleCardAddClose}
          onCardEdit={handleCardEdit}
          onCardEditClose={handleCardEditClose}
          onCardSave={handleCardSave}
          onCommentAdd={handleCommentAdd}
          viewState={viewState}
        />
      </div>
    </div>
  );
}

interface SidebarProps {
  appState: AppState;
  onCardAdd: (values: CardAddRequest) => Promise<void>;
  onCardAddClick: (initialCard: Partial<Card>) => void;
  onCardAddClose: () => void;
  onCardEdit: (values: CardEditRequest) => Promise<void>;
  onCardEditClose: () => void;
  onCardSave: (request: CardEditRequest) => Promise<void>;
  onCommentAdd: (request: CommentAddRequest) => Promise<void>;
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
    onCardSave,
    onCommentAdd,
    viewState,
  } = props;

  const editCard = viewState.editCardId === null
    ? null
    : appState.findCardById(viewState.editCardId);

  const selectedCard = viewState.selectedCardId === null
    ? null
    : appState.findCardById(viewState.selectedCardId);

  const handleCardAdd = async ({categoryId, text}: ValidCardFormValues) => {
    await onCardAdd({
      categoryId,
      createdAt: Instant.now(),
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

  const handleCommentAdd = async ({cardId, text}: {cardId: string, text: string}) => {
    await onCommentAdd({
      cardId,
      createdAt: Instant.now(),
      id: generateId(),
      text,
    });
  };

  if (editCard !== null) {
    return (
      <CardEditForm
        appState={appState}
        card={editCard}
        onClose={onCardEditClose}
        onCardSave={values => handleCardSave(editCard, values)}
      />
    );
  } else if (viewState.addingCard !== null) {
    return (
      <CardAddForm
        appState={appState}
        initialValue={viewState.addingCard}
        onClose={onCardAddClose}
        onCardAdd={handleCardAdd}
      />
    );
  } else if (selectedCard !== null) {
    return (
      <CardDetailView
        appState={appState}
        card={selectedCard}
        onAddChildClick={() => onCardAddClick({parentCardId: selectedCard.id})}
        onCardCategorySave={newCategoryId => onCardSave({id: selectedCard.id, categoryId: newCategoryId})}
        onCardStatusSave={newStatus => onCardSave({id: selectedCard.id, status: newStatus})}
        onCardTextSave={newText => onCardSave({id: selectedCard.id, text: newText})}
        onCommentAdd={text => handleCommentAdd({cardId: selectedCard.id, text})}
      />
    );
  } else {
    return (
      <ToolsView onCardAddClick={() => onCardAddClick({})} />
    );
  }
}
