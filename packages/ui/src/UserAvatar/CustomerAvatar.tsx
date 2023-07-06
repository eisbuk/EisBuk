import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";
import { SVGComponent } from "@eisbuk/svg";

import Avatar from "./Avatar";

export interface CustomerAvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  badgeSize?: BadgeSize;
  customer: Partial<Customer>;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  badgeSize = BadgeSize.SM,
  customer,
  ...props
}) => {
  const { photoURL, certificateExpiration } = customer;

  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const badges = [];

    const medCertBadge = getMedCertBadge(certificateExpiration);
    if (medCertBadge) badges.push(medCertBadge);

    setBadges(badges);
  }, [customer]);

  return (
    <Badges
      className="h-10 w-10 flex-1"
      badges={badges}
      size={badgeSize}
      {...props}
    >
      <Avatar className="w-full h-full text-white" photoURL={photoURL} />
    </Badges>
  );
};

interface Badge {
  color: string;
  Icon: SVGComponent;
}

export enum BadgeSize {
  SM = "small",
  MD = "medium",
  LG = "large",
}

interface BadgesProps extends React.HTMLAttributes<HTMLDivElement> {
  badges: Badge[];
  size?: BadgeSize;
}

export const Badges: React.FC<BadgesProps> = ({
  children,
  badges = [],
  className = "",
  hidden = false,
  size = BadgeSize.SM,
  ...props
}) => {
  const badgeSize = {
    [BadgeSize.SM]: "h-3 w-3",
    [BadgeSize.MD]: "h-4 w-4",
    [BadgeSize.LG]: "h-5 w-5",
  }[size];

  const badgeContainerSize = {
    [BadgeSize.SM]: "h-3 w-[3px] group-hover:w-3",
    [BadgeSize.MD]: "h-4 w-1 group-hover:w-4",
    [BadgeSize.LG]: "h-5 w-[5px] group-hover:w-5",
  }[size];

  const spacing = {
    [BadgeSize.SM]: "gap-px",
    [BadgeSize.MD]: "gap-0.5",
    [BadgeSize.LG]: "gap-1",
  }[size];

  return (
    <div {...props} className={`relative group ${className}`}>
      {children}

      <div className={`w-full absolute -bottom-0 flex justify-end ${spacing}`}>
        {!hidden &&
          badges.map(({ color, Icon = () => null }, i) => (
            <div
              key={`${color}-${i}`}
              className={`${badgeContainerSize} relative translate-y-1/4 text-right transition-all duration-150`}
            >
              <div
                className={`${badgeSize} overflow-hidden flex items-center p-px text-white absolute right-0 justify-center rounded-full ${color}`}
              >
                <Icon />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const getMedCertBadge = (certificateExpiration?: string): Badge | undefined => {
  // get medical certificate data
  const luxonMedCertExpiration = DateTime.fromISO(certificateExpiration || "");
  // if customer doesn't have medical certificate, should display warning the same as if certificate expired
  const untilCertExpiration =
    luxonMedCertExpiration.diffNow("days")?.days || -1;

  const Icon = () => <>!</>;

  return untilCertExpiration < 0
    ? { color: "bg-red-200 text-red-500 border border-red-300", Icon }
    : untilCertExpiration < 20
    ? { color: "bg-yellow-200 text-red-500 border border-red-500", Icon }
    : undefined;
};
