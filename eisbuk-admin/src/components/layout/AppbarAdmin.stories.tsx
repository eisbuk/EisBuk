import React from "react";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

export default {
  title: "AppbarAdmin",
  component: AppbarAdmin,
};

export const BareAppbar = (): JSX.Element => (
  <div>
    <AppbarAdmin />
    <p>The appbar includes a div to pad the next element.</p>
    <p>
      If everything worked you should be able to read this line and the one
      above it.
    </p>
  </div>
);
