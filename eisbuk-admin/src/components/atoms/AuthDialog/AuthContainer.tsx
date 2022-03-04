import React from "react";

import Typography from "@material-ui/core/Typography";

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
/** Styled text message */
const TextMessage: React.FC = ({ children }) => {
  const classes = useStyles();
  return (
    <Typography className={classes.authMessage} variant="body1">
      {children}
    </Typography>
  );
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
  TextMessage: React.FC;
}>;

const AuthContainer: React.FC<{
  style?: React.CSSProperties;
  className?: string;
  children: RenderFunction;
}> = ({ children, ...props }) => (
  <ThemeProvider theme={defaultTheme}>
    <div {...props}>{children({ Header, Content, Footer, TextMessage })}</div>
  </ThemeProvider>
);

const useStyles = makeStyles((theme) => ({
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
  authMessage: {
    display: "block",
    // we want to keep the paddings (24px on each side)
    // on small screens, we want to leave the 24px around the container
    width: 312,
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
}));

export default AuthContainer;
