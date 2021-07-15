import React from "react";
import AppbarAdmin from "./AppbarAdmin";

export default {
  title: "AppbarAdmin",
  component: AppbarAdmin,
};

export const BareAppbar = () => (
  <div>
    <AppbarAdmin />
    <p>The appbar includes a div to pad the next element.</p>
    <p>
      If everything worked you should be able to read this line and the one
      above it.
    </p>
  </div>
);
