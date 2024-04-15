import "./Input.scss";

interface InputProps {
  autoFocus?: boolean;
  id?: string;
  onChange: (value: string) => void;
  value: string;
}

export default function Input(props: InputProps) {
  const {autoFocus, id, onChange, value} = props;

  return (
    <input
      autoFocus={autoFocus}
      className="Input"
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}
