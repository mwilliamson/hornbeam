import "./Button.scss";

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  type: "button" | "submit";
  value?: string;
}

export default function Button(props: ButtonProps) {
  const {children, onClick, type, value} = props;

  const handleClick = onClick === undefined ? undefined : (event: React.SyntheticEvent) => {
    event.preventDefault();
    onClick();
  };

  return (
    <button
      className="Button Button--primary Button--variant-solid"
      onClick={handleClick}
      type={type}
      value={value}
    >
      {children}
    </button>
  );
}
