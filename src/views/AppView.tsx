import { useState } from "react";
import { AppState, AppUpdate } from "../app";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";
import CardAddModal from "./CardAddModal";

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

export default function AppView(props: AppViewProps) {
  const {sendUpdate, state} = props;

  const [viewState, setViewState] = useState(initialViewState);

  // TODO: separate button for adding a child card?
  const handleCardAddClick = () => {
    setViewState({...viewState, addingCard: true});
  };

  const handleCardAddModalClose = () => {
    setViewState({...viewState, addingCard: false});
  };

  const handleCardAdd = (text: string) => {
    // TODO: add wait
    sendUpdate({
      type: "cardAdd",
      request: {
        id: generateId(),
        parentCardId: viewState.selectedCardId,
        text,
      },
    });
    handleCardAddModalClose();
  };

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
        />
      )}
    </div>
  );
}
