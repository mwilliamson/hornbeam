export class AppState {

}

export function initialAppState(): AppState {
  return new AppState();
}

export type AppUpdate = null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function applyAppUpdate(state: AppState, update: AppUpdate): AppState {
  return state;
}
