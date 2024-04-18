import "./ControlLabel.scss";

interface ControlLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export default function ControlLabel(props: ControlLabelProps) {
  const {children, htmlFor} = props;

  return (
    <label className="ControlLabel" htmlFor={htmlFor}>
      {children}
    </label>
  );
}
