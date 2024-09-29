import { AppState } from "./app";
import { cardSubboardId, rootBoardId } from "./app/boards";
import { generateCardHistory } from "./app/cards";
import { cardsToTrees } from "./app/cardTrees";
import { AppSnapshot } from "./app/snapshots";
import { AppQuery } from "./queries";

export default function appStateToQueryFunction(appState: AppState, timeTravelSnapshotIndex: number | null) {
  return <R>(query: AppQuery<R>) =>
    queryAppState(appState, timeTravelSnapshotIndex, query);
}

export function queryAppState<R>(
  appState: AppState,
  timeTravelSnapshotIndex: number | null,
  query: AppQuery<R>,
): R {
  const snapshot = timeTravelSnapshotIndex === null
    ? appState.latestSnapshot()
    : appState.snapshot(timeTravelSnapshotIndex);

  return queryAppSnapshot(snapshot, query);
}

export function queryAppSnapshot<R>(
  snapshot: AppSnapshot,
  query: AppQuery<R>,
): R {
  switch (query.type) {
    case "card": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot.findCardById(query.cardId));
    }
    case "parentCard": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);

      const card = projectContentsSnapshot.findCardById(query.cardId);
      if (card === null || card.parentCardId === null) {
        return query.proof(null);
      }

      return query.proof(projectContentsSnapshot.findCardById(card.parentCardId));
    }
    case "cardChildCount": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot.countCardChildren(query.cardId));
    }
    case "cardHistory": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      const card = projectContentsSnapshot.findCardById(query.cardId);
      const cardHistory = card === null ? [] : generateCardHistory(card, projectContentsSnapshot);
      return query.proof(cardHistory);
    }
    case "searchCards": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot.searchCards(query.searchTerm));
    }
    case "boardCardTrees": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      const cards = projectContentsSnapshot.allCards()
        .filter(card => query.cardStatuses.has(card.status));

      return query.proof(cardsToTrees(cards, query.boardId));
    }
    case "parentBoard": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      let cardId: string | null = query.boardId.boardRootId;

      while (cardId !== null) {
        const card = projectContentsSnapshot.findCardById(cardId);
        if (card === null) {
          cardId = null;
        } else if (card.isSubboardRoot && cardId !== query.boardId.boardRootId) {
          break;
        } else {
          cardId = card.parentCardId;
        }
      }

      return query.proof(cardId === null ? rootBoardId : cardSubboardId(cardId));
    }
    case "allCategories": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot);
    }
    case "availableCategories": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot.availableCategories());
    }
    case "allColors": {
      const projectContentsSnapshot = snapshot.fetchProjectContents(query.projectId);
      return query.proof(projectContentsSnapshot);
    }
    case "allProjects": {
      return query.proof(snapshot.allProjects());
    }
  }
}
