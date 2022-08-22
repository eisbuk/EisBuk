import React from "react";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, FormikHelpers } from "formik";

import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";

import { OrganizationData } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  ValidationMessage,
  useTranslation,
  OrganizationLabel,
} from "@eisbuk/translations";
import { Layout } from "@eisbuk/ui";

import makeStyles from "@mui/styles/makeStyles";

import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import AdminsField from "./AdminsField";
import FormSection from "@/components/atoms/FormSection";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";
import { NotificationsContainer } from "@/features/notifications/components";

import { updateOrganization } from "@/store/actions/organizationOperations";
import { getOrganizationSettings } from "@/store/selectors/app";
import { getLocalAuth } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";

import { isEmpty } from "@/utils/helpers";

import { adminLinks } from "@/data/navigation";
import { DateTime } from "luxon";

const smsFields = [
  {
    name: "smsFrom",
    label: OrganizationLabel.SmsFrom,
  },
  {
    name: "smsTemplate",
    label: OrganizationLabel.SmsTemplate,
    multiline: true,
  },
];

const emailFields = [
  {
    name: "emailNameFrom",
    label: OrganizationLabel.EmailNameFrom,
  },
  {
    name: "emailFrom",
    label: OrganizationLabel.EmailFrom,
  },
  {
    name: "emailTemplate",
    label: OrganizationLabel.EmailTemplate,
    multiline: true,
  },
];

const generalFields = [
  {
    name: "displayName",
    label: OrganizationLabel.DisplayName,
  },
  { name: "location", label: OrganizationLabel.Location },
];

// #region validations
const OrganizationValidation = Yup.object().shape({
  smsFrom: Yup.string()
    .matches(/^[a-z0-9]+$/, i18n.t(ValidationMessage.InvalidSmsFrom))
    .max(11, i18n.t(ValidationMessage.InvalidSmsFromLength)),
  displayName: Yup.string().required(),
});
// #endregion validations
const OrganizationSettings: React.FC = () => {
  const dispatch = useDispatch();
  const organization = useSelector(getOrganizationSettings);
  const userAuthInfo = useSelector(getLocalAuth);
  const { t } = useTranslation();
  const classes = useStyles();

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );
  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  const handleSubmit = (
    orgData: OrganizationData,
    actions: FormikHelpers<OrganizationData>
  ) => {
    dispatch(updateOrganization(orgData, actions.setSubmitting));
  };

  const currentUser = userAuthInfo?.email || "";
  if (isEmpty(organization)) {
    return null;
  }

  const initialValues: OrganizationData = {
    // Set up fallbacks
    admins: [],
    displayName: "",
    emailFrom: "",
    emailNameFrom: "",
    emailTemplate: "",
    existingSecrets: [],
    location: "",
    smsFrom: "",
    smsTemplate: "",

    // Override fallbacks with any defined organizaiton data
    ...organization,
  };

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
    >
      <div className={classes.title}>
        <Typography variant="h4">{`${
          organization?.displayName || "Organization"
        }  Settings`}</Typography>
      </div>
      <div className={classes.content}>
        <Formik
          {...{ initialValues }}
          onSubmit={(values, actions) => handleSubmit(values, actions)}
          validateOnChange={false}
          validationSchema={OrganizationValidation}
        >
          {({ isSubmitting, isValidating, handleReset }) => (
            <>
              <AdminsField currentUser={currentUser} />

              <Divider />
              <Form className={classes.form}>
                <FormControl component="fieldset">
                  <FormSection content={generalFields} name="General" />
                  <FormSection content={emailFields} name="Email" />
                  <FormSection content={smsFields} name="SMS" />
                </FormControl>

                <div className={classes.submitButtonArea}>
                  <Button
                    onClick={handleReset}
                    variant="contained"
                    disabled={isSubmitting || isValidating}
                    color="primary"
                    className={classes.buttonPrimary}
                  >
                    {t(ActionButton.Cancel)}
                  </Button>
                  <Button
                    variant="contained"
                    disabled={isSubmitting || isValidating}
                    color="secondary"
                    className={[
                      classes.saveButton,
                      classes.buttonSecondary,
                    ].join(" ")}
                    aria-label={"save"}
                    type="submit"
                  >
                    {t(ActionButton.Save)}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
    </Layout>
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
  // The following is a workaround to not overrule the Mui base button styles
  // by Tailwind's preflight reset
  buttonPrimary: { backgroundColor: theme.palette.primary.main },
  buttonSecondary: { backgroundColor: theme.palette.secondary.main },
  smsFromField: {
    width: "21rem",
    marginRight: theme.spacing(2),
  },
}));
// #endregion styles
export default OrganizationSettings;
