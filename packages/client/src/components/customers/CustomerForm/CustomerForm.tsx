import React from "react";
import * as Yup from "yup";
import { Formik, Form, FastField } from "formik";

import {
  Category,
  Customer,
  CustomerLoose,
  DeprecatedCategory,
} from "@eisbuk/shared";
import i18n, {
  useTranslation,
  CustomerLabel,
  CustomerFormTitle,
  ValidationMessage,
  ActionButton,
  CategoryLabel,
} from "@eisbuk/translations";
import {
  TextInput,
  PhoneInput,
  IconAdornment,
  DateInput,
  Checkbox,
  Button,
  ButtonColor,
  ButtonSize,
} from "@eisbuk/ui";
import {
  AccountCircle,
  Mail,
  Cake,
  FolderOpen,
  Identification,
} from "@eisbuk/svg";

import { defaultCustomerFormValues } from "@/lib/data";

import { isISODay } from "@/utils/date";
import { isValidPhoneNumber } from "@/utils/helpers";

// #region validations
const CustomerValidation = Yup.object().shape({
  name: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  surname: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  email: Yup.string().email(i18n.t(ValidationMessage.Email)),
  phone: Yup.string().test({
    test: (input) => !input || isValidPhoneNumber(input),
    message: i18n.t(ValidationMessage.InvalidPhone),
  }),
  birthday: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateReleaseDate: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateSuspended: Yup.boolean(),
  categories: Yup.array()
    .required(i18n.t(ValidationMessage.RequiredField))
    .min(1, i18n.t(ValidationMessage.RequiredEntry))
    .of(Yup.string()),
  subscriptionNumber: Yup.number(),
});
// #endregion validations

// #region mainComponent
export interface CustomerFormProps {
  className?: string;
  customer?: Partial<Customer>;
  onCancel?: () => void;
  onUpdateCustomer?: (customer: CustomerLoose) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  className = "",
  onUpdateCustomer = () => {},
  onCancel = () => {},
}) => {
  const { t } = useTranslation();

  // Include deprecated categories for backwards compatibility
  type CategoryString = DeprecatedCategory | Category;

  const deprecatedCategories: CategoryString[] =
    Object.values(DeprecatedCategory);
  const availableCategories = (
    Object.values(Category) as CategoryString[]
  ).concat(deprecatedCategories);

  const categoryOptions = availableCategories.map((category) => ({
    value: category,
    label: t(CategoryLabel[category]),
    disabled: deprecatedCategories.includes(category),
  }));

  const editCustomerTitle = `${t(CustomerFormTitle.EditCustomer)} (${
    customer?.name
  } ${customer?.surname})`;
  const newCustomerTitle = t(CustomerFormTitle.NewCustomer);
  const title = customer?.name ? editCustomerTitle : newCustomerTitle;

  interface FieldSetup {
    name: string;
    label: string;
    // TODO: This should be an SVGComponent
    Icon?: string;
    component?: React.FC<any>;
    fieldSet?: {
      label: string;
      value: string;
      disabled?: boolean;
    }[];
  }

  const fields: FieldSetup[] = [
    {
      name: "name",
      label: i18n.t(CustomerLabel.Name),
      Icon: AccountCircle,
    },
    {
      name: "surname",
      label: i18n.t(CustomerLabel.Surname),
      Icon: AccountCircle,
    },
    {
      name: "email",
      label: i18n.t(CustomerLabel.Email),
      Icon: Mail,
    },
    {
      name: "phone",
      label: i18n.t(CustomerLabel.Phone),
      component: PhoneInput,
    },
    {
      name: "birthday",
      label: i18n.t(CustomerLabel.Birthday),
      Icon: Cake,
      component: DateInput,
    },
    {
      name: "categories",
      label: i18n.t(CustomerLabel.Categories),
      fieldSet: categoryOptions,
    },
    {
      name: "covidCertificateReleaseDate",
      label: i18n.t(CustomerLabel.CovidCertificateReleaseDate),
      Icon: FolderOpen,
      component: DateInput,
    },
    {
      name: "certificateExpiration",
      label: i18n.t(CustomerLabel.CertificateExpiration),
      Icon: FolderOpen,
      component: DateInput,
    },
    {
      name: "covidCertificateSuspended",
      label: i18n.t(CustomerLabel.CovidCertificateSuspended),
      component: Checkbox,
    },
    {
      name: "subscriptionNumber",
      label: i18n.t(CustomerLabel.CardNumber),
      Icon: Identification,
    },
  ];

  return (
    <div
      className={[
        className,
        "max-h-[90vh]",
        "overflow-y-auto",
        "rounded-lg",
        "bg-white",
        "p-6",
      ].join(" ")}
    >
      <h1 id="form-dialog-title" className="mb-6 text-2xl">
        {title}
      </h1>
      <Formik
        validateOnChange={false}
        initialValues={{
          ...defaultCustomerFormValues,
          ...(customer || ({} as Customer)),
        }}
        validationSchema={CustomerValidation}
        onSubmit={onUpdateCustomer}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form autoComplete="off">
            <div className="mb-6 space-y-4 items-stretch">
              <input
                type="hidden"
                name="id"
                value={(customer && customer.id) || ""}
              />

              {fields.map(
                ({ Icon, component, fieldSet, name, label, ...field }) => {
                  if (fieldSet?.length) {
                    return (
                      <div>
                        {label && (
                          <h2 className="block mb-4 text-sm font-medium text-gray-700">
                            {label}
                          </h2>
                        )}
                        <fieldset className="w-64 grid grid-cols-1 gap-2 md:grid-cols-2 md:w-[30rem]">
                          {fieldSet.map(({ label, disabled, value }) => (
                            <FastField
                              className="col-span-1"
                              name={name}
                              label={label}
                              disabled={disabled}
                              value={value}
                              component={Checkbox}
                            />
                          ))}
                        </fieldset>
                        <p className="mt-2 text-sm h-5 text-red-600">
                          {touched[name] && errors.categories}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <FastField
                      name={name}
                      label={label}
                      {...field}
                      StartAdornment={
                        Icon && (
                          <IconAdornment position="start" Icon={<Icon />} />
                        )
                      }
                      component={component || TextInput}
                    />
                  );
                }
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size={ButtonSize.MD}
                className="!text-cyan-500"
                onClick={onCancel}
              >
                {t(ActionButton.Cancel)}
              </Button>
              <Button
                size={ButtonSize.MD}
                type="submit"
                disabled={isSubmitting}
                color={ButtonColor.Primary}
              >
                {t(ActionButton.Save)}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
// #endregion mainComponent

export default CustomerForm;
