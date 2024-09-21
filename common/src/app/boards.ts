export interface BoardId {
  readonly boardRootId: string | null;
}

export const rootBoardId: BoardId = {boardRootId: null};

export function isRootBoardId(boardId: BoardId): boolean {
  return boardId.boardRootId === null;
}

export function isCardSubboardId(boardId: BoardId, cardId: string): boolean {
  return boardId.boardRootId === cardId;
}

export function cardSubboardId(cardId: string): BoardId {
  return {boardRootId: cardId};
}
