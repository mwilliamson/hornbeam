import { ColorSet } from "hornbeam-common/lib/app/colors";
import CardRadioButtons from "../widgets/CardRadioButtons";

interface ColorSelectProps {
  colors: ColorSet;
  id: string;
  onChange: (value: string) => void;
  value: string | null;
}

export default function ColorSelect(props: ColorSelectProps) {
  const {colors: appSnapshot, id, onChange, value} = props;

  return (
    <CardRadioButtons
      id={id}
      onChange={onChange}
      options={appSnapshot.allPresetColors()}
      optionColor={option => option.color}
      optionLabel={option => option.name}
      value={value}
    />
  );
}
