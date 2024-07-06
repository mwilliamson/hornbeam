import { ChevronLeft } from "lucide-react";
import { CategoryAddRequest } from "../app/categories";
import { AppSnapshot } from "../app/snapshots";
import "./SettingsView.scss";
import AddCategorySection from "./categories/AddCategorySection";
import CategoryListViewBoundary from "./categories/CategoryListViewBoundary";
import ControlGroup from "./widgets/ControlGroup";
import LinkButton from "./widgets/LinkButton";

interface SettingsViewProps {
  appSnapshot: AppSnapshot;
  onBack: () => void;
  onCategoryAdd: (request: CategoryAddRequest) => Promise<void>;
}

export default function SettingsView(props: SettingsViewProps) {
  const {appSnapshot, onBack, onCategoryAdd} = props;

  return (
    <section>
      <ControlGroup>
        <LinkButton onClick={onBack}>
          <ChevronLeft className="SettingsView-BackChevron" size={18} />
          Back
        </LinkButton>
      </ControlGroup>

      <h3>Categories</h3>

      <CategoryListViewBoundary />

      <AddCategorySection
        allColors={appSnapshot}
        onCategoryAdd={onCategoryAdd}
      />
    </section>
  );
}
