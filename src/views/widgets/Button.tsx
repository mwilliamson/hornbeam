import "./Button.scss";

interface ButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type: "button" | "submit";
  value?: string;
}

export default function Button(props: ButtonProps) {
  const {children, disabled, onClick, type, value} = props;

  const handleClick = onClick === undefined ? undefined : (event: React.SyntheticEvent) => {
    event.preventDefault();
    onClick();
  };

  return (
    <button
      className="Button Button--primary Button--variant-solid"
      disabled={disabled}
      onClick={handleClick}
      type={type}
      value={value}
    >
      {children}
    </button>
  );
}
