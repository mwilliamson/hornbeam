import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const appSnapshot = initialAppSnapshot();
    const [state, setState] = useCardFormState({
      parentCard: null,
    });

    return (
      <CardForm
        allColors={appSnapshot}
        availableCategories={appSnapshot.availableCategories()}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
