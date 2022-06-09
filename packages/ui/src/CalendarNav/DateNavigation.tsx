import React from "react";

import { ChevronRight, ChevronLeft } from "@eisbuk/svg";

interface DateNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * A presentation layer component: A controlled picker, renders `content` in between
 * left and right arrows. Calls `onPrev` and `onNext` on respective arrow click.
 */
const DateNavigation: React.FC<DateNavigationProps> = ({
  className,
  content,
  onPrev,
  onNext,
}) => {
  const buttonClasses = "w-8 h-full p-1 text-gray-500";

  return (
    <div className={["h-8", "flex", className].join(" ")}>
      <button onClick={onPrev} className={buttonClasses}>
        <ChevronLeft />
      </button>

      <div className="w-full h-full mx-3 relative bg-white rounded-md">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-semibold">
          {content}
        </span>
      </div>

      <button onClick={onNext} className={buttonClasses}>
        <ChevronRight />
      </button>
    </div>
  );
};

export default DateNavigation;
