const baseConfig = require("../scaffold/tailwind.config.js");

module.exports = {
  ...baseConfig,
  theme: {
    ...baseConfig.theme,
    extend: {
      fontFamily: {
        fredoka: ["Fredoka One", "sans-serif"],
      },
      ...baseConfig.theme.extend,
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        "slide-in": {
          "0%": { transform: "translate(100%, 0%)", opacity: 0 },
          "66%": { transform: "translate(-10%, 0%)", opacity: 0.66 },
          "100%": { transform: "translate(0%, 0%)", opacity: 1 },
        },
        "pop-out": {
          "0%": { transform: "matrix(1,0,0,1,0,0)", opacity: 1 },
          "100%": { transform: "matrix(1.1,0,0,1.4,0,0)", opacity: 0 },
        },
      },
      animation: {
        ...baseConfig.theme.extend.animation,
        "slide-in": "slide-in .4s ease-out forwards",
        "pop-out": "pop-out .5s ease-out forwards",
      },
    },
  },
};
