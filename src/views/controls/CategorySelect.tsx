import { Category } from "../../app";

interface CategorySelectProps {
  availableCategories: ReadonlyArray<Category>;
  onChange: (categoryId: string) => void;
  value: string | null;
}

export default function CategorySelect(props: CategorySelectProps) {
  const {availableCategories, onChange, value} = props;

  return (
    <select onChange={event => onChange(event.target.value)} value={value ?? undefined}>
      <option value=""></option>
      {availableCategories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
