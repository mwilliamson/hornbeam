import "./ControlLabel.scss";

interface ControlLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  buttons?: React.ReactNode;
}

export default function ControlLabel(props: ControlLabelProps) {
  const {children, htmlFor, buttons} = props;

  return (
    <div className="ControlLabel">
      <label className="ControlLabel-Label" htmlFor={htmlFor}>
        {children}
      </label>
      {buttons !== null && <div>{buttons}</div>}
    </div>
  );
}
