import React from "react";
import Unauthorized from "./Unauthorized";

export default {
  title: "Unauthorized page",
  component: Unauthorized,
};

export const Default = (): JSX.Element => <Unauthorized backgroundIndex={0} />;

export const Background1 = (): JSX.Element => (
  <Unauthorized backgroundIndex={1} />
);

export const Background2 = (): JSX.Element => (
  <Unauthorized backgroundIndex={2} />
);

export const Background3 = (): JSX.Element => (
  <Unauthorized backgroundIndex={3} />
);

export const Background4 = (): JSX.Element => (
  <Unauthorized backgroundIndex={4} />
);
