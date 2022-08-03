import React from "react";
import { Field, FieldProps } from "formik";

import { useTranslation, CustomerLabel } from "@eisbuk/translations";

import {
  User,
  Cake,
  Mail,
  Phone,
  ClipboardList,
  SheildCheck,
} from "@eisbuk/svg";

import TextInput, { IconAdornment } from "../../../TextInput";
import DateInput from "../../../DateInput";
import Checkbox from "../../../Checkbox";

import Section from "./Section";

const CustomerDetailsForm: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Section title="Personal Details" subtitle="Manage your personal details">
        <div className="sm:grid sm:grid-cols-6 gap-x-6 gap-y-2 md:border-b-2 md:border-gray-100">
          <div className="col-span-3">
            <Field name="name">
              {(field: FieldProps) => (
                <TextInput
                  formikField={field}
                  label={t(CustomerLabel.Name)}
                  StartAdornment={
                    <IconAdornment Icon={User} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-3">
            <Field name="surname">
              {(field: FieldProps) => (
                <TextInput
                  formikField={field}
                  label={t(CustomerLabel.Surname)}
                  StartAdornment={
                    <IconAdornment Icon={User} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-4">
            <Field name="birthday">
              {(field: FieldProps) => (
                <DateInput
                  formikField={field}
                  label={t(CustomerLabel.Birthday)}
                  StartAdornment={
                    <IconAdornment Icon={Cake} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-3">
            <Field name="email">
              {(field: FieldProps) => (
                <TextInput
                  formikField={field}
                  label={t(CustomerLabel.Email)}
                  StartAdornment={
                    <IconAdornment Icon={Mail} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-3">
            <Field name="phone">
              {(field: FieldProps) => (
                <TextInput
                  formikField={field}
                  label={t(CustomerLabel.Phone)}
                  StartAdornment={
                    <IconAdornment Icon={Phone} position="start" />
                  }
                />
              )}
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Medical Details" subtitle="Manage your medical details">
        <div className="grid sm:grid-cols-6 gap-y-2">
          <div className="col-span-4">
            <Field name="certificateExpiration">
              {(field: FieldProps) => (
                <DateInput
                  formikField={field}
                  label={t(CustomerLabel.CertificateExpiration)}
                  StartAdornment={
                    <IconAdornment Icon={ClipboardList} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-4">
            <Field name="covidCertificateReleaseDate">
              {(field: FieldProps) => (
                <DateInput
                  formikField={field}
                  label={t(CustomerLabel.CovidCertificateReleaseDate)}
                  StartAdornment={
                    <IconAdornment Icon={SheildCheck} position="start" />
                  }
                />
              )}
            </Field>
          </div>
          <div className="col-span-4">
            <Field name="covidCertificateSuspended" type="checkbox">
              {(field: FieldProps) => (
                <Checkbox
                  formikField={field}
                  label={t(CustomerLabel.CovidCertificateSuspended)}
                  helpText="Check this box if your COVID certificate is more than 9 months old"
                />
              )}
            </Field>
          </div>
        </div>
      </Section>
    </>
  );
};

export default CustomerDetailsForm;
