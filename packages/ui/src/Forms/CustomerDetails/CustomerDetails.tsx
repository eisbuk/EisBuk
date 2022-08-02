import React, { useState } from "react";

import { Customer } from "@eisbuk/shared";

import Edit, { FormInputProps } from "./views/Edit";
import Display from "./views/Display";

const defaultCustomerFormValues = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  birthday: "",
  certificateExpiration: "",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: false,
};

const CustomerDetails: React.FC<FormInputProps> = ({
  customer,
  onCancel = () => {},
  onSave = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing(!isEditing);

  const initialValues = {
    ...defaultCustomerFormValues,
    ...customer,
  };

  const handleCancel = () => {
    onCancel();
    toggleEdit();
  };

  const handleSave = (customer: Customer) => {
    onSave(customer);
    toggleEdit();
  };

  return (
    <>
      {isEditing ? (
        <Edit
          onCancel={handleCancel}
          onSave={handleSave}
          customer={initialValues}
        />
      ) : (
        <Display onEdit={toggleEdit} customer={initialValues} />
      )}
    </>
  );
};

export default CustomerDetails;
