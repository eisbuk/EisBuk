import React from "react";

import { ReactComponent as Bubbles } from "@/assets/images/Bubble-20s-1920px.svg";

const loginImageStyle = {
  height: "100vh",
};

/**
 * Shows LoadingScreen
 * @returns
 */
const Loading: React.FC = () => (
  <div style={loginImageStyle}>
    <Bubbles />
  </div>
);

export default Loading;
