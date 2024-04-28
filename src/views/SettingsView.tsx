import { Instant } from "@js-joda/core";
import { useId, useState } from "react";
import { uuidv7 } from "uuidv7";

import { CategoryAddRequest, CategoryReorderRequest } from "../app/categories";
import { AppSnapshot } from "../app/snapshots";
import CategoryListView from "./categories/CategoryListView";
import ColorSelect from "./colors/ColorSelect";
import ControlGroup from "./widgets/ControlGroup";
import ControlLabel from "./widgets/ControlLabel";
import Form from "./widgets/Form";
import Input from "./widgets/Input";
import LinkButton from "./widgets/LinkButton";

interface SettingsViewProps {
  appSnapshot: AppSnapshot;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
  onCategoryReorder: (request: CategoryReorderRequest) => Promise<void>;
}

export default function SettingsView(props: SettingsViewProps) {
  const {appSnapshot, onCategoryAdd, onCategoryReorder} = props;

  return (
    <section className="m-md">
      <h3>Categories</h3>

      <CategoryListView
        appSnapshot={appSnapshot}
        onReorder={ids => onCategoryReorder({
          createdAt: Instant.now(),
          ids,
        })}
      />

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
      <LinkButton onClick={() => setState({name: "", presetColorId: null})}>
        Add category
      </LinkButton>
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