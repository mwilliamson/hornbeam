import { initialAppState } from "../../app";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const appState = initialAppState();
    const [state, setState] = useCardFormState({});

    return (
      <CardForm
        allCards={appState}
        availableCategories={appState.availableCategories()}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
