import { Instant } from "@js-joda/core";
import { useEffect, useId, useState } from "react";

import { BoardId, isRootBoardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { CardStatus, allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";
import { appMutations } from "hornbeam-common/lib/app/snapshots";
import "../scss/style.scss";
import isInputEvent from "../util/isInputEvent";
import "./BoardView.scss";
import CardsViewBoundary from "./CardsViewBoundary";
import SettingsView from "./SettingsView";
import TimeTravelSlider from "./TimeTravelSlider";
import CardStatusLabel from "./cardStatuses/CardStatusLabel";
import { CardFormInitialState } from "./cards/CardForm";
import ControlGroup from "./widgets/ControlGroup";
import ExpanderIcon from "./widgets/ExpanderIcon";
import { BackendConnection } from "../backendConnections";
import { parentBoardQuery } from "hornbeam-common/lib/queries";
import CardAddFormBoundary from "./cards/CardAddFormBoundary";
import CardDetailViewBoundary from "./cards/CardDetailViewBoundary";
import TopBarBoundary from "./TopBarBoundary";
import { useTimeTravel } from "./useTimeTravel";
import { handleNever } from "hornbeam-common/lib/util/assertNever";

interface CardFilters {
  cardStatuses: ReadonlySet<CardStatus>;
}

interface ViewState {
  cardFilters: CardFilters;
  selectedCardId: string | null;
  selectedBoardId: BoardId;
  sidebar: SidebarViewState;
}

type SidebarViewState =
  | {type: "selected"}
  | {type: "settings"}
  | {type: "addCard", cardFormInitialState: CardFormInitialState};

const defaultSidebarViewState: SidebarViewState = {type: "selected"};

const initialViewState: ViewState = {
  cardFilters: {
    cardStatuses: new Set(allCardStatuses.filter(cardStatus => cardStatus !== CardStatus.Deleted)),
  },
  selectedCardId: null,
  selectedBoardId: rootBoardId,
  sidebar: defaultSidebarViewState,
};

interface BoardViewProps {
  backendConnection: BackendConnection;
  projectId: string;
}

export default function BoardView(props: BoardViewProps) {
  const {backendConnection, projectId} = props;
  const {mutate} = backendConnection;
  const timeTravel = useTimeTravel();

  const [viewState, setViewState] = useState(initialViewState);

  const handleCardAddClick = (cardFormInitialState: CardFormInitialState) => {
    setViewState({
      ...viewState,
      sidebar: {type: "addCard", cardFormInitialState},
    });
  };

  const handleCardAddClose = () => {
    setViewState({...viewState, sidebar: defaultSidebarViewState});
  };

  const handleSettingsClick = () => {
    setViewState({
      ...viewState,
      sidebar: {type: "settings"},
    });
  };

  const handleSettingsClose = () => {
    setViewState({...viewState, sidebar: defaultSidebarViewState});
  };

  // TODO: prevent actions when time travelling

  const handleTimeTravelStart = timeTravel === null ? null : () => {
    timeTravel.start();
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
          mutate(appMutations.cardEdit({
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
  }, [viewState.selectedCardId, mutate]);

  const handleBoardUp = isRootBoardId(viewState.selectedBoardId)
    ? undefined
    : async () => {
      if (isRootBoardId(viewState.selectedBoardId)) {
        return;
      }
      // TODO: deselect selected card if not visible on the board?
      const query = parentBoardQuery(viewState.selectedBoardId);
      const parentBoardId = await backendConnection.executeQuery(query);
      handleBoardOpen(parentBoardId);
    };

  return (
    <div className="BoardView">
      <div className="BoardView-Top">
        <TopBarBoundary
          onBoardUp={handleBoardUp}
          onCardAddClick={handleCardAddClick}
          onSettingsClick={handleSettingsClick}
          onTimeTravelStart={handleTimeTravelStart}
          boardId={viewState.selectedBoardId}
        />
      </div>
      <div className="BoardView-Bottom">
        <div className="BoardView-Left">
          <div className="BoardView-Cards">
            <CardsViewBoundary
              cardSelectedId={viewState.selectedCardId}
              onCardSelect={(cardId) => setViewState({...viewState, selectedCardId: cardId})}
              onCardAddChildClick={(card) => handleCardAddClick({parentCard: card})}
              onBoardOpen={(boardId) => setViewState({...viewState, selectedBoardId: boardId})}
              projectId={projectId}
              selectedBoardId={viewState.selectedBoardId}
              visibleCardStatuses={viewState.cardFilters.cardStatuses}
            />
          </div>
          {timeTravel !== null && timeTravel.snapshotIndex !== null && (
            <div className="BoardView-TimeTravelSlider">
              <TimeTravelSlider
                timeTravel={timeTravel}
              />
            </div>
          )}
        </div>
        <div className="BoardView-Sidebar">
          <div className="BoardView-Sidebar-Main">
            <Sidebar
              onCardAddClick={handleCardAddClick}
              onCardAddClose={handleCardAddClose}
              onSettingsClose={handleSettingsClose}
              onBoardOpen={handleBoardOpen}
              projectId={projectId}
              viewState={viewState}
            />
          </div>
          <div className="BoardView-Sidebar-CardFilters">
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
  projectId: string;
  viewState: ViewState;
}

function Sidebar(props: SidebarProps) {
  const {
    onCardAddClick,
    onCardAddClose,
    onSettingsClose,
    onBoardOpen,
    projectId,
    viewState,
  } = props;

  switch (viewState.sidebar.type) {
    case "addCard":
      return (
        <Pane header="Add card">
          <CardAddFormBoundary
            initialValue={viewState.sidebar.cardFormInitialState}
            onClose={onCardAddClose}
            projectId={projectId}
          />
        </Pane>
      );

    case "selected":
      if (viewState.selectedCardId === null) {
        return null;
      } else {
        return (
          <Pane header="Selected card">
            <CardDetailViewBoundary
              cardId={viewState.selectedCardId}
              onCardAddClick={onCardAddClick}
              onBoardOpen={onBoardOpen}
              projectId={projectId}
              selectedBoardId={viewState.selectedBoardId}
            />
          </Pane>
        );
      }

    case "settings":
      return (
        <Pane header="Settings">
          <SettingsView
            projectId={projectId}
            onBack={onSettingsClose}
          />
        </Pane>
      );

    default:
      return handleNever(viewState.sidebar, null);
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

  const onHeaderClick = collapsible
    ? () => setIsCollapsed(!isCollapsed)
    : undefined;

  return (
    <section className="BoardView-CollapsiblePane">
      <h2 className="BoardView-CollapsiblePane-Header" onClick={onHeaderClick}>
        {collapsible && <ExpanderIcon isCollapsed={isCollapsed} />}
        {header}
      </h2>

      <div className="BoardView-CollapsiblePane-Body" hidden={isCollapsed}>
        {children}
      </div>
    </section>
  );
}
