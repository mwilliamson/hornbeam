import { useId } from "react";

import { Category } from "../../app";
import "./CategorySelect.scss";

interface CategorySelectProps {
  availableCategories: ReadonlyArray<Category>;
  id?: string;
  onChange: (categoryId: string) => void;
  value: string | null;
}

export default function CategorySelect(props: CategorySelectProps) {
  const {availableCategories, id, onChange, value} = props;

  const htmlName = useId();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="CategorySelect" id={id}>
      {availableCategories.map(category => (
        <div key={category.id} className="CategorySelect-Category">
          <input
            type="radio"
            checked={category.id === value}
            onChange={handleChange}
            name={htmlName}
            id={htmlName + "_" + category.id}
            value={category.id}
            className="CategorySelect-Input"
          />
          <label
            className="CategorySelect-CategoryLabel"
            style={{backgroundColor: category.color.hex}}
            htmlFor={htmlName + "_" + category.id}
          >
            {category.name}
          </label>
        </div>
      ))}
    </div>
  );
}
