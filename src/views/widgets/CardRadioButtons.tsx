import { useId } from "react";

import { Color } from "../../app/colors";
import "./CardRadioButtons.scss";

interface Option {
  id: string;
}

interface CardRadioButtonsProps<T extends Option> {
  id?: string;
  onChange: (id: string) => void;
  options: ReadonlyArray<T>;
  optionColor: (option: T) => Color;
  optionLabel: (option: T) => string;
  value: string | null;
}

export default function CardRadioButtons<T extends Option>(props: CardRadioButtonsProps<T>) {
  const {id, onChange, options, optionColor, optionLabel, value} = props;

  const htmlName = useId();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="CardRadioButtons" id={id}>
      {options.map(option => (
        <div key={option.id} className="CardRadioButtons-Option">
          <input
            type="radio"
            checked={option.id === value}
            onChange={handleChange}
            name={htmlName}
            id={htmlName + "_" + option.id}
            value={option.id}
            className="CardRadioButtons-Input"
          />
          <label
            className="CardRadioButtons-OptionLabel"
            style={{backgroundColor: optionColor(option).hex}}
            htmlFor={htmlName + "_" + option.id}
          >
            {optionLabel(option)}
          </label>
        </div>
      ))}
    </div>
  );
}
