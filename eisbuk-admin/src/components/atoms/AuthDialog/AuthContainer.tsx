import React from "react";

import { ThemeProvider } from "@mui/material";
import Paper from "@mui/material/Paper";

import makeStyles from "@mui/styles/makeStyles";

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
  return <div className={classes.textMessage}>{children}</div>;
};

/** Styled component used as auth dialog content container */
const Content: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.authContent}>{children}</div>;
};
/** Styled container for action buttons */
export const ActionButtons: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.actionButtons}>{children}</div>;
};
/** Styled component used as auth dialog footer container */
const Footer: React.FC = ({ children }) => {
  const classes = useStyles();
  return (
    <div className={classes.authFooter}>
      <div>{children}</div>
    </div>
  );
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
  ActionButtons: React.FC;
}>;

const AuthContainer: React.FC<{
  style?: React.CSSProperties;
  className?: string;
  children: RenderFunction;
}> = ({ children, ...props }) => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={defaultTheme}>
      <Paper className={classes.container} elevation={4} {...props}>
        {children({ Header, Content, Footer, TextMessage, ActionButtons })}
      </Paper>
    </ThemeProvider>
  );
};

const useStyles = makeStyles((theme) => ({
  container: { position: "relative" },
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
  textMessage: {
    width: 360,
    padding: "0 24px",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  authContent: {
    padding: "0 24px",
  },
  actionButtons: {
    padding: "8px 24px 24px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  authFooter: {
    padding: "0 24px 24px 24px",
    display: "flex",
  },
}));

export default AuthContainer;
