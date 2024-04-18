import "./ControlGroup.scss";

interface ControlGroupProps {
  children: React.ReactNode;
}

export default function ControlGroup(props: ControlGroupProps) {
  const {children} = props;

  return (
    <div className="ControlGroup">
      {children}
    </div>
  );
}
