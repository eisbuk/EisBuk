import React, { useState } from "react";
import { Field, Form, useField } from "formik";

import { Button, ButtonColor, TextInput, IconButton } from "@eisbuk/ui";
import {
  useTranslation,
  ActionButton,
  OrganizationLabel,
} from "@eisbuk/translations";
import { XCircle } from "@eisbuk/svg";

const AdminsField: React.FC<{
  currentUser: string;
}> = ({ currentUser }) => {
  const [{ value: admins }, , { setValue }] = useField<string[]>("admins");

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
      <div className="pb-8">
        <h2 className="text-xl text-gray-700 font-medium tracking-wide">
          {t(OrganizationLabel.Admins)}
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {admins.map((admin, i) => (
          <div key={admin}>
            <Field
              name={`admins[${i}]`}
              onChange={updateAdmin(i)}
              component={TextInput}
              value={admin}
              disabled={admin === currentUser}
              EndAdornment={
                admin !== currentUser && (
                  <IconButton
                    className="text-gray-500"
                    type="button"
                    onClick={() => removeAdmin(admin)}
                  >
                    <XCircle />
                  </IconButton>
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="ml-full w-auto">
        <Field
          name="newAdmin"
          className="ml-full w-[220px]"
          component={TextInput}
          onChange={handleSetAdmin}
          value={admin}
          placeholder={t(OrganizationLabel.AddNewAdmin)}
          EndAdornment={
            <Button
              className="h-full !px-4"
              color={ButtonColor.Primary}
              type="submit"
            >
              {t(ActionButton.Add)}
            </Button>
          }
        />
      </div>
    </Form>
  );
};

export default AdminsField;
