import Button from "./Button";

interface CancelButtonProps {
  onClick: () => void;
}

export default function CancelButton(props: CancelButtonProps) {
  const {onClick} = props;

  return (
    <Button type="button" intent="secondary" onClick={onClick}>Cancel</Button>
  );
}
