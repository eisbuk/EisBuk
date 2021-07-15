import React from "react";

import bubblesBackground from "@/assets/images/Bubble-20s-1920px.svg";

const loginImageStyle = {
  backgroundImage: `url(${bubblesBackground})`,
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
  height: "100vh",
};

/**
 * Shows LoadingScreen
 * @returns
 */
const Loading: React.FC = () => <div style={loginImageStyle} />;

export default Loading;
