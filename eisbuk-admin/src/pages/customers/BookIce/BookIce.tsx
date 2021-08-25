import React from "react";

import DateNavigation from "@/components/atoms/DateNavigation";

const BookIce: React.FC = () => {
  return <DateNavigation jump="month" withRouter></DateNavigation>;
};

export default BookIce;
