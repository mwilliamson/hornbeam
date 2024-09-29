
import { Instant } from "@js-joda/core";
import { useId, useState } from "react";
import { uuidv7 } from "uuidv7";

import { CategoryAddMutation } from "hornbeam-common/lib/app/categories";
import { ColorSet } from "hornbeam-common/lib/app/colors";
import ColorSelect from "../colors/ColorSelect";
import ControlGroup from "../widgets/ControlGroup";
import ControlLabel from "../widgets/ControlLabel";
import Button from "../widgets/Button";
import Form from "../widgets/Form";
import Input from "../widgets/Input";


interface AddCategoryState {
  name: string;
  presetColorId: string | null;
}

interface AddCategorySectionProps {
  allColors: ColorSet;
  // TODO: omit createdAt, id, and projectId from mutation?
  onCategoryAdd: (mutation: CategoryAddMutation) => Promise<void>;
  projectId: string;
}

export default function AddCategorySection(props: AddCategorySectionProps) {
  const {allColors, onCategoryAdd, projectId} = props;

  const [state, setState] = useState<AddCategoryState | null>(null);

  const nameControlId = useId();
  const colorControlId = useId();

  // TODO: extract validation
  // TODO: add validation feedback
  const validCategoryAddMutation = state !== null && state.name !== "" && state.presetColorId !== null ? {
    name: state.name,
    presetColorId: state.presetColorId,
  } : null;

  const handleSubmit = async () => {
    if (validCategoryAddMutation !== null) {
      // TODO: handle errors (here and elsewhere)
      await onCategoryAdd({
        color: {presetColorId: validCategoryAddMutation.presetColorId},
        createdAt: Instant.now(),
        name: validCategoryAddMutation.name,
        id: uuidv7(),
        projectId,
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
            colors={allColors}
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
