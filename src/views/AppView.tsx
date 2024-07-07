import { Instant } from "@js-joda/core";
import { useEffect, useId, useState } from "react";

import { CardStatus, allCardStatuses } from "../app/cardStatuses";
import { CardAddRequest, CardEditRequest, CardMoveRequest, CardMoveToAfterRequest, CardMoveToBeforeRequest } from "../app/cards";
import { CommentAddRequest } from "../app/comments";
import { generateId } from "../app/ids";
import { AppSnapshot, requests } from "../app/snapshots";
import "../scss/style.scss";
import isInputEvent from "../util/isInputEvent";
import "./AppView.scss";
import CardsView from "./CardsView";
import SettingsView from "./SettingsView";
import TimeTravelSidebar from "./TimeTravelSidebar";
import TimeTravelSlider from "./TimeTravelSlider";
import ToolsView from "./ToolsView";
import CardStatusLabel from "./cardStatuses/CardStatusLabel";
import CardAddForm from "./cards/CardAddForm";
import CardDetailView from "./cards/CardDetailView";
import { CardFormInitialState, ValidCardFormValues } from "./cards/CardForm";
import ControlGroup from "./widgets/ControlGroup";
import ExpanderIcon from "./widgets/ExpanderIcon";
import { BackendConnection } from "../backendConnections";

interface CardFilters {
  cardStatuses: ReadonlySet<CardStatus>;
}

interface ViewState {
  addingCard: CardFormInitialState | null,
  cardFilters: CardFilters;
  selectedCardId: string | null;
  selectedSubboardRootId: string | null;
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
  selectedSubboardRootId: null,
  timeTravelSnapshotIndex: null,
  viewSettings: false,
};

interface AppViewProps {
  backendConnection: BackendConnection;
}

export default function AppView(props: AppViewProps) {
  const {backendConnection: {appState, sendRequest}} = props;

  const [viewState, setViewState] = useState(initialViewState);

  const handleCardAddClick = (cardFormInitialState: CardFormInitialState) => {
    setViewState({...viewState, addingCard: cardFormInitialState});
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

  const handleCardMoveToAfter = async (request: Omit<CardMoveToAfterRequest, "createdAt">) => {
    await sendRequest(requests.cardMoveToAfter({
      ...request,
      createdAt: Instant.now(),
    }));
  };

  const handleCardMoveToBefore = async (request: Omit<CardMoveToBeforeRequest, "createdAt">) => {
    await sendRequest(requests.cardMoveToBefore({
      ...request,
      createdAt: Instant.now(),
    }));
  };

  const handleCardSave = async (request: CardEditRequest) => {
    await sendRequest(requests.cardEdit(request));
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

  const handleSettingsClose = () => {
    setViewState({
      ...viewState,
      viewSettings: false,
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

  const handleSubboardOpen = (subboardRootId: string | null) => {
    setViewState({
      ...viewState,
      selectedSubboardRootId: subboardRootId,
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
            onCardMoveToAfter={handleCardMoveToAfter}
            onCardMoveToBefore={handleCardMoveToBefore}
            onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
            onCardAddChildClick={(card) => handleCardAddClick({parentCard: card})}
            onSubboardOpen={(subboardRootId) => setViewState({...viewState, selectedSubboardRootId: subboardRootId})}
            selectedSubboardRootId={viewState.selectedSubboardRootId}
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
            onCommentAdd={handleCommentAdd}
            onSettingsClick={handleSettingsClick}
            onSettingsClose={handleSettingsClose}
            onSubboardOpen={handleSubboardOpen}
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
  onCardAddClick: (initialCard: CardFormInitialState) => void;
  onCardAddClose: () => void;
  onCardMove: (request: CardMoveRequest) => Promise<void>;
  onCardSave: (request: CardEditRequest) => Promise<void>;
  onCommentAdd: (request: CommentAddRequest) => Promise<void>;
  onSettingsClick: () => void;
  onSettingsClose: () => void;
  onSubboardOpen: (subboardRootId: string | null) => void;
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
    onCommentAdd,
    onSettingsClick,
    onSettingsClose,
    onSubboardOpen,
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
      <Pane header="Settings">
        <SettingsView
          onBack={onSettingsClose}
        />
      </Pane>
    );
  } else if (viewState.timeTravelSnapshotIndex !== null) {
    return (
      <Pane header="Time travel">
        <TimeTravelSidebar
          onTimeTravelStop={onTimeTravelStop}
          timeTravelSnapshotIndex={viewState.timeTravelSnapshotIndex}
        />
      </Pane>
    );
  } else if (viewState.addingCard !== null) {
    return (
      <Pane header="Add card">
        <CardAddForm
          appSnapshot={appSnapshot}
          initialValue={viewState.addingCard}
          onClose={onCardAddClose}
          onCardAdd={handleCardAdd}
        />
      </Pane>
    );
  } else if (selectedCard !== null) {
    return (
      <Pane header="Selected card">
        <CardDetailView
          appSnapshot={appSnapshot}
          card={selectedCard}
          onAddChildClick={() => onCardAddClick({parentCard: selectedCard})}
          onCardEdit={request => onCardSave({
            ...request,
            createdAt: Instant.now(),
            id: selectedCard.id,
          })}
          onCardMove={(direction) => onCardMove({
            createdAt: Instant.now(),
            direction,
            id: selectedCard.id,
          })}
          onCommentAdd={text => handleCommentAdd({cardId: selectedCard.id, text})}
          onSubboardOpen={onSubboardOpen}
          selectedSubboardRootId={viewState.selectedSubboardRootId}
        />
      </Pane>
    );
  } else {
    return (
      <Pane header="Overview">
        <ToolsView
          onCardAddClick={() => onCardAddClick({parentCard: null})}
          onSettingsClick={onSettingsClick}
          onSubboardClose={
            viewState.selectedSubboardRootId === null
              ? undefined
              : () => onSubboardOpen(null)
          }
          onTimeTravelStart={onTimeTravelStart}
        />
      </Pane>
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
    <Pane collapsible header="Filters">
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
    </Pane>
  );
}

interface PaneProps {
  children: React.ReactNode;
  collapsible?: boolean;
  header: React.ReactNode;
}

function Pane(props: PaneProps) {
  const {children, collapsible = false, header} = props;

  const [isCollapsed, setIsCollapsed] = useState(collapsible);

  return (
    <section className="AppView-CollapsiblePane">
      <h2 className="AppView-CollapsiblePane-Header" onClick={() => setIsCollapsed(!isCollapsed)}>
        {collapsible && <ExpanderIcon isCollapsed={isCollapsed} />}
        {header}
      </h2>

      <div className="AppView-CollapsiblePane-Body" hidden={isCollapsed}>
        {children}
      </div>
    </section>
  );
}
