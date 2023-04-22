import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { CustomerAttendance } from "@eisbuk/shared";

import AttendanceCardContainer from "./AttendanceCardContainer";

import UserAttendance from "./UserAttendance";
import Divider from "./Divider";

import { intervalStrings as intervals } from "@eisbuk/test-data/attendance";
import { saul, walt, gus } from "@eisbuk/test-data/customers";
import { baseSlot } from "@eisbuk/test-data/slots";

export default {
  title: "Attendance Card",
  component: AttendanceCardContainer,
} as ComponentMeta<typeof AttendanceCardContainer>;

const saulBookings = {
  bookedInterval: intervals[0],
  attendedInterval: intervals[1],
};

const waltBookings = {
  bookedInterval: intervals[1],
  attendedInterval: null,
};

const gusBookings = {
  bookedInterval: null,
  attendedInterval: intervals[1],
};

const raj = {
  ...walt,
  photoURL: "",
  id: "raj",
  name: "Rajesh",
  surname: "Koothrapali",
  deleted: true,
};

export const Default = (): JSX.Element => {
  // The following states are here to simulate the attendance card being used in a real app
  // this behaviour, albeit slightly more complex, will be handled in a controlled AttendnaceCard component
  // developed in the app's package
  const [saulAttendance, setSaulAttendance] =
    useState<CustomerAttendance>(saulBookings);
  const [waltAttendance, setWaltAttendance] =
    useState<CustomerAttendance>(waltBookings);
  const [gusAttendance, setGusAttendance] =
    useState<CustomerAttendance>(gusBookings);

  const markAttendance =
    (setAttendance: typeof setSaulAttendance) =>
    ({ attendedInterval }: { attendedInterval: string }) => {
      setTimeout(
        () => setAttendance((att) => ({ ...att, attendedInterval })),
        200
      );
    };
  const markAbsence = (setAttendance: typeof setSaulAttendance) => () => {
    setTimeout(() => {
      setAttendance((att) => ({ ...att, attendedInterval: null }));
    }, 200);
  };

  return (
    <AttendanceCardContainer
      className="w-[720px] mx-auto"
      numAttended={6}
      slot={baseSlot}
    >
      <UserAttendance {...raj} intervals={intervals} {...waltBookings} />
      <UserAttendance
        {...saul}
        intervals={intervals}
        {...saulAttendance}
        markAttendance={markAttendance(setSaulAttendance)}
        markAbsence={markAbsence(setSaulAttendance)}
      />
      <UserAttendance
        {...walt}
        intervals={intervals}
        {...waltAttendance}
        markAttendance={markAttendance(setWaltAttendance)}
        markAbsence={markAbsence(setWaltAttendance)}
      />

      <Divider />

      {gusAttendance.attendedInterval && (
        // We're hiding Gus if he's not attended to simulate removal of non-booked, non-attended customers in production
        <UserAttendance
          {...gus}
          intervals={intervals}
          {...gusAttendance}
          markAttendance={markAttendance(setGusAttendance)}
          markAbsence={markAbsence(setGusAttendance)}
        />
      )}
    </AttendanceCardContainer>
  );
};
