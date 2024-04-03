import "./Input.scss";

interface InputProps {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  value: string;
}

export default function Input(props: InputProps) {
  const {autoFocus, onChange, value} = props;

  return (
    <input
      autoFocus={autoFocus}
      className="Input"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}
