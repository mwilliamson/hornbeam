import { ChevronLeft } from "lucide-react";
import "./SettingsView.scss";
import CategorySectionBoundary from "./categories/CategorySectionBoundary";
import ControlGroup from "./widgets/ControlGroup";
import LinkButton from "./widgets/LinkButton";

interface SettingsViewProps {
  projectId: string;
  onBack: () => void;
}

export default function SettingsView(props: SettingsViewProps) {
  const {projectId, onBack} = props;

  return (
    <section>
      <ControlGroup>
        <LinkButton onClick={onBack}>
          <ChevronLeft className="SettingsView-BackChevron" size={18} />
          Back
        </LinkButton>
      </ControlGroup>

      <h3>Categories</h3>

      <CategorySectionBoundary projectId={projectId} />
    </section>
  );
}
