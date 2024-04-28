import { ChevronDown, ChevronRight } from "lucide-react";

import "./ExpanderIcon.scss";

interface ExpanderIconProps {
  isCollapsed: boolean;
}

export default function ExpanderIcon(props: ExpanderIconProps) {
  const {isCollapsed} = props;

  return isCollapsed ? (
    <ChevronRight className="ExpanderIcon" aria-label="Expand" />
  ) : (
    <ChevronDown className="ExpanderIcon" aria-label="Collapse" />
  );
}
