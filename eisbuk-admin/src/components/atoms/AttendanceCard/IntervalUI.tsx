import React, { useRef, useCallback } from "react";

import makeStyles from "@mui/styles/makeStyles";

interface Props {
  attendedInterval: string | null;
  bookedInterval: string | null;
}

const IntervalUI: React.FC<Props> = ({ attendedInterval, bookedInterval }) => {
  const classes = useStyles();

  // intervals to display
  const primaryInterval = attendedInterval;
  const secondaryInterval =
    bookedInterval !== attendedInterval ? bookedInterval : null;

  /**
   * A ref to `primaryInterval` DOM element
   */
  const primaryRef = useRef<HTMLSpanElement | null>(null);
  /**
   * A ref to `secondaryInterval` DOMRect (if defined)
   */
  const secondaryRect = useRef<DOMRect | null>(null);
  /**
   * A ref to HTMLDiv element used as strike through line
   */
  const strikeRef = useRef<HTMLDivElement | null>(null);

  /**
   * A callback function on `secondaryInterval`, used to perform `FLIP` animation
   * from primary to secondary on `secondaryInterval` mount and vice versa on unmount
   *
   * Note: Gets run only on `secondaryInterval` mount/dismount
   */
  const animateIntervals = useCallback((node: HTMLElement | null) => {
    switch (true) {
      // if both `node` (`secondaryInterval`) and primaryRef (`primaryInterval`) are defined (and the function is run)
      // should animate the string from `primaryInterval` to `secondaryInterval`
      case Boolean(primaryRef.current && node):
        const primaryRect = primaryRef.current!.getBoundingClientRect();

        // FLIP transition the interval from primary to secondary position (with color change)
        handleFlip({
          node: node!,
          animateFrom: primaryRect,
          duration: 200,
          onFinish: () => {
            // on finish, save the DOMRect of secondary (to be used in case of dismount/FLIP back to primary position)
            secondaryRect.current = node!.getBoundingClientRect();
          },
          colorTransition: ["black", "red"],
        });
        // animate strike through
        if (strikeRef.current) animateStrikeThrough(strikeRef.current);
        // fade in the next `primaryInterval` not to (visually) interfere with our FLIP transition
        handleFadeIn(primaryRef.current!, 200);
        break;

      // if `primaryRef` (primaryInterval) is defined and the node (`secondaryInterval`) is not, should transition the string
      // from `secondaryInterval` to `primaryInterval` position
      case Boolean(primaryRef.current && !node && secondaryRect.current):
        // when the secondary element is removed FLIP transition the element back to `primaryInterval` position
        handleFlip({
          node: primaryRef.current!,
          animateFrom: secondaryRect.current!,
          duration: 200,
          onFinish: () => {
            // clear up ref to `secondaryInterval` DOMRect as the element is currently not on the screen and this is stale
            secondaryRect.current = null;
          },
          colorTransition: ["red", "black"],
        });
        break;

      // if node (`secondaryInterval`) is defined but `secondaryRect` (`secondaryInterval`'s DOMRect) is not saved, save the DOMRect
      case node && !primaryRef.current:
        secondaryRect.current = node!.getBoundingClientRect();
        break;

      default:
    }
  }, []);

  return (
    <div className={classes.intervalContainer}>
      {secondaryInterval && (
        <div
          ref={animateIntervals}
          className={[classes.secondary, classes.interval].join(" ")}
        >
          <span>{secondaryInterval}</span>
          <div ref={strikeRef} className={classes.strikeThrough} />
        </div>
      )}
      <span
        ref={primaryRef}
        className={[classes.primary, classes.interval].join(" ")}
      >
        {primaryInterval}
      </span>
    </div>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  intervalContainer: {
    position: "relative",
    width: "100%",
    borderLeft: "1px solid grey",
    borderRight: "1px solid grey",
  },
  secondary: {
    color: "red",
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "14px",
  },
  strikeThrough: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -100%)",
    width: "110%",
    height: "1px",
    background: "red",
  },
  interval: {
    userSelect: "none",
    cursor: "default",
    whiteSpace: "nowrap",
  },
  primary: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontFamily: theme.typography.h1.fontFamily,
    fontSize: "20px",
  },
}));
// #endregion styles

// #region handleFlip
/**
 * Params for FLIP handling function
 */
interface FlipParams {
  /**
   * An element we're animating. This is an element in it's
   * destination, so we're using it's bounding client rect to calculate
   * FLIP values as well as to animate the element itself
   */
  node: HTMLElement;
  /**
   * A DOMRect of a prevoius position (an element we're animating from)
   */
  animateFrom: DOMRect;
  /**
   * Duration of an animation
   */
  duration: number;
  /**
   * Optional function, if specified, runs right after the animation finish
   */
  onFinish?: () => void;
  /**
   * Optional params for color transition: `[startColor, destinationColor]`
   */
  colorTransition?: [string, string];
}

/**
 * Performs `FLIP` (first, last, invert, play) animation as a transition between elements
 */
const handleFlip = ({
  node,
  animateFrom,
  duration,
  onFinish,
  colorTransition,
}: FlipParams) => {
  // first
  const { top: primY, height: primHeight, width: primWidth } = animateFrom;

  // last
  const {
    top: secY,
    height: secHeight,
    width: secWidth,
  } = node.getBoundingClientRect();

  // invert
  const offsetY = primY - secY - primHeight / 2;
  const scaleHeight = (100 * primHeight) / secHeight;
  const scaleWidth = (100 * primWidth) / secWidth;

  const animationSetup = [
    {
      transform: `translate(-50%, ${offsetY}px) scale(${scaleWidth}%, ${scaleHeight}%)`,
      ...(colorTransition ? { color: colorTransition[0] } : {}),
    },
    {
      transform: `translate(-50%, -50%) scale(100%, 100%)`,
      ...(colorTransition ? { color: colorTransition[1] } : {}),
    },
  ];

  // play
  const animation = node.animate(animationSetup, { duration });
  if (onFinish) animation.onfinish = onFinish;
};

/**
 * Handles strike through animation
 * @param node DOM node of element to animate
 */
const animateStrikeThrough = (node: HTMLElement) => {
  node.animate(
    [
      { transform: "translate(-100%, 0) scale(0%, 100%)" },
      { transform: "translate(-100%, 0) scale(0%, 100%)" },
      { transform: "translate(-50%, 0) scale(100%, 100%)" },
      { transform: "translate(-50%, 0) scale(100%, 100%)" },
    ],
    { duration: 500 }
  );
};

/**
 * Handles fade in of an element
 */
const handleFadeIn = (node: HTMLElement, duration: number) => {
  node.animate(
    [
      { transform: `translate(-50%, -50%) scale(0, 0)`, opacity: 0 },
      {
        transform: `translate(-50%, -50%) scale(50%, 50%)`,
        opacity: 0.5,
      },
      { transform: `translate(-50%, -50%) scale(1, 1)`, opacity: 1 },
    ],
    { duration }
  );
};
// #endregion handleFlip

export default IntervalUI;
