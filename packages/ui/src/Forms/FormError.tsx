import React from "react";

import i18n from "@eisbuk/translations";

const FormError: React.FC<{ className?: string }> = ({
  className = "",
  children: error,
}) => (
  <p className={`text-sm text-red-600 ${className}`}>
    {error && typeof error === "string" && i18n.t(error)}
  </p>
);

export default FormError;
