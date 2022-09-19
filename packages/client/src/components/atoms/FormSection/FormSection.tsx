import React from "react";
import { Field, FieldProps } from "formik";
import { TextField } from "formik-mui";

import Divider from "@mui/material/Divider";

import makeStyles from "@mui/styles/makeStyles";

import { useTranslation, OrganizationLabel } from "@eisbuk/translations";

export interface FormSectionFieldProps {
  name: string;
  label: OrganizationLabel;
  multiline?: boolean;
  component?: React.FC<Pick<FieldProps, "field">>;
}
interface Props {
  name?: string;
  content: FormSectionFieldProps[];
}

const FormSection: React.FC<Props> = ({ name, content }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div>
      {name && (
        <h5 className={classes.sectionTitle}>{t(OrganizationLabel[name])}</h5>
      )}
      <div className={classes.fieldSection}>
        {content.map(({ name, multiline, label, component = TextField }) => {
          return (
            <div key={name}>
              <Field
                label={t(label)}
                name={name}
                className={multiline ? classes.templateField : classes.field}
                component={component}
                variant="outlined"
                multiline={multiline}
                {...(multiline ? { rows: "4" } : {})}
              />
            </div>
          );
        })}
      </div>
      <Divider />
    </div>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginBottom: theme.spacing(2),
    marginRight: theme.spacing(2),
    width: "21rem",
  },
  fieldSection: {
    display: "flex",
    flexFlow: "wrap",
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
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
