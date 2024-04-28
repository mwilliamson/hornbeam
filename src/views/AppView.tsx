import { Instant } from "@js-joda/core";
import { useEffect, useId, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState } from "../app";
import { CardStatus, allCardStatuses } from "../app/cardStatuses";
import { Card, CardAddRequest, CardEditRequest, CardMoveRequest } from "../app/cards";
import { CategoryAddRequest, CategoryReorderRequest } from "../app/categories";
import { CommentAddRequest } from "../app/comments";
import { generateId } from "../app/ids";
import { AppSnapshot, AppUpdate, Request, requests } from "../app/snapshots";
import "../scss/style.scss";
import isInputEvent from "../util/isInputEvent";
import { Deferred, createDeferred } from "../util/promises";
import "./AppView.scss";
import CardsView from "./CardsView";
import SettingsView from "./SettingsView";
import TimeTravelSidebar from "./TimeTravelSidebar";
import TimeTravelSlider from "./TimeTravelSlider";
import ToolsView from "./ToolsView";
import CardStatusLabel from "./cardStatuses/CardStatusLabel";
import CardAddForm from "./cards/CardAddForm";
import CardDetailView from "./cards/CardDetailView";
import { ValidCardFormValues } from "./cards/CardForm";
import ControlGroup from "./widgets/ControlGroup";
import ExpanderIcon from "./widgets/ExpanderIcon";

interface CardFilters {
  cardStatuses: ReadonlySet<CardStatus>;
}

interface ViewState {
  addingCard: Partial<CardAddRequest> | null,
  cardFilters: CardFilters;
  selectedCardId: string | null;
  // TODO: should probably be a union (e.g. can't add a card and time travel at the same time)
  timeTravelSnapshotIndex: number | null;
  viewSettings: boolean;
}

const initialViewState: ViewState = {
  addingCard: null,
  cardFilters: {
    cardStatuses: new Set(allCardStatuses.filter(cardStatus => cardStatus !== CardStatus.Deleted)),
  },
  selectedCardId: null,
  timeTravelSnapshotIndex: null,
  viewSettings: false,
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

  const handleCardMove = async (request: CardMoveRequest) => {
    await sendRequest(requests.cardMove(request));
  };

  const handleCardSave = async (request: CardEditRequest) => {
    await sendRequest(requests.cardEdit(request));
  };

  const handleCategoryAdd = async (request: CategoryAddRequest) => {
    await sendRequest(requests.categoryAdd(request));
  };

  const handleCategoryReorder = async (request: CategoryReorderRequest) => {
    await sendRequest(requests.categoryReorder(request));
  };

  const handleCommentAdd = async (request: CommentAddRequest) => {
    await sendRequest(requests.commentAdd(request));
  };

  const handleSettingsClick = () => {
    setViewState({
      ...viewState,
      viewSettings: true,
    });
  };

  const handleTimeTravelStart = () => {
    setViewState({
      ...viewState,
      timeTravelSnapshotIndex: appState.latestSnapshotIndex(),
    });
  };

  const handleTimeTravelStop = () => {
    setViewState({
      ...viewState,
      timeTravelSnapshotIndex: null,
    });
  };

  const handleTimeTravelSnapshotIndexChange = (newSnapshotIndex: number) => {
    setViewState({
      ...viewState,
      timeTravelSnapshotIndex: newSnapshotIndex,
    });
  };

  const handleCardFiltersChange = (newCardFilters: CardFilters) => {
    setViewState({
      ...viewState,
      cardFilters: newCardFilters,
    });
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // TODO: use proper selection of the cards and put the event on the cards?
      if (isInputEvent(event)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        // TODO: prevent during time travel
        if (viewState.selectedCardId !== null) {
          // TODO: wait
          sendRequest(requests.cardEdit({
            createdAt: Instant.now(),
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

  const snapshot = viewState.timeTravelSnapshotIndex === null
    ? appState.latestSnapshot()
    : appState.snapshot(viewState.timeTravelSnapshotIndex);

  const cards = snapshot.allCards()
    .filter(card => viewState.cardFilters.cardStatuses.has(card.status));

  return (
    <div className="AppView">
      <div className="AppView-Left">
        <div className="AppView-Cards">
          <CardsView
            appSnapshot={appState.latestSnapshot()}
            cards={cards}
            cardSelectedId={viewState.selectedCardId}
            onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
            onCardAddChildClick={(cardId) => handleCardAddClick({parentCardId: cardId})}
          />
        </div>
        {viewState.timeTravelSnapshotIndex !== null && (
          <div className="AppView-TimeTravelSlider">
            <TimeTravelSlider
              currentSnapshotIndex={viewState.timeTravelSnapshotIndex}
              maxSnapshotIndex={appState.latestSnapshotIndex()}
              onCurrentSnapshotIndexChange={handleTimeTravelSnapshotIndexChange}
            />
          </div>
        )}
      </div>
      <div className="AppView-Sidebar">
        <div className="AppView-Sidebar-Main">
          <Sidebar
            appSnapshot={snapshot}
            onCardAdd={handleCardAdd}
            onCardAddClick={handleCardAddClick}
            onCardAddClose={handleCardAddClose}
            onCardMove={handleCardMove}
            onCardSave={handleCardSave}
            onCategoryAdd={handleCategoryAdd}
            onCategoryReorder={handleCategoryReorder}
            onCommentAdd={handleCommentAdd}
            onSettingsClick={handleSettingsClick}
            onTimeTravelStart={handleTimeTravelStart}
            onTimeTravelStop={handleTimeTravelStop}
            viewState={viewState}
          />
        </div>
        <div className="AppView-Sidebar-CardFilters">
          <CardFiltersView
            cardFilters={viewState.cardFilters}
            onCardFiltersChange={handleCardFiltersChange}
          />
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  appSnapshot: AppSnapshot;
  onCardAdd: (values: CardAddRequest) => Promise<void>;
  onCardAddClick: (initialCard: Partial<Card>) => void;
  onCardAddClose: () => void;
  onCardMove: (request: CardMoveRequest) => Promise<void>;
  onCardSave: (request: CardEditRequest) => Promise<void>;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
  onCategoryReorder: (request: CategoryReorderRequest) => Promise<void>;
  onCommentAdd: (request: CommentAddRequest) => Promise<void>;
  onSettingsClick: () => void;
  onTimeTravelStart: () => void;
  onTimeTravelStop: () => void;
  viewState: ViewState;
}

function Sidebar(props: SidebarProps) {
  const {
    appSnapshot,
    onCardAdd,
    onCardAddClick,
    onCardAddClose,
    onCardMove,
    onCardSave,
    onCategoryAdd,
    onCategoryReorder,
    onCommentAdd,
    onSettingsClick,
    onTimeTravelStart,
    onTimeTravelStop,
    viewState,
  } = props;

  const selectedCard = viewState.selectedCardId === null
    ? null
    : appSnapshot.findCardById(viewState.selectedCardId);

  const handleCardAdd = async ({categoryId, text}: ValidCardFormValues) => {
    await onCardAdd({
      categoryId,
      createdAt: Instant.now(),
      id: generateId(),
      parentCardId: viewState.selectedCardId,
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

  if (viewState.viewSettings) {
    return (
      <SettingsView
        appSnapshot={appSnapshot}
        onCategoryAdd={onCategoryAdd}
        onCategoryReorder={onCategoryReorder}
      />
    );
  } else if (viewState.timeTravelSnapshotIndex !== null) {
    return (
      <TimeTravelSidebar
        onTimeTravelStop={onTimeTravelStop}
        timeTravelSnapshotIndex={viewState.timeTravelSnapshotIndex}
      />
    );
  } else if (viewState.addingCard !== null) {
    return (
      <CardAddForm
        appSnapshot={appSnapshot}
        initialValue={viewState.addingCard}
        onClose={onCardAddClose}
        onCardAdd={handleCardAdd}
      />
    );
  } else if (selectedCard !== null) {
    return (
      <CardDetailView
        appSnapshot={appSnapshot}
        card={selectedCard}
        onAddChildClick={() => onCardAddClick({parentCardId: selectedCard.id})}
        onCardCategorySave={newCategoryId => onCardSave({
          createdAt: Instant.now(),
          id: selectedCard.id,
          categoryId: newCategoryId,
        })}
        onCardMove={(direction) => onCardMove({
          createdAt: Instant.now(),
          direction,
          id: selectedCard.id,
        })}
        onCardParentSave={newParentId => onCardSave({
          createdAt: Instant.now(),
          id: selectedCard.id,
          parentCardId: newParentId,
        })}
        onCardStatusSave={newStatus => onCardSave({
          createdAt: Instant.now(),
          id: selectedCard.id,
          status: newStatus,
        })}
        onCardTextSave={newText => onCardSave({
          createdAt: Instant.now(),
          id: selectedCard.id,
          text: newText,
        })}
        onCommentAdd={text => handleCommentAdd({cardId: selectedCard.id, text})}
      />
    );
  } else {
    return (
      <ToolsView
        onCardAddClick={() => onCardAddClick({})}
        onSettingsClick={onSettingsClick}
        onTimeTravelStart={onTimeTravelStart}
      />
    );
  }
}

interface CardFiltersViewProps {
  cardFilters: CardFilters;
  onCardFiltersChange: (cardFilters: CardFilters) => void;
}

function CardFiltersView(props: CardFiltersViewProps) {
  const {cardFilters, onCardFiltersChange} = props;

  const controlId = useId();

  const handleCardStatusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    cardStatus: CardStatus,
  ) => {
    const cardStatuses = new Set(cardFilters.cardStatuses);

    if (event.target.checked) {
      cardStatuses.add(cardStatus);
    } else {
      cardStatuses.delete(cardStatus);
    }

    onCardFiltersChange({
      ...cardFilters,
      cardStatuses,
    });
  };

  return (
    <CollapsiblePane header="Filters">
      <h3>Status</h3>
      <ControlGroup>
        {allCardStatuses.map(cardStatus => (
          <label key={cardStatus} style={{display: "block"}}>
            <input
              type="checkbox"
              checked={cardFilters.cardStatuses.has(cardStatus)}
              name={controlId}
              onChange={event => handleCardStatusChange(event, cardStatus)}
              value={cardStatus}
            />
            {" "}
            <CardStatusLabel showNone value={cardStatus} />
          </label>
        ))}
      </ControlGroup>
    </CollapsiblePane>
  );
}

interface CollapsiblePaneProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

function CollapsiblePane(props: CollapsiblePaneProps) {
  const {children, header} = props;

  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <section className="AppView-CollapsiblePane">
      <h2 className="AppView-CollapsiblePane-Header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <ExpanderIcon isCollapsed={isCollapsed} />
        {header}
      </h2>

      <div className="AppView-CollapsiblePane-Body" hidden={isCollapsed}>
        {children}
      </div>
    </section>
  );
}
