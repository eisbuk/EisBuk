import React from "react";
import Unauthorized from "./Unauthorized";

export default {
  title: "Unauthorized page",
  component: Unauthorized,
};

const PageTemplate = (args) => <Unauthorized {...args} />;

export const RandomPage0 = PageTemplate.bind();
RandomPage0.args = {
  backgroundIndex: 0,
};

export const RandomPage1 = PageTemplate.bind();
RandomPage1.args = {
  backgroundIndex: 1,
};

export const RandomPage2 = PageTemplate.bind();
RandomPage2.args = {
  backgroundIndex: 2,
};

export const RandomPage3 = PageTemplate.bind();
RandomPage3.args = {
  backgroundIndex: 3,
};

export const RandomPage4 = PageTemplate.bind();
RandomPage4.args = {
  backgroundIndex: 4,
};
