import "./Button.scss";

interface ButtonProps {
  children?: React.ReactNode;
  onClick: () => void;
}

export default function Button(props: ButtonProps) {
  const {children, onClick} = props;

  return (
    <button
      className="Button Button--primary Button--variant-solid"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
