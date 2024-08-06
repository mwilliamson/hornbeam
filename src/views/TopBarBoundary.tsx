import { BoardId } from "../app/boards";
import { cardQuery } from "../backendConnections/queries";
import Boundary from "./Boundary";
import { CardFormInitialState } from "./cards/CardForm";
import TopBar from "./TopBar";

interface TopBarBoundaryProps {
  onBoardUp: (() => void) | undefined;
  onCardAddClick: (cardFormInitialState: CardFormInitialState) => void;
  onSettingsClick: () => void;
  onTimeTravelStart: () => void;
  boardId: BoardId;
}

export default function TopBarBoundary(props: TopBarBoundaryProps) {
  const {
    onBoardUp,
    onCardAddClick,
    onSettingsClick,
    onTimeTravelStart,
    boardId,
  } = props;

  return (
    <Boundary
      queries={{
        // TODO: remove this terrible hack
        boardRoot: cardQuery(boardId.boardRootId ?? "")
      }}
      render={({boardRoot}) => (
        <TopBar
          onBoardUp={onBoardUp}
          onCardAddClick={() => onCardAddClick({parentCard: boardRoot})}
          onSettingsClick={onSettingsClick}
          onTimeTravelStart={onTimeTravelStart}
        />
      )}
    />
  );
}