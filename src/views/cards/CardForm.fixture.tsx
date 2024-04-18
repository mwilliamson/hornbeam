import { initialAppState } from "../../app";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const appState = initialAppState();
    const [state, setState] = useCardFormState({});

    return (
      <CardForm
        allCards={appState}
        allCategories={appState}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
