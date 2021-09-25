import React from "react";
import { Field, useField } from "formik";
import { useTranslation } from "react-i18next";

import { SlotType } from "eisbuk-shared";

import { RadioGroup } from "formik-material-ui";
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

  const [, { error }] = useField("type");

  return (
    <Field
      component={RadioGroup}
      name="type"
      label={t("SlotForm.Type")}
      row
      className={classes.container}
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
      <div className={classes.error}>
        {typeof error === "string" && t(error)}
      </div>
    </Field>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "space-evenly",
    paddingBottom: theme.spacing(2),
  },
  error: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    witdh: "80%",
    whitespace: "normal",
    transform: "translateX(-50%)",
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.error.dark,
  },
}));

export default SelectType;
