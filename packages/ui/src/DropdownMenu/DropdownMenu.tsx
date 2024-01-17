import React from "react";

import { useClickOutside } from "@eisbuk/shared/ui";

interface DropdownMenuProps {
  content?: JSX.Element | JSX.Element[];
  zIndex?: 0 | 10 | 20 | 30 | 40 | 50;
}

const zIndexLookup = {
  0: "z-0",
  10: "z-10",
  20: "z-20",
  30: "z-30",
  40: "z-40",
  50: "z-50",
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  zIndex = 50,
  content,
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => setOpen((prev) => !prev);

  const container = React.useRef<HTMLDivElement>(null);

  useClickOutside(container, () => setOpen(false));

  return (
    <div
      ref={container}
      onClick={toggleOpen}
      className="relative cursor-pointer"
    >
      {children}

      {open && content && (
        <div
          className={`absolute -bottom-2 right-0 translate-y-full ${zIndexLookup[zIndex]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
