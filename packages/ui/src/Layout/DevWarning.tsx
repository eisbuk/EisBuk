import React from "react";

import { Close } from "@eisbuk/svg";

/** A warning displayed instead of firebase emulators generic warning: used in dev to let the user (developer in most cases) know this is not production. */
const DevWarning: React.FC<{ open?: boolean }> = ({ open = false }) => {
  const [isOpen, setIsOpen] = React.useState(open);

  const close = () => () => setIsOpen(false);

  return isOpen ? (
    <p className="relative text-gray-700 font-semibold bg-red-100 border-2 text-center border-red-500 rounded-lg py-1 px-8">
      <span>
        Warning: using firestore emulators in dev mode: do not use with
        production credentials
      </span>
      <div
        onClick={close()}
        className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer h-5 w-5"
      >
        <Close />
      </div>
    </p>
  ) : null;
};

export default DevWarning;
