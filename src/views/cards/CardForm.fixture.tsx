import { initialAppSnapshot } from "../../app/snapshots";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const appSnapshot = initialAppSnapshot();
    const [state, setState] = useCardFormState({});

    return (
      <CardForm
        appSnapshot={appSnapshot}
        allCategories={appSnapshot}
        allColors={appSnapshot}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
