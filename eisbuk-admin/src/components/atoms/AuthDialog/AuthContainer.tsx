import React from "react";

import makeStyles from "@material-ui/core/styles/makeStyles";
import { ThemeProvider } from "@material-ui/core";

import { muiDefault as defaultTheme } from "@/themes";

/** Styled component used as auth dialog header container */
const Header: React.FC = ({ children }) => {
  const classes = useStyles();

  const content =
    // provide default styling for title
    typeof children === "string" ? (
      <h1 className={classes.headerTitle}>{children}</h1>
    ) : (
      children
    );

  return <div className={classes.authHeader}>{content}</div>;
};
/** Styled component used as auth dialog content container */
const Content: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.authContent}>{children}</div>;
};
/** Styled component used as auth dialog footer container */
const Footer: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.authFooter}>{children}</div>;
};

/**
 * Render prop passed as `children` to `AuthContainer`
 * called with `Header`, `Content` and `Footer` styled containers
 * for easier rendering
 */
type RenderFunction = React.FC<{
  Header: React.FC;
  Content: React.FC;
  Footer: React.FC;
}>;

const AuthContainer: React.FC<{
  style?: React.CSSProperties;
  className?: string;
  children: RenderFunction;
}> = ({ children, ...props }) => (
  <ThemeProvider theme={defaultTheme}>
    <div {...props}>{children({ Header, Content, Footer })}</div>
  </ThemeProvider>
);

const useStyles = makeStyles(() => ({
  authHeader: {
    padding: "24px 24px 0 24px",
  },
  headerTitle: {
    fontWeight: 500,
    fontSize: 20,
    lineHeight: "24px",
    paddingBottom: 16,
    margin: 0,
  },
  authContent: {
    padding: "0 24px",
  },
  authFooter: {
    padding: "0 24px 24px 24px",
  },
}));

export default AuthContainer;
