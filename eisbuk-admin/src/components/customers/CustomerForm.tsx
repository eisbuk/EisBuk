import React from "react";
import { makeStyles } from "@material-ui/styles";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  InputAdornment,
  Radio,
  FormControlLabel,
  SvgIconTypeMap,
} from "@material-ui/core";
import { RadioGroup, TextField } from "formik-material-ui";
import {
  AccountCircle,
  Email,
  Phone,
  Cake,
  LocalHospital,
  Payment,
} from "@material-ui/icons";
import { Formik, Form, FastField, FieldConfig } from "formik";
import * as Yup from "yup";

import { Customer } from "eisbuk-shared";

import { currentTheme } from "@/themes";

import { slotsLabelsLists } from "@/config/appConfig";
import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// ***** Region Yup Validation ***** //
const CustomerValidation = Yup.object().shape({
  name: Yup.string().required(i18n.t("CustomerValidations.Required")),
  surname: Yup.string().required(i18n.t("CustomerValidations.Required")),
  email: Yup.string().email(i18n.t("CustomerValidations.Email")),
  phone: Yup.string(),
  birth: Yup.mixed(),
  certificateExpiration: Yup.mixed(),
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
              <MyField
                name="birthday"
                type="date"
                label={t("CustomerForm.DateOfBirth")}
                views={["year", "month", "date"]}
                className={classes.field}
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
                    label={i18n.t(`categories.${level.label}`)}
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
  Icon?: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
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
  },
  radioGroup: {
    justifyContent: "space-evenly",
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
}));
// ***** End Region Styles ***** //

export default CustomerForm;
