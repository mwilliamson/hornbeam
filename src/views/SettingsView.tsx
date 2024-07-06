import { Instant } from "@js-joda/core";
import { useId, useState } from "react";
import { uuidv7 } from "uuidv7";

import { ChevronLeft } from "lucide-react";
import { CategoryAddRequest } from "../app/categories";
import { AppSnapshot } from "../app/snapshots";
import "./SettingsView.scss";
import CategoryListViewBoundary from "./categories/CategoryListViewBoundary";
import ColorSelect from "./colors/ColorSelect";
import Button from "./widgets/Button";
import ControlGroup from "./widgets/ControlGroup";
import ControlLabel from "./widgets/ControlLabel";
import Form from "./widgets/Form";
import Input from "./widgets/Input";
import LinkButton from "./widgets/LinkButton";

interface SettingsViewProps {
  appSnapshot: AppSnapshot;
  onBack: () => void;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
}

export default function SettingsView(props: SettingsViewProps) {
  const {appSnapshot, onBack, onCategoryAdd} = props;

  return (
    <section>
      <ControlGroup>
        <LinkButton onClick={onBack}>
          <ChevronLeft className="SettingsView-BackChevron" size={18} />
          Back
        </LinkButton>
      </ControlGroup>

      <h3>Categories</h3>

      <CategoryListViewBoundary />

      <AddCategorySection
        appSnapshot={appSnapshot}
        onCategoryAdd={onCategoryAdd}
      />
    </section>
  );
}

interface AddCategoryState {
  name: string;
  presetColorId: string | null;
}

interface AddCategorySectionProps {
  appSnapshot: AppSnapshot;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
}

function AddCategorySection(props: AddCategorySectionProps) {
  const {appSnapshot, onCategoryAdd} = props;

  const [state, setState] = useState<AddCategoryState | null>(null);

  const nameControlId = useId();
  const colorControlId = useId();

  // TODO: extract validation
  const validCategoryAddRequest = state !== null && state.name !== "" && state.presetColorId !== null ? {
    name: state.name,
    presetColorId: state.presetColorId,
  } : null;

  const handleSubmit = async () => {
    if (validCategoryAddRequest !== null) {
      await onCategoryAdd({
        color: {presetColorId: validCategoryAddRequest.presetColorId},
        createdAt: Instant.now(),
        name: validCategoryAddRequest.name,
        id: uuidv7(),
      });
      setState(null);
    }
  };

  return state === null ? (
    <ControlGroup>
      <Button
        type="button"
        intent="secondary"
        onClick={() => setState({name: "", presetColorId: null})}
        fullWidth
      >
        Add category
      </Button>
    </ControlGroup>
  ) : (
    <section>
      <h4 className="mt-md">Add category</h4>

      <Form onSubmit={handleSubmit}>
        <ControlLabel htmlFor={nameControlId}>
          Name
        </ControlLabel>
        <ControlGroup>
          <Input
            onChange={newName => setState({...state, name: newName})}
            value={state.name}
          />
        </ControlGroup>

        <ControlLabel htmlFor={colorControlId}>
          Color
        </ControlLabel>
        <ControlGroup>
          <ColorSelect
            appSnapshot={appSnapshot}
            id={colorControlId}
            onChange={newPresetColorId => setState({...state, presetColorId: newPresetColorId})}
            value={state.presetColorId}
          />
        </ControlGroup>

        <Form.MainButtons
          onCancel={() => setState(null)}
          submitText="Add category"
        />
      </Form>
    </section>
  );
}
