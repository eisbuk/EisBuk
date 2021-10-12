import makeStyles from "@material-ui/core/styles/makeStyles";

export const useFormStyles = makeStyles(() => ({
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: "4rem",
  },
  title: {
    marginBottom: "1rem",
    textAlign: "center",
  },
  splitPane: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
  },
  splitPaneItem: {
    width: "45%",
  },
  field: {
    display: "flex",
    alignItems: "stretch",
    marginBottom: "1rem",
  },
  button: {
    width: "40%",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
}));
