import React from "react";
import { OrganizationData } from "eisbuk-shared/dist";

import { Field, FormikErrors } from "formik";

import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";

import makeStyles from "@material-ui/core/styles/makeStyles";

import ErrorMessage from "@/components/atoms/ErrorMessage";

interface Props {
  enableEdit: boolean;
  values: OrganizationData;
  errors: FormikErrors<OrganizationData>;
}
interface FieldProps {
  name: string;
  label: string;
  multiline: boolean;
  isValidated: boolean;
}
const smsFields: FieldProps[] = [
  {
    name: "smsFrom",
    label: "SMS From",
    multiline: false,
    isValidated: true,
  },
  {
    name: "smsTemplate",
    label: "SMS Template",
    multiline: true,

    isValidated: false,
  },
];

const emailFields: FieldProps[] = [
  {
    name: "emailNameFrom",
    label: "Email Name From",
    multiline: false,
    isValidated: false,
  },
  {
    name: "emailFrom",
    label: "Email From",
    multiline: false,
    isValidated: false,
  },
  {
    name: "emailTemplate",
    label: "Email Template",
    multiline: true,

    isValidated: false,
  },
];
const sections = [
  { name: "Email", content: emailFields },
  { name: "SMS", content: smsFields },
];

const Fields: React.FC<Props> = ({ enableEdit, values, errors }) => {
  const classes = useStyles();
  return (
    <>
      {sections.map(({ name, content }) => (
        <div key={name}>
          <h5 className={classes.sectionTitle}>{name}</h5>
          <div className={classes.fieldSection}>
            {content.map((field) => (
              <div key={field.name}>
                <Field
                  label={field.label}
                  name={field.name}
                  className={
                    field.name?.includes("Template")
                      ? classes.templateField
                      : classes.field
                  }
                  as={TextField}
                  aria-label={field.label}
                  variant={enableEdit ? "outlined" : "filled"}
                  disabled={!enableEdit}
                  multiline={field.multiline}
                  rows={field.name?.includes("Template") ? "4" : "1"}
                  value={values[`${field.name}`] || ""}
                />
                {<ErrorMessage>{errors.smsFrom}</ErrorMessage>}
              </div>
            ))}
          </div>
          <Divider />
        </div>
      ))}
    </>
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
export default Fields;
