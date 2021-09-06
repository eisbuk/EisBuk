import React from "react";
import { Field, ErrorMessage } from "formik";
import { useTranslation } from "react-i18next";

import { SlotType } from "eisbuk-shared";

import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { slotTypeLabel } from "@/lib/labels";

import { __selectTypeId__ } from "./__testData__/testIds";

/**
 * Selection radio buttons for `type` value of `SlotForm`.
 * Registers `"type"` value in Formik context and handles field
 * updates and error displaying.
 */
const SelectType: React.FC = () => {
  const { t } = useTranslation();

  const classes = useStyles();

  return (
    <>
      <Field
        component={RadioGroup}
        name="type"
        label={t("SlotForm.Type")}
        row
        className={classes.field}
        data-testid={__selectTypeId__}
      >
        {Object.values(SlotType).map((slotType) => (
          <FormControlLabel
            key={slotType}
            value={slotType}
            label={t(slotTypeLabel[slotType])}
            control={<Radio />}
          />
        ))}
      </Field>
      <div className={classes.error}>
        <ErrorMessage name="type" />
      </div>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0),
  },
  error: {
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  },
}));

export default SelectType;
