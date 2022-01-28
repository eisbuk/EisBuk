import React, { useState } from "react";
import { OrganizationData } from "eisbuk-shared/dist";
// import { useTranslation } from "react-i18next";

// import { useDispatch } from "react-redux";
import { Formik, Field, Form, useField } from "formik";

import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Cancel from "@material-ui/icons/Cancel";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Divider, IconButton, Typography } from "@material-ui/core";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { getLocalAuth } from "@/store/selectors/auth";

interface Props {
  organization: OrganizationData;
}
const OrganizationSettings: React.FC<Props> = ({ organization }) => {
  const classes = useStyles();
  const userAuthInfo = useSelector(getLocalAuth);

  const [enableEdit, setEnableEdit] = useState(false);
  const handleSubmit = (orgData: OrganizationData) => {
    console.log({ orgData });
    // useDispatch
    setEnableEdit(false);
  };

  const handleEnableEdit = () => {
    setEnableEdit(!enableEdit);
  };
  const currentUser = userAuthInfo?.email || "";
  return (
    <>
      <div className={classes.title}>
        <Typography variant="h4">Organization Settings</Typography>
      </div>
      <div className={classes.content}>
        {/* <Typography variant="h4">Organization Settings</Typography> */}

        <Formik
          {...{ initialValues: { ...organization } }}
          onSubmit={handleSubmit}
          validateOnChange={false}
        >
          {({ errors, isSubmitting, isValidating }) => (
            <Form className={classes.form}>
              <FormControl component="fieldset">
                <h5 className={classes.intervalsTitle}>Admins</h5>
                <AdminsField
                  enableEdit={enableEdit}
                  currentUser={currentUser}
                />
                <Divider />
                <h5 className={classes.intervalsTitle}>SMTP</h5>

                <div className={classes.fieldSection}>
                  <Field
                    label="SMTP Server"
                    name="SMTPServer"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMTPServer"
                    placeholder="SMTP server here"
                    variant="outlined"
                    value={organization.SMTPServer}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="SMTP Port"
                    name="SMTPPort"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMTPPort"
                    placeholder="SMTP port here"
                    variant="outlined"
                    value={organization.SMTPPort}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="SMTP Port"
                    name="SMTPPort"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMTPPort"
                    placeholder="SMTP port here"
                    variant="outlined"
                    value={organization.SMTPPort}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="SMTP Username"
                    name="SMTPUsername"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMTPUsername"
                    placeholder="SMTP Username here"
                    variant="outlined"
                    value={organization.SMTPUsername}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="SMTP Password"
                    name="SMTPPassword"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMTPPassword"
                    placeholder="SMTP Password here"
                    variant="outlined"
                    value={organization.SMTPPassword}
                    disabled={!enableEdit}
                  />
                </div>
                <h5 className={classes.intervalsTitle}>Email</h5>
                <div className={classes.fieldSection}>
                  <Field
                    label="Email From"
                    name="EmailFrom"
                    className={classes.field}
                    as={TextField}
                    aria-label="EmailFrom"
                    placeholder="Email From here"
                    variant="outlined"
                    value={organization.EmailFrom}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="Name From"
                    name="NameFrom"
                    className={classes.field}
                    as={TextField}
                    aria-label="NameFrom"
                    placeholder="Name From here"
                    variant="outlined"
                    value={organization.NameFrom}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="Email Template"
                    name="EmailTemplate"
                    className={classes.templateField}
                    as={TextField}
                    aria-label="EmailTemplate"
                    placeholder="Email Template here"
                    variant="outlined"
                    multiline
                    rows="4"
                    value={organization.EmailTemplate}
                    disabled={!enableEdit}
                  />
                </div>
                <h5 className={classes.intervalsTitle}>SMS</h5>
                <div className={classes.fieldSection}>
                  <Field
                    label="SMS From"
                    name="SMSFrom"
                    className={classes.field}
                    as={TextField}
                    aria-label="SMSFrom"
                    placeholder="SMS From here"
                    variant="outlined"
                    value={organization.SMSFrom}
                    disabled={!enableEdit}
                  />
                  <Field
                    label="SMS Template"
                    name="SMSTemplate"
                    className={classes.templateField}
                    as={TextField}
                    aria-label="SMSTemplate"
                    placeholder="SMS Template here"
                    variant="outlined"
                    multiline
                    rows="4"
                    value={organization.SMSTemplate}
                    disabled={!enableEdit}
                  />
                </div>
              </FormControl>

              <div className={classes.submitButtonArea}>
                {!enableEdit && (
                  <Button
                    onClick={handleEnableEdit}
                    variant="contained"
                    disabled={
                      Boolean(Object.keys(errors).length) &&
                      (isSubmitting || isValidating)
                    }
                    color="primary"
                    aria-label={"edit"}
                  >
                    {"edit"}
                  </Button>
                )}

                {enableEdit && (
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={
                      Boolean(Object.keys(errors).length) &&
                      (isSubmitting || isValidating)
                    }
                    color="primary"
                    aria-label={"save"}
                  >
                    {"save"}
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

const AdminsField: React.FC<{ enableEdit: boolean; currentUser: string }> = ({
  enableEdit,
  currentUser,
}) => {
  const [{ value: admins }, , { setValue }] = useField<string[]>("admins");

  const classes = useStyles();
  const [admin, setAdmin] = useState("");

  const handleSetAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdmin(e.target.value);
  };
  const removeAdmin = (admin: string) => {
    if (admin === currentUser) return;
    const filteredAdmins = admins.filter((a) => a !== admin);
    setValue(filteredAdmins);
  };
  const addAdmin = () => {
    console.log(admin);
    if (admin === "") return;
    const newAdmins = [...admins, admin];
    setValue(newAdmins);
    setAdmin("");
  };

  const updateAdmin =
    (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const adminsCopy = [...admins];
      adminsCopy[i] = e.target.value;
      setValue(adminsCopy);
    };

  return (
    <>
      {console.log({ enableEdit })}
      <div className={classes.fieldSection}>
        {admins.map((admin, i) => (
          <div
            key={admin}
            className={clsx({
              [classes.adminFieldGroup]: enableEdit,
              [classes.disabledAdminFieldGroup]: !enableEdit,
            })}
          >
            <Field
              name={`admins[${i}]`}
              onChange={updateAdmin(i)}
              component={TextField}
              value={admin}
              variant="outlined"
              disabled={!enableEdit || admin === currentUser}
            />
            {enableEdit && admin !== currentUser && (
              <IconButton
                type="button"
                className={classes.closeButton}
                onClick={() => removeAdmin(admin)}
              >
                <Cancel />
              </IconButton>
            )}
          </div>
        ))}
      </div>
      {enableEdit && (
        <div className={classes.addAdmin}>
          <Field
            name={`newAdmin`}
            component={TextField}
            onChange={handleSetAdmin}
            value={admin}
            placeholder="Add admin"
            variant="outlined"
          />

          <Button
            onClick={addAdmin}
            color="primary"
            variant="contained"
            className={classes.addAdminButton}
          >
            Add
          </Button>
        </div>
      )}
    </>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    width: "23rem",
  },
  fieldSection: {
    display: "flex",
    flexFlow: "wrap",
  },
  intervalsTitle: {
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
    // marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "12.5rem",
  },
  disabledAdminFieldGroup: {
    display: "flex",
    // marginTop: theme.spacing(2),
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
}));
// #endregion styles
export default OrganizationSettings;
