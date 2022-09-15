import React from "react";
import * as Yup from "yup";
import { Formik, Form, FastField, FieldConfig } from "formik";
import { TextField } from "formik-mui";

import { InputProps } from "@mui/material";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";

import makeStyles from "@mui/styles/makeStyles";

import AccountCircle from "@mui/icons-material/AccountCircle";
import Email from "@mui/icons-material/Email";
import Phone from "@mui/icons-material/Phone";
import Cake from "@mui/icons-material/Cake";
import LocalHospital from "@mui/icons-material/LocalHospital";
import Payment from "@mui/icons-material/Payment";

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

import { defaultCustomerFormValues } from "@/lib/data";

import { SvgComponent } from "@/types/components";

import { currentTheme } from "@/themes";

import DateInput from "@/components/atoms/DateInput";
import ErrorMessage from "@/components/atoms/ErrorMessage";

import CustomCheckbox from "./CustomCheckbox";

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
    message: ValidationMessage.InvalidDate,
  }),
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: ValidationMessage.InvalidDate,
  }),
  covidCertificateReleaseDate: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: ValidationMessage.InvalidDate,
  }),
  covidCertificateSuspended: Yup.boolean(),
  categories: Yup.array()
    .required(i18n.t(ValidationMessage.RequiredField))
    .min(1, ValidationMessage.RequiredEntry)
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
  const classes = useStyles();

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
        {({ isSubmitting, setFieldValue, values, errors }) => (
          <Form autoComplete="off">
            <div className="mb-6 flex flex-col gap-4 items-stretch">
              <input
                type="hidden"
                name="id"
                value={(customer && customer.id) || ""}
              />
              <MyField
                className={classes.field}
                name="name"
                label={t(CustomerLabel.Name)}
                Icon={AccountCircle}
              />
              <MyField
                className={classes.field}
                name="surname"
                label={t(CustomerLabel.Surname)}
                Icon={AccountCircle}
              />
              <MyField
                name="email"
                label={t(CustomerLabel.Email)}
                className={classes.field}
                Icon={Email}
              />
              <MyField
                name="phone"
                label={t(CustomerLabel.Phone)}
                className={classes.field}
                onBlur={() =>
                  setFieldValue("phone", values["phone"]?.replace(/\s/g, ""))
                }
                Icon={Phone}
              />
              <DateInput
                name="birthday"
                className={classes.field}
                label={t(CustomerLabel.Birthday)}
                Icon={Cake}
              />

              <div className="flex flex-col ">
                <div className="flex flex-col content-between w-64 md:flex-wrap md:h-44 md:w-[30rem]">
                  {categoryOptions.map((cat) => (
                    <CustomCheckbox
                      name="categories"
                      label={cat.label}
                      disabled={cat.disabled}
                      value={cat.value}
                    ></CustomCheckbox>
                  ))}
                </div>
                <ErrorMessage className="w-full whitespace-normal !text-md !ml-1">
                  {errors.categories}
                </ErrorMessage>
              </div>

              <DateInput
                name="certificateExpiration"
                label={t(CustomerLabel.CertificateExpiration)}
                className={classes.field}
                Icon={LocalHospital}
              />
              <DateInput
                name="covidCertificateReleaseDate"
                label={t(CustomerLabel.CovidCertificateReleaseDate)}
                className={classes.field}
                Icon={LocalHospital}
              />

              <CustomCheckbox
                name="covidCertificateSuspended"
                label={t(CustomerLabel.CovidCertificateSuspended)}
              />
              <MyField
                name="subscriptionNumber"
                label={t(CustomerLabel.CardNumber)}
                className={classes.field}
                Icon={Payment}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={onCancel} color="primary">
                {t(ActionButton.Cancel)}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="contained"
                color="primary"
                className={classes.buttonPrimary}
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

// #region MyField
interface MyFieldProps extends FieldConfig<string> {
  Icon?: SvgComponent;
  row?: boolean;
  label?: string;
  className?: string;
  onBlur?: () => void;
}

const MyField: React.FC<MyFieldProps> = ({ Icon, ...props }) => {
  let InputProps: InputProps = {};

  if (typeof Icon !== "undefined") {
    InputProps = {
      startAdornment: (
        <InputAdornment position="start">
          <Icon color="disabled" />
        </InputAdornment>
      ),
    };
  }

  InputProps.fullWidth = !props.row;

  return (
    <FastField
      autoComplete="off"
      {...{
        component: TextField,
        variant: "outlined",
        InputProps,
        ...props,
      }}
    />
  );
};
// #endregion MyField

// #region styles
type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  field: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    width: "100%",
  },
  radioGroup: {
    justifyContent: "space-evenly",
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  // The following is a workaround to not overrule the Mui base button styles
  // by Tailwind's preflight reset
  buttonPrimary: { backgroundColor: theme.palette.primary.main },
  container: {
    padding: `0 ${theme.spacing(2)} ${theme.spacing(3)} ${theme.spacing(2)}px`,
  },
}));
// #endregion styles

export default CustomerForm;
