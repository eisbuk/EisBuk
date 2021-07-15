import React from "react";

import CustomerAreaBookingCard from "./CustomerAreaBookingCard";

/** @TODO This might be obsolete since it only returns CustomerAreaBookingCard */
const CustomerAreaBookings: React.FC = () => {
  /** @TEMP */
  const data = {} as Parameters<typeof CustomerAreaBookingCard>[0]["data"];

  return <CustomerAreaBookingCard data={data} />;
};

export default CustomerAreaBookings;
