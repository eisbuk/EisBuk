import React from "react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Formik, Form, FastField, FieldConfig } from "formik";
import { TextField } from "formik-material-ui";

import { InputProps } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import InputAdornment from "@material-ui/core/InputAdornment";

import makeStyles from "@material-ui/core/styles/makeStyles";

import AccountCircle from "@material-ui/icons/AccountCircle";
import Email from "@material-ui/icons/Email";
import Phone from "@material-ui/icons/Phone";
import Cake from "@material-ui/icons/Cake";
import LocalHospital from "@material-ui/icons/LocalHospital";
import Payment from "@material-ui/icons/Payment";

import { Category, Customer } from "eisbuk-shared";

import {
  CustomerLabel,
  CustomerFormTitle,
  ValidationMessage,
  ActionButton,
} from "@/enums/translations";

import { SvgComponent } from "@/types/components";

import { currentTheme } from "@/themes";

import { slotsLabelsLists } from "@/config/appConfig";

import DateInput from "@/components/atoms/DateInput";
import CustomCheckbox from "./CustomCheckbox";
import RadioSelection from "@/components/atoms/RadioSelection";

import { isISODay } from "@/utils/date";

// #region validations
const CustomerValidation = Yup.object().shape({
  name: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  surname: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  email: Yup.string().email(i18n.t(ValidationMessage.Email)),
  phone: Yup.string(),
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
  category: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  subscriptionNumber: Yup.number(),
});
// #endregion validations

// #region mainComponent
interface Props {
  open: boolean;
  onClose?: () => void;
  customer?: Partial<Customer>;
  updateCustomer?: (customer: Customer) => void;
}

const CustomerForm: React.FC<Props> = ({
  open,
  customer,
  onClose = () => {},
  updateCustomer = () => {},
}) => {
  const classes = useStyles();

  const { t } = useTranslation();

  const categoryOptions = Object.keys(Category).map((categoryKey) => ({
    value: Category[categoryKey],
    label: t(`Category.${categoryKey}`),
  }));

  const editCustomerTitle = `${t(CustomerFormTitle.EditCustomer)} (${
    customer?.name
  } ${customer?.surname})`;
  const newCustomerTitle = t(CustomerFormTitle.NewCustomer);
  const title = customer ? editCustomerTitle : newCustomerTitle;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <Formik
        validateOnChange={false}
        initialValues={{
          name: "",
          surname: "",
          email: "",
          phone: "",
          birthday: "",
          category: slotsLabelsLists[0],
          certificateExpiration: "",
          covidCertificateReleaseDate: "",
          covidCertificateSuspended: false,
          subscriptionNumber: "",
          ...customer,
        }}
        validationSchema={CustomerValidation}
        onSubmit={(values, { setSubmitting }) => {
          updateCustomer(values as Customer);
          setSubmitting(false);
          onClose();
        }}
      >
        {({ isSubmitting }) => (
          <Form autoComplete="off">
            <DialogContent>
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
                Icon={Phone}
              />
              <DateInput
                name="birthday"
                className={classes.field}
                label={t(CustomerLabel.DateOfBirth)}
                Icon={Cake}
              />

              <RadioSelection options={categoryOptions} name="category" />

              <DateInput
                name="certificateExpiration"
                label={t(CustomerLabel.MedicalCertificate)}
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
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="primary">
                {t(ActionButton.Cancel)}
              </Button>
              <Button
                // onClick={() => console.log("Click")}
                type="submit"
                disabled={isSubmitting}
                variant="contained"
                color="primary"
              >
                {t(ActionButton.Save)}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};
// #endregion mainComponent

// #region MyField
interface MyFieldProps extends FieldConfig<string> {
  Icon?: SvgComponent;
  row?: boolean;
  label?: string;
  className?: string;
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
}));
// #endregion styles

export default CustomerForm;
