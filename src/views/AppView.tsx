import { useState } from "react";
import { AppState, AppUpdate } from "../app";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";

interface ViewState {
  selectedCardId: string | null;
}

const initialViewState: ViewState = {
  selectedCardId: null,
};

interface AppViewProps {
  sendUpdate: (update: AppUpdate) => void;
  state: AppState;
}

export default function AppView(props: AppViewProps) {
  const {sendUpdate, state} = props;

  const [viewState, setViewState] = useState(initialViewState);

  // TODO: allow user to set text

  const handleCardAddClick = () => {
    // TODO: separate button for adding a child card?
    sendUpdate({
      type: "cardAdd",
      request: {
        id: generateId(),
        parentCardId: viewState.selectedCardId,
        text: "New card",
      },
    });
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
    </div>
  );
}
