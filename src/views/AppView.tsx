import { AppState, AppUpdate } from "../app";
import { generateId } from "../app/ids";
import "../scss/style.scss";
import "./AppView.scss";
import CardsView from "./CardsView";
import ToolsView from "./ToolsView";

interface AppViewProps {
  sendUpdate: (update: AppUpdate) => void;
  state: AppState;
}

export default function AppView(props: AppViewProps) {
  const {sendUpdate, state} = props;

  const handleCardAddClick = () => {
    sendUpdate({type: "cardAdd", request: {id: generateId(), text: "New card"}});
  };

  return (
    <div className="AppView">
      <div>
        <ToolsView onCardAddClick={handleCardAddClick} />
      </div>
      <div>
        <CardsView cards={state.cards} />
      </div>
    </div>
  );
}
