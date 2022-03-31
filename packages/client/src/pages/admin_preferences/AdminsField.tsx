import React, { useState } from "react";

import { Field, Form, useField } from "formik";

import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Cancel from "@mui/icons-material/Cancel";

import makeStyles from "@mui/styles/makeStyles";

import IconButton from "@mui/material/IconButton";

import {
  useTranslation,
  ActionButton,
  OrganizationLabel,
} from "@eisbuk/translations";

const AdminsField: React.FC<{
  currentUser: string;
}> = ({ currentUser }) => {
  const [{ value: admins }, , { setValue }] = useField<string[]>("admins");

  const classes = useStyles();
  const { t } = useTranslation();

  const [admin, setAdmin] = useState("");
  const handleSetAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdmin(e.target.value);
  };
  const removeAdmin = (admin: string) => {
    if (admin === currentUser) return;

    const filteredAdmins = admins.filter((a) => a !== admin);
    setValue(filteredAdmins);
  };

  const addAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // should not add empty strings or duplicate entries
    if (admins.includes(admin) || admin === "") return;

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
    <Form onSubmit={(e) => addAdmin(e)}>
      <h5 className={classes.sectionTitle}>{t(OrganizationLabel.Admins)}</h5>
      <FormControl>
        <div className={classes.fieldSection}>
          {admins.map((admin, i) => (
            <div key={admin} className={classes.adminFieldGroup}>
              <Field
                name={`admins[${i}]`}
                onChange={updateAdmin(i)}
                component={TextField}
                value={admin}
                variant="outlined"
                disabled={admin === currentUser}
              />
              {admin !== currentUser && (
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
        {
          <div className={classes.addAdmin}>
            <Field
              name="newAdmin"
              component={TextField}
              onChange={handleSetAdmin}
              value={admin}
              placeholder={t(OrganizationLabel.AddNewAdmin)}
              variant="outlined"
            />

            <Button
              color="primary"
              variant="contained"
              className={classes.addAdminButton}
              type="submit"
            >
              {t(ActionButton.Add)}
            </Button>
          </div>
        }
      </FormControl>
    </Form>
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

export default AdminsField;
