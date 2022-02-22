import React, { useState } from "react";
import { OrganizationData } from "eisbuk-shared/dist";

import { Formik, Field, Form, useField } from "formik";

import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Cancel from "@material-ui/icons/Cancel";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Divider, IconButton, Typography } from "@material-ui/core";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { getLocalAuth } from "@/store/selectors/auth";
import { updateOrganization } from "@/store/actions/organizationOperations";

interface Props {
  organization: OrganizationData;
}

interface FieldProps {
  name: string;
  label: string;
}
const OrganizationSettings: React.FC<Props> = ({ organization }) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const userAuthInfo = useSelector(getLocalAuth);

  const [enableEdit, setEnableEdit] = useState(false);

  const handleSubmit = (orgData: OrganizationData) => {
    dispatch(updateOrganization(orgData, organization.organizationName || ""));
    setEnableEdit(false);
  };

  const handleEnableEdit = (resetForm: () => void) => {
    if (enableEdit) resetForm();
    setEnableEdit(!enableEdit);
  };

  const smtpFields: Partial<FieldProps>[] = [
    {
      name: "smtpUri",
      label: "SMTP URI",
    },
  ];
  const emailFields: Partial<FieldProps>[] = [
    {
      name: "emailSender",
      label: "Email Sender Name",
    },
    {
      name: "emailFrom",
      label: "Email From",
    },
    {
      name: "emailTemplate",
      label: "Email Template",
    },
  ];
  const smsFields: Partial<FieldProps>[] = [
    {
      name: "smsFrom",
      label: "SMS From",
    },
    {
      name: "smsUrl",
      label: "SMS Url",
    },
    {
      name: "smsTemplate",
      label: "SMS Template",
    },
  ];

  const currentUser = userAuthInfo?.email || "";
  return (
    <>
      <div className={classes.title}>
        <Typography variant="h4">{`${organization.organizationName} Settings`}</Typography>
      </div>
      <div className={classes.content}>
        <Formik
          {...{ initialValues: { ...organization } }}
          onSubmit={handleSubmit}
          validateOnChange={false}
        >
          {({ errors, isSubmitting, isValidating, values, resetForm }) => (
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
                  {smtpFields.map((field) => (
                    <Field
                      key={field.name}
                      {...field}
                      className={classes.field}
                      as={TextField}
                      aria-label={field.label}
                      variant={enableEdit ? "outlined" : "filled"}
                      disabled={!enableEdit}
                      value={values[`${field.name}`] || ""}
                    />
                  ))}
                </div>
                <h5 className={classes.intervalsTitle}>Email</h5>
                <div className={classes.fieldSection}>
                  {emailFields.map((field) => (
                    <Field
                      key={field.name}
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
                      multiline={
                        field.name?.includes("Template") ? true : false
                      }
                      rows={field.name?.includes("Template") ? "4" : "1"}
                      value={values[`${field.name}`] || ""}
                    />
                  ))}
                </div>
                <h5 className={classes.intervalsTitle}>SMS</h5>
                <div className={classes.fieldSection}>
                  {smsFields.map((field) => (
                    <Field
                      key={field.name}
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
                      multiline={
                        field.name?.includes("Template") ? true : false
                      }
                      rows={field.name?.includes("Template") ? "4" : "1"}
                      value={values[`${field.name}`] || ""}
                    />
                  ))}
                </div>
              </FormControl>

              <div className={classes.submitButtonArea}>
                <Button
                  onClick={() => handleEnableEdit(resetForm)}
                  variant="contained"
                  disabled={
                    Boolean(Object.keys(errors).length) &&
                    (isSubmitting || isValidating)
                  }
                  color="primary"
                  aria-label={enableEdit ? "cancel" : "edit"}
                >
                  {enableEdit ? "cancel" : "edit"}
                </Button>

                {enableEdit && (
                  <Button
                    variant="contained"
                    className={classes.saveButton}
                    disabled={
                      Boolean(Object.keys(errors).length) &&
                      (isSubmitting || isValidating)
                    }
                    color="secondary"
                    aria-label={"save"}
                    type="submit"
                  >
                    save
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

const AdminsField: React.FC<{
  enableEdit: boolean;
  currentUser: string;
}> = ({ enableEdit, currentUser }) => {
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
              variant={enableEdit ? "outlined" : "filled"}
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
            variant={enableEdit ? "outlined" : "filled"}
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
    width: "21rem",
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
  saveButton: {
    marginLeft: "1rem",
  },
}));
// #endregion styles
export default OrganizationSettings;
