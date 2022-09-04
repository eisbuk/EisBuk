import React from "react";

const AuthTypography: React.FC<{ variant: "body" | "caption" }> = ({
  children,
  variant,
}) => (
  <span className={variantClassLookup[variant].join(" ")} {...{ variant }}>
    {children}
  </span>
);

const variantClassLookup = {
  body: [],
  caption: ["text-sm", "leading-5", "text-gray-500", "block", "max-w-[312px]"],
};

export default AuthTypography;
