import { Instant } from "@js-joda/core";
import { useEffect, useId, useState } from "react";

import { BoardId, isRootBoardId, rootBoardId } from "../app/boards";
import { CardStatus, allCardStatuses } from "../app/cardStatuses";
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
import { parentBoardQuery } from "../backendConnections/queries";
import CardAddFormBoundary from "./cards/CardAddFormBoundary";
import CardDetailViewBoundary from "./cards/CardDetailViewBoundary";
import TopBarBoundary from "./TopBarBoundary";

interface CardFilters {
  cardStatuses: ReadonlySet<CardStatus>;
}

interface ViewState {
  addingCard: CardFormInitialState | null,
  cardFilters: CardFilters;
  selectedCardId: string | null;
  selectedBoardId: BoardId;
  viewSettings: boolean;
}

const initialViewState: ViewState = {
  addingCard: null,
  cardFilters: {
    cardStatuses: new Set(allCardStatuses.filter(cardStatus => cardStatus !== CardStatus.Deleted)),
  },
  selectedCardId: null,
  selectedBoardId: rootBoardId,
  viewSettings: false,
};

interface AppViewProps {
  backendConnection: BackendConnection;
}

export default function AppView(props: AppViewProps) {
  const {backendConnection} = props;
  const {sendRequest, timeTravel} = backendConnection;

  const [viewState, setViewState] = useState(initialViewState);

  const handleCardAddClick = (cardFormInitialState: CardFormInitialState) => {
    setViewState({...viewState, addingCard: cardFormInitialState});
  };

  const handleCardAddClose = () => {
    setViewState({...viewState, addingCard: null});
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

  // TODO: prevent actions when time travelling

  const handleTimeTravelStart = () => {
    timeTravel.start();
  };

  const handleTimeTravelStop = () => {
    timeTravel.stop();
  };

  const handleTimeTravelSnapshotIndexChange = (newSnapshotIndex: number) => {
    timeTravel.setSnapshotIndex(newSnapshotIndex);
  };

  const handleCardFiltersChange = (newCardFilters: CardFilters) => {
    setViewState({
      ...viewState,
      cardFilters: newCardFilters,
    });
  };

  const handleBoardOpen = (boardId: BoardId) => {
    setViewState({
      ...viewState,
      selectedBoardId: boardId,
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

  const handleBoardUp = isRootBoardId(viewState.selectedBoardId)
    ? undefined
    : async () => {
      if (isRootBoardId(viewState.selectedBoardId)) {
        return;
      }
      // TODO: deselect selected card if not visible on the board?
      const query = parentBoardQuery(viewState.selectedBoardId);
      const parentBoardId = await backendConnection.query(query);
      handleBoardOpen(parentBoardId);
    };

  return (
    <div className="AppView">
      <div className="AppView-Top">
        <TopBarBoundary
          onBoardUp={handleBoardUp}
          onCardAddClick={handleCardAddClick}
          onSettingsClick={handleSettingsClick}
          onTimeTravelStart={handleTimeTravelStart}
          boardId={viewState.selectedBoardId}
        />
      </div>
      <div className="AppView-Bottom">
        <div className="AppView-Left">
          <div className="AppView-Cards">
            <CardsViewBoundary
              cardSelectedId={viewState.selectedCardId}
              onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
              onCardAddChildClick={(card) => handleCardAddClick({parentCard: card})}
              onBoardOpen={(boardId) => setViewState({...viewState, selectedBoardId: boardId})}
              selectedBoardId={viewState.selectedBoardId}
              visibleCardStatuses={viewState.cardFilters.cardStatuses}
            />
          </div>
          {timeTravel.snapshotIndex !== null && (
            <div className="AppView-TimeTravelSlider">
              <TimeTravelSlider
                currentSnapshotIndex={timeTravel.snapshotIndex}
                maxSnapshotIndex={timeTravel.maxSnapshotIndex}
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
              onBoardOpen={handleBoardOpen}
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
  onBoardOpen: (boardId: BoardId) => void;
  viewState: ViewState;
}

function Sidebar(props: SidebarProps) {
  const {
    onCardAddClick,
    onCardAddClose,
    onSettingsClose,
    onBoardOpen,
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
          onBoardOpen={onBoardOpen}
          selectedBoardId={viewState.selectedBoardId}
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
