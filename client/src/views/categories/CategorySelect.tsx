import { Category, categoryBackgroundColor } from "../../app/categories";
import { ColorSet } from "../../app/colors";
import CardRadioButtons from "../widgets/CardRadioButtons";

interface CategorySelectProps {
  allColors: ColorSet;
  availableCategories: ReadonlyArray<Category>;
  id?: string;
  onChange: (categoryId: string) => void;
  value: string | null;
}

export default function CategorySelect(props: CategorySelectProps) {
  const {allColors, availableCategories, id, onChange, value} = props;

  return (
    <CardRadioButtons
      id={id}
      onChange={onChange}
      options={availableCategories}
      optionColor={option => categoryBackgroundColor(option, allColors).color}
      optionLabel={option => option.name}
      value={value}
    />
  );
}
