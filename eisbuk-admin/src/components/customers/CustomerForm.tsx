import React from "react";
import { makeStyles } from "@material-ui/styles";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Formik, Form, FastField, FieldConfig } from "formik";
import { RadioGroup, TextField } from "formik-material-ui";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputAdornment from "@material-ui/core/InputAdornment";
import Radio from "@material-ui/core/Radio";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import AccountCircle from "@material-ui/icons/AccountCircle";
import Email from "@material-ui/icons/Email";
import Phone from "@material-ui/icons/Phone";
import Cake from "@material-ui/icons/Cake";
import LocalHospital from "@material-ui/icons/LocalHospital";
import Payment from "@material-ui/icons/Payment";

import { Customer } from "eisbuk-shared";

import { SvgComponent } from "@/types/components";

import { currentTheme } from "@/themes";

import { slotsLabelsLists } from "@/config/appConfig";

import CustomCheckbox from "./CustomCheckbox";

import { capitalizeFirst } from "@/utils/helpers";
import DateInput from "../atoms/DateInput";

// ***** Region Yup Validation ***** //
const CustomerValidation = Yup.object().shape({
  name: Yup.string().required(i18n.t("CustomerValidations.Required")),
  surname: Yup.string().required(i18n.t("CustomerValidations.Required")),
  email: Yup.string().email(i18n.t("CustomerValidations.Email")),
  phone: Yup.string(),
  birthday: Yup.string()
    .matches(/^[0-9\/\-\.]+$/, "CustomerValidations.Birthday")
    .min(10)
    .max(10),
  certificateExpiration: Yup.mixed(),
  covidCertificateReleaseDate: Yup.mixed(),
  covidCertificateSuspended: Yup.boolean(),
  category: Yup.string().required(i18n.t("CustomerValidations.Category")),
  subscriptionNumber: Yup.number(),
});

// ***** End Region Yup Validation ***** //

// ***** Reigion Main Component ***** //
interface Props {
  open: boolean;
  handleClose?: () => void;
  customer?: Partial<Customer>;
  updateCustomer?: (customer: Customer) => void;
}

const CustomerForm: React.FC<Props> = ({
  open,
  customer,
  handleClose = () => {},
  updateCustomer = () => {},
}) => {
  const classes = useStyles();

  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle id="form-dialog-title">
        {t("CustomerForm.NewAthlete")}
      </DialogTitle>
      <Formik
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
          handleClose();
        }}
      >
        {({ isSubmitting, errors }) => (
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
                label={t("CustomerForm.Name")}
                Icon={AccountCircle}
              />
              <MyField
                className={classes.field}
                name="surname"
                label={t("CustomerForm.Surname")}
                Icon={AccountCircle}
              />
              <MyField
                name="email"
                label="Email"
                className={classes.field}
                Icon={Email}
              />
              <MyField
                name="phone"
                label={t("CustomerForm.Phone")}
                className={classes.field}
                Icon={Phone}
              />
              {/* <MyField
                name="birthday"
                type="date"
                label={t("CustomerForm.DateOfBirth")}
                views={["year", "month", "date"]}
                className={classes.field}
                Icon={Cake}
              /> */}
              <DateInput
                name="birthday"
                className={classes.field}
                label={t("CustomerForm.DateOfBirth")}
                Icon={Cake}
              />

              <MyField
                component={RadioGroup}
                name="category"
                label={t("CustomerForm.Category")}
                row
                className={classes.radioGroup}
              >
                {slotsLabelsLists.categories.map((level) => (
                  <FormControlLabel
                    key={level.id}
                    value={level.id}
                    label={capitalizeFirst(t(`Categories.${level.label}`))}
                    control={<Radio />}
                  />
                ))}
              </MyField>
              <FormHelperText>{errors.category}</FormHelperText>

              <MyField
                type="date"
                name="certificateExpiration"
                label={t("CustomerForm.MedicalCertificate")}
                className={classes.field}
                Icon={LocalHospital}
              />
              <MyField
                type="date"
                name="covidCertificateReleaseDate"
                label={t("CustomerForm.CovidCertificateReleaseDate")}
                className={classes.field}
                Icon={LocalHospital}
              />
              <CustomCheckbox
                name="covidCertificateSuspended"
                label={t("CustomerForm.CovidCertificateSuspended")}
              />
              <MyField
                name="subscriptionNumber"
                label={t("CustomerForm.CardNumber")}
                className={classes.field}
                Icon={Payment}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                {t("CustomerForm.Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="contained"
                color="primary"
              >
                {t("CustomerForm.Save")}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};
// ***** End Reigion Main Component ***** //

// ***** Region Custom Field ***** //
interface MyFieldProps extends FieldConfig<string> {
  Icon?: SvgComponent;
  row?: unknown /** @TODO clear this up */;
  label?: string;
  className?: string;
  views?: string[] /** @TODO look this up */;
}

const MyField: React.FC<MyFieldProps> = ({ Icon, ...props }) => {
  /** These typings are @TEMP until this is clarified */
  let InputProps: {
    InputProps?: {
      startAdornment: JSX.Element;
    };
    fullWidth?: boolean;
  } = {};

  if (typeof Icon !== "undefined") {
    /** @TODO This is very weird */
    InputProps = {
      InputProps: {
        startAdornment: (
          <InputAdornment position="start">
            <Icon color="disabled" />
          </InputAdornment>
        ),
      },
    };
  }

  InputProps.fullWidth = Boolean(!props.row);

  return (
    <FastField
      autoComplete="off"
      {...{
        component: TextField,
        variant: "outlined",
        ...InputProps,
        ...props,
      }}
    />
  );
};
// ***** End Region Custom Field ***** //

// ***** Region Styles ***** //
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
// ***** End Region Styles ***** //

export default CustomerForm;
