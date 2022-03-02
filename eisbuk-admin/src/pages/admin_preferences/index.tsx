import React from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";

import FormControl from "@material-ui/core/FormControl";
import Button from "@material-ui/core/Button";

import { OrganizationData } from "eisbuk-shared";

import { ValidationMessage } from "@/enums/translations";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Divider, Typography } from "@material-ui/core";
import { updateOrganization } from "@/store/actions/organizationOperations";
import i18n from "@/i18next/i18n";

import { getLocalAuth } from "@/store/selectors/auth";

import AdminsField from "./AdminsField";
import FormSection from "@/components/atoms/FormSection";
import AppbarAdmin from "@/components/layout/AppbarAdmin";
import { getOrganizationSettings } from "@/store/selectors/app";

interface Props {
  organization: OrganizationData;
}
const smsFields = [
  {
    name: "smsFrom",
    label: "SMS From",
  },
  {
    name: "smsTemplate",
    label: "SMS Template",
    multiline: true,
  },
];

const emailFields = [
  {
    name: "emailNameFrom",
    label: "Email Name From",
  },
  {
    name: "emailFrom",
    label: "Email From",
  },
  {
    name: "emailTemplate",
    label: "Email Template",
    multiline: true,
  },
];
const nameField = [{ name: "Organization Name", label: "displayName" }];

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
});
// #endregion validations
const OrganizationSettings: React.FC<Props> = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const organization = useSelector(getOrganizationSettings);
  const userAuthInfo = useSelector(getLocalAuth);

  const handleSubmit = (orgData: OrganizationData) => {
    dispatch(updateOrganization(orgData));
  };

  const currentUser = userAuthInfo?.email || "";
  return (
    <>
      <AppbarAdmin />
      <div className={classes.title}>
        <Typography variant="h4">{`${
          organization.displayName || "Organization"
        }  Settings`}</Typography>
      </div>
      <div className={classes.content}>
        <Formik
          {...{ initialValues: { ...organization } }}
          onSubmit={handleSubmit}
          validateOnChange={false}
          validationSchema={OrganizationValidation}
        >
          {({ isSubmitting, isValidating, handleReset }) => (
            <>
              <AdminsField currentUser={currentUser} />
              <Divider />
              <Form className={classes.form}>
                <FormControl component="fieldset">
                  <FormSection content={nameField} />
                  <FormSection content={emailFields} name="Email" />
                  <FormSection content={smsFields} name="SMS" />
                </FormControl>

                <div className={classes.submitButtonArea}>
                  <Button
                    onClick={handleReset}
                    variant="contained"
                    disabled={isSubmitting || isValidating}
                    color="primary"
                  >
                    cancel
                  </Button>
                  <Button
                    variant="contained"
                    className={classes.saveButton}
                    disabled={isSubmitting || isValidating}
                    color="secondary"
                    aria-label={"save"}
                    type="submit"
                  >
                    save
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
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
export default OrganizationSettings;
