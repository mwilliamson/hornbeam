import classNames from "classnames";
import "./Button.scss";

type ButtonIntent = "primary" | "secondary";

interface ButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  inline?: boolean;
  intent: ButtonIntent;
  onClick?: () => void;
  type: "button" | "submit";
  value?: string;
}

export default function Button(props: ButtonProps) {
  const {children, disabled, fullWidth, inline, intent, onClick, type, value} = props;

  const handleClick = onClick === undefined ? undefined : (event: React.SyntheticEvent) => {
    event.preventDefault();
    onClick();
  };

  return (
    <button
      className={classNames(
        `Button Button--intent-${intent} Button--variant-solid`,
        {
          "Button--inline": inline,
          "Button--full-width": fullWidth,
        },
      )}
      disabled={disabled}
      onClick={handleClick}
      type={type}
      value={value}
    >
      {children}
    </button>
  );
}
