import { initialAppSnapshot } from "../../app/snapshots";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const appSnapshot = initialAppSnapshot();
    const [state, setState] = useCardFormState({
      parentCard: null,
    });

    return (
      <CardForm
        allCategories={appSnapshot}
        allColors={appSnapshot}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
