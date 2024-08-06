import { cardQuery } from "../backendConnections/queries";
import Boundary from "./Boundary";
import { CardFormInitialState } from "./cards/CardForm";
import TopBar from "./TopBar";

interface TopBarBoundaryProps {
  onBoardUp: (() => void) | undefined;
  onCardAddClick: (cardFormInitialState: CardFormInitialState) => void;
  onSettingsClick: () => void;
  onTimeTravelStart: () => void;
  subboardRootId: string | null;
}

export default function TopBarBoundary(props: TopBarBoundaryProps) {
  const {
    onBoardUp,
    onCardAddClick,
    onSettingsClick,
    onTimeTravelStart,
    subboardRootId,
  } = props;

  return (
    <Boundary
      queries={{
        // TODO: remove this terrible hack
        subboardRoot: cardQuery(subboardRootId ?? "")
      }}
      render={({subboardRoot}) => (
        <TopBar
          onBoardUp={onBoardUp}
          onCardAddClick={() => onCardAddClick({parentCard: subboardRoot})}
          onSettingsClick={onSettingsClick}
          onTimeTravelStart={onTimeTravelStart}
        />
      )}
    />
  );
}
