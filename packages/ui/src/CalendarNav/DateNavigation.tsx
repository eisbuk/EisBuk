import React from "react";

import { ChevronRight, ChevronLeft } from "@eisbuk/svg";
import { AdminAria, useTranslation } from "@eisbuk/translations";

interface DateNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * A presentation layer component: A controlled picker, renders `content` in between
 * left and right arrows. Calls `onPrev` and `onNext` on respective arrow click.
 */
const DateNavigation: React.FC<DateNavigationProps> = ({
  className,
  onPrev,
  onNext,
  children = null,
}) => {
  const buttonClasses = "w-16 h-16 p-1 text-gray-500 md:h-8 md:w-8 shrink-0";

  const { t } = useTranslation();

  return (
    <div
      className={[
        "flex justify-between items-center md:flex-nowrap md:h-10 md:justify-center",
        className,
      ].join(" ")}
    >
      <button
        aria-label={t(AdminAria.SeePastDates)}
        onClick={onPrev}
        className={buttonClasses}
      >
        <ChevronLeft />
      </button>

      <div className="w-full h-12 mx-3 relative bg-white rounded-md overflow-hidden md:h-8">
        {typeof children === "string" ? (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-semibold whitespace-nowrap cursor-normal select-none">
            {children}
          </span>
        ) : (
          children
        )}
      </div>

      <button
        aria-label={t(AdminAria.SeeFutureDates)}
        onClick={onNext}
        className={buttonClasses}
      >
        <ChevronRight />
      </button>
    </div>
  );
};

export default DateNavigation;
