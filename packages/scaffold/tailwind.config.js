/**
 * Calculates a rem value for spacing from spacing in pixels
 * @param {number} px spacing in pixels
 * @returns {string} spacing in rem with `rem` suffix, e.g. `2.125rem`
 */
const rem = (px) => `${px / 16}rem`;

module.exports = {
  content: ["./src/**/*.{ts,tsx,html}", "./index.html"],
  theme: {
    extend: {
      spacing: {
        // Provide spacing for large elements
        sm: rem(640),
        md: rem(768),
        lg: rem(1024),
        xl: rem(1280),
        "2xl": rem(1536),

        // Extend additional spacings used more than once
        // the ones used only once are done with JIT
        //
        // NOTE:  For consistency, all spacing extensions should be keyed the same way tailwind does for defaults:
        //
        //        spacingKey = numPixels / 4
        //
        // This will prevent confusion and duplication
        2.5: rem(10),
      },
      colors: {
        ice: {
          300: "#dbe9ea",
        },
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        ".content-container": {
          position: "relative",
          width: "100%",
          padding: 0,

          "@screen md": {
            maxWidth: rem(1216),
            margin: "0 auto",
          },
        },
      });
    },
  ],
};
