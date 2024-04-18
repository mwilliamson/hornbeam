import "./LinkButton.scss";

interface LinkButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export default function LinkButton(props: LinkButtonProps) {
  const {children, onClick} = props;

  // TODO: aria roles?

  return (
    <span className="LinkButton" onClick={onClick} tabIndex={0}>
      {children}
    </span>
  );
}
