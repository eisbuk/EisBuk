import React, { useState, useEffect } from "react";

import { AttendanceAria, useTranslation } from "@eisbuk/translations";
import { CustomerWithAttendance } from "@eisbuk/shared";
import { Trash, ClipboardCheck } from "@eisbuk/svg";

import IntervalPicker from "./IntervalPicker";
import { BadgeSize, CustomerAvatar } from "../UserAvatar";

import useDebounce from "../hooks/useDebounce";

interface Props extends CustomerWithAttendance {
  /**
   * List of intervals to choose from
   */
  intervals: string[];
  /**
   * Function used to mark customer as having attended appropriate interval
   */
  markAttendance?: (payload: { attendedInterval: string }) => void;
  /**
   * Function used to mark customer as absent
   */
  markAbsence?: () => void;
  /**
   * Function used to mark customer as present, with a custom interval
   */
  onCustomInterval?: (interval: string) => void;
}

/**
 * User attendance card component. Used to display and update customer attendance.
 * Should recieve all data through props, while marking attendance dispatches
 * updates to the firestore (through Redux) and provides some UX boundaries such as debounced updates (to prevent excess calls to the server)
 * and disabling buttons while the states are syncing.
 */
const UserAttendance: React.FC<Props> = ({
  bookedInterval,
  attendedInterval,
  bookingNotes,
  intervals,
  markAttendance = () => {},
  markAbsence = () => {},
  onCustomInterval = () => {},
  ...customer
}) => {
  const { t } = useTranslation();

  /**
   * Local (boolean) state for attended/absent.
   * We're using this to change attendance button's icon immediately
   * and disable the button until attendance state is synced with the db.
   */
  const [localAttended, setLocalAttended] = useState<boolean>(
    Boolean(attendedInterval)
  );

  const [selectedInterval, setSelectedInterval] = useState<string>(
    attendedInterval || bookedInterval!
  );

  // In an edge case of some other client (browser or different browser window)
  // updates the booked interval (or boolean attendance state) we wish to reflect that
  // update locally as well
  useEffect(() => {
    if (attendedInterval) {
      setSelectedInterval(attendedInterval);
      setLocalAttended(true);
    } else {
      setSelectedInterval(bookedInterval!);
      setLocalAttended(false);
    }
  }, [attendedInterval]);

  /**
   * Debounced version of `markAttendance`. Used to prevent excess server requests
   * when switching through the intervals
   * (only fire `markAttendance` when user stops clicking through the interval picker).
   */
  const debMarkAttendance = useDebounce(markAttendance, 800);

  /**
   * Attendance button click handler:
   * - updates `localAttended` immediately (for more responsive UI)
   * - dispatches `markAttendance`/`markAbsence` to firestore (according to current state)
   * - if dispatching `markAttendance`, uses last remembered interval (or booked interval) as `attendedInterval` value
   */
  const handleAttendanceButtonClick = (e: React.SyntheticEvent) => {
    // The user attendance row is also clickable (redirecting to the user profile), so we're
    // preventing default to not bubble the attendance button click event.
    e.preventDefault();
    const newAttended = !attendedInterval;
    setLocalAttended(newAttended);
    if (newAttended) {
      markAttendance({ attendedInterval: selectedInterval });
    } else {
      markAbsence();
      if (bookedInterval) {
        setSelectedInterval(bookedInterval);
      }
    }
  };

  /**
   * Interval picker change handler:
   * - updates `selectedInterval` locally (for more responsive UI)
   * - updates `attendedInterval` (in firesore), through debounced `markAttendance` function.s
   * @param value
   */
  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value);
    debMarkAttendance({ attendedInterval: value });
  };

  // We're disabling attendance button while `localAttended` (boolean) syncs with state in firestore (`attendedInterval !== null`)
  // and when switchig through intervals -> `selectedInterval` and `attendedInterval` (from firestore) are not the same
  // the second doesn't apply if `attendedInterval = null` (as that would cause problems and isn't exactly expected behavior).
  const disableButton =
    localAttended !== Boolean(attendedInterval) ||
    Boolean(attendedInterval && attendedInterval !== selectedInterval);

  const isAbsent = !attendedInterval;

  const backgroundColor = isAbsent ? "bg-gray-100" : "bg-white";

  // Avatar/name setup
  const customerString = [
    `${customer.surname} ${customer.name}`,
    customer.deleted ? `(${t("Flags.Deleted")})` : "",
  ]
    .join(" ")
    .trim();

  return (
    <div className="flex-col">
      <li
        className={`relative w-full px-4 py-8 gap-y-8 sm:py-0 flex flex-wrap items-center sm:flex-nowrap ${backgroundColor} ${
          customer.deleted ? "opacity-50" : ""
        }`}
      >
        <div className="w-[80%] sm:w-full sm:order-1 flex justify-left items-center whitespace-nowrap">
          <CustomerAvatar
            className="w-12 h-12 mr-4"
            badgeSize={BadgeSize.MD}
            customer={customer}
          />
          <span>{customerString}</span>
        </div>

        <div className="text-left sm:order-3">
          {bookedInterval ? (
            <AttendanceButton
              checked={localAttended}
              onClick={handleAttendanceButtonClick}
              disabled={disableButton}
            />
          ) : (
            <RemoveButton
              onClick={handleAttendanceButtonClick}
              disabled={disableButton}
            />
          )}
        </div>

        <div
          className={`flex w-full sm:my-0 sm:order-2 m-2 justify-center ${backgroundColor}`}
        >
          <IntervalPicker
            // Through text (css 'color') property, we're making the interval picker arrows the same color as the background
            className={`mx-4 ${isAbsent ? "text-gray-100" : "text-white"}`}
            disabled={!localAttended}
            intervals={intervals}
            attendedInterval={selectedInterval}
            bookedInterval={bookedInterval}
            onChange={handleIntervalChange}
            onCustomInterval={onCustomInterval}
          />
        </div>
      </li>
      {bookingNotes && (
        <div className="bg-gray-50">
          <div className="w-full h-[1px] bg-gray-300" />
          <p className="w-fit text-gray-600 text-xs mt-2 ml-4 border-b-[1px] border-gray-400">
            {t(AttendanceAria.TrainerNotes)}
          </p>
          <p className="text-gray-600 text-xs px-2 pt-1 pb-2">{bookingNotes}</p>
        </div>
      )}
    </div>
  );
};

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const RemoveButton: React.FC<ButtonProps> = ({ className = "", ...props }) => (
  <button
    className={`w-16 h-11 py-2.5 bg-cyan-800 text-white rounded active:bg-cyan-700 ${className}`}
    {...props}
  >
    <Trash />
  </button>
);

interface AttendanceButtonProps extends ButtonProps {
  checked: boolean;
}

const AttendanceButton: React.FC<AttendanceButtonProps> = ({
  className = "",
  checked,
  ...props
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={`w-16 h-11 py-2.5 text-cyan-800 rounded ${className} ${
        checked
          ? "border border-cyan-700 bg-lime-400"
          : "border border-cyan-700 bg-gray-300"
      } ${props.disabled ? "opacity-40" : ""}`}
      aria-label={
        checked ? t(AttendanceAria.MarkAbsent) : t(AttendanceAria.MarkPresent)
      }
      {...props}
    >
      <ClipboardCheck />
    </button>
  );
};

export default UserAttendance;
