import "./Textarea.scss";

interface TextareaProps {
  id: string;
  onChange: (value: string) => void;
  value: string;
}

export default function Textarea(props: TextareaProps) {
  const {id, onChange, value} = props;

  return (
    <textarea
      className="Textarea"
      id={id}
      onChange={event => onChange(event.target.value)}
      value={value}
    />
  );
}
