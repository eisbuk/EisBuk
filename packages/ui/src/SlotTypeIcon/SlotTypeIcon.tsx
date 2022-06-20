import React from "react";

import { Ice, OffIce } from "@eisbuk/svg";

import { SlotType } from "@eisbuk/shared";
import { useTranslation, SlotTypeLabel } from "@eisbuk/translations";

const iconLookup = {
  [SlotType.Ice]: Ice,
  [SlotType.OffIce]: OffIce,
};

const SlotTypeIcon: React.FC<{ type: SlotType; className?: string }> = ({
  type,
  className = "",
}) => {
  const { t } = useTranslation();

  const Icon = iconLookup[type];

  return (
    <div className={[...baseClasses, className].join(" ")}>
      <span key="icon" className="w-5 h-5 mr-2">
        <Icon />
      </span>
      <span key="type">{t(SlotTypeLabel[type])}</span>
    </div>
  );
};

const baseClasses = [
  "font-sm",
  "uppercase",
  "text-base",
  "text-bold",
  "text-gray-500",
  "flex",
  "flex-row",
  "items-center",
  "md:flex-row",
];

export default SlotTypeIcon;
