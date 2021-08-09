import React from "react";

import AcUnit from "@material-ui/icons/AcUnit";
import AccessibilityNew from "@material-ui/icons/AccessibilityNew";
import FitnessCenter from "@material-ui/icons/FitnessCenter";

import { SvgProps } from "@/types/components";

import { ProjectIcons } from "@/enums/components";

interface Props extends SvgProps {
  icon: ProjectIcons;
}

/**
 * Shows an icon passed as prop and applies MUI Svg props (if any passed)
 * @param param0 icon, ...props (MUI Svg props)
 * @returns
 */
const ProjectIcon: React.FC<Props> = ({ icon, ...props }) => {
  switch (icon) {
    case ProjectIcons.AcUnit:
      return <AcUnit {...props} />;
    case ProjectIcons.AccessibilityNew:
      return <AccessibilityNew {...props} />;
    case ProjectIcons.FitnessCenter:
      return <FitnessCenter {...props} />;
    default:
      return null;
  }
};

export default ProjectIcon;
