import { initialProjectContentsSnapshot } from "hornbeam-common/lib/app/snapshots";
import CardForm, { useCardFormState } from "./CardForm";

export default {
  Blank() {
    const snapshot = initialProjectContentsSnapshot();
    const [state, setState] = useCardFormState({
      parentCard: null,
    });

    return (
      <CardForm
        allColors={snapshot}
        availableCategories={snapshot.availableCategories()}
        errors={[]}
        onStateChange={state => setState(state)}
        state={state}
      />
    );
  }
};
