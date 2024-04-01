import "./Button.scss";

interface ButtonProps {
  children?: React.ReactNode;
}

export default function Button(props: ButtonProps) {
  const {children} = props;

  return (
    <button className="Button Button--primary Button--variant-solid">
      {children}
    </button>
  );
}
