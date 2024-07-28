import { Instant } from "@js-joda/core";
import { useEffect, useId, useState } from "react";

import { CardStatus, allCardStatuses } from "../app/cardStatuses";
import { CardMoveToAfterRequest, CardMoveToBeforeRequest } from "../app/cards";
import { requests } from "../app/snapshots";
import "../scss/style.scss";
import isInputEvent from "../util/isInputEvent";
import "./AppView.scss";
import CardsViewBoundary from "./CardsViewBoundary";
import SettingsView from "./SettingsView";
import TimeTravelSlider from "./TimeTravelSlider";
import CardStatusLabel from "./cardStatuses/CardStatusLabel";
import { CardFormInitialState } from "./cards/CardForm";
import ControlGroup from "./widgets/ControlGroup";
import ExpanderIcon from "./widgets/ExpanderIcon";
import { BackendConnection } from "../backendConnections";
import CardAddFormBoundary from "./cards/CardAddFormBoundary";
import CardDetailViewBoundary from "./cards/CardDetailViewBoundary";
import TopBar from "./TopBar";

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

  const selectedSubboardRoot = viewState.selectedSubboardRootId === null
    ? null
    : snapshot.findCardById(viewState.selectedSubboardRootId);

  const handleBoardUp = viewState.selectedSubboardRootId === null
    ? undefined
    : () => {
      // TODO: extract and test logic
      // TODO: deselect selected card if not visible on the board?
      let cardId = viewState.selectedSubboardRootId;

      while (cardId !== null) {
        const card = snapshot.findCardById(cardId);
        if (card === null) {
          cardId = null;
        } else if (card.isSubboardRoot && cardId !== viewState.selectedSubboardRootId) {
          break;
        } else {
          cardId = card.parentCardId;
        }
      }

      handleSubboardOpen(cardId);
    };

  return (
    <div className="AppView">
      <div className="AppView-Top">
        <TopBar
          onBoardUp={handleBoardUp}
          onCardAddClick={() => handleCardAddClick({
            parentCard: selectedSubboardRoot,
          })}
          onSettingsClick={handleSettingsClick}
          onTimeTravelStart={handleTimeTravelStart}
        />
      </div>
      <div className="AppView-Bottom">
        <div className="AppView-Left">
          <div className="AppView-Cards">
            <CardsViewBoundary
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
                onTimeTravelStop={handleTimeTravelStop}
              />
            </div>
          )}
        </div>
        <div className="AppView-Sidebar">
          <div className="AppView-Sidebar-Main">
            <Sidebar
              onCardAddClick={handleCardAddClick}
              onCardAddClose={handleCardAddClose}
              onSettingsClose={handleSettingsClose}
              onSubboardOpen={handleSubboardOpen}
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
    </div>
  );
}

interface SidebarProps {
  onCardAddClick: (initialCard: CardFormInitialState) => void;
  onCardAddClose: () => void;
  onSettingsClose: () => void;
  onSubboardOpen: (subboardRootId: string | null) => void;
  viewState: ViewState;
}

function Sidebar(props: SidebarProps) {
  const {
    onCardAddClick,
    onCardAddClose,
    onSettingsClose,
    onSubboardOpen,
    viewState,
  } = props;

  if (viewState.viewSettings) {
    return (
      <Pane header="Settings">
        <SettingsView
          onBack={onSettingsClose}
        />
      </Pane>
    );
  } else if (viewState.addingCard !== null) {
    return (
      <Pane header="Add card">
        <CardAddFormBoundary
          initialValue={viewState.addingCard}
          onClose={onCardAddClose}
        />
      </Pane>
    );
  } else if (viewState.selectedCardId !== null) {
    return (
      <Pane header="Selected card">
        <CardDetailViewBoundary
          cardId={viewState.selectedCardId}
          onCardAddClick={onCardAddClick}
          onSubboardOpen={onSubboardOpen}
          selectedSubboardRootId={viewState.selectedSubboardRootId}
        />
      </Pane>
    );
  } else {
    return null;
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
