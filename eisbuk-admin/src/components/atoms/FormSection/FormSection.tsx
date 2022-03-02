import React from "react";

import { Field, useFormikContext } from "formik";
import { useTranslation } from "react-i18next";

import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";

import makeStyles from "@material-ui/core/styles/makeStyles";

import ErrorMessage from "@/components/atoms/ErrorMessage";
import { OrganizationLabel } from "@/enums/translations";

interface FieldProps {
  name: string;
  multiline?: boolean;
}

interface Props {
  name?: string;
  content: FieldProps[];
}

const FormSection: React.FC<Props> = ({ name, content }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const { errors } = useFormikContext();

  return (
    <div>
      {name && <h5 className={classes.sectionTitle}>{name}</h5>}
      <div className={classes.fieldSection}>
        {content.map(({ name, multiline }) => (
          <div key={name}>
            <Field
              label={t(OrganizationLabel[name])}
              name={name}
              className={multiline ? classes.templateField : classes.field}
              as={TextField}
              variant="outlined"
              multiline={multiline}
              {...(multiline ? { rows: "4" } : {})}
            />
            {<ErrorMessage>{errors[name]}</ErrorMessage>}
          </div>
        ))}
      </div>
      <Divider />
    </div>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    width: "21rem",
  },
  fieldSection: {
    display: "flex",
    flexFlow: "wrap",
  },
  sectionTitle: {
    letterSpacing: 1,
    fontSize: theme.typography.pxToRem(18),
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
  addAdminButton: {
    marginLeft: theme.spacing(3),
    borderRadius: theme.spacing(100),
  },
  adminFieldGroup: {
    display: "flex",
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "12.5rem",
  },
  disabledAdminFieldGroup: {
    display: "flex",
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    width: "11rem",
  },
  adminsList: {
    display: "flex",
    flexFlow: "wrap",
  },

  content: {
    width: "50rem",
    padding: "3rem",
  },
  closeButton: {
    transform: "translate(-150%,-25%)",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    width: "0px",
  },
  addAdmin: {
    marginBottom: theme.spacing(3),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },
  submitButtonArea: {
    display: "flex",
    padding: "8px",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  templateField: {
    width: "47rem",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  title: {
    position: "relative",
    fontWeight: 600,
    padding: 20,
    background: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.contrastText,
  },
  saveButton: {
    marginLeft: "1rem",
  },
  smsFromField: {
    width: "21rem",
    marginRight: theme.spacing(2),
  },
}));
// #endregion styles
export default FormSection;
