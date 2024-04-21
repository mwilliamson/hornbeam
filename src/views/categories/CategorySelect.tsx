import { Category, categoryBackgroundColor } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import CardRadioButtons from "../widgets/CardRadioButtons";

interface CategorySelectProps {
  appSnapshot: ColorSet;
  availableCategories: ReadonlyArray<Category>;
  id?: string;
  onChange: (categoryId: string) => void;
  value: string | null;
}

export default function CategorySelect(props: CategorySelectProps) {
  const {availableCategories, appSnapshot, id, onChange, value} = props;

  return (
    <CardRadioButtons
      id={id}
      onChange={onChange}
      options={availableCategories}
      optionColor={option => categoryBackgroundColor(option, appSnapshot).color}
      optionLabel={option => option.name}
      value={value}
    />
  );
}
