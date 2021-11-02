import React, { useState, useEffect } from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotType, Category } from "eisbuk-shared";

import { CategoryLabel } from "@/enums/translations";

import ErrorMessage from "@/components/atoms/ErrorMessage";
// #region main

/**
 * Checkboxes selection field for categories.
 * Registers `"categories"` field to form, handles updates and errors.
 * Disabled (with all categories selected) if value for `type` (in form context)
 * `"off_ice_dancing" | "off_ice_gym"`
 */
const SelectCategories: React.FC = () => {
  const classes = useStyles();

  const [disabled, setDisabled] = useState(false);

  // check value for "type" field in the form context
  const [{ value: slotType }] = useField<SlotType>("type");
  // we want to set value for "categories" to all if "type" is off_ice
  const [, { error }, { setValue }] = useField<string[]>("categories");

  useEffect(() => {
    // if slot type off_ice, disable all checkboxes and set value for "categories" to all
    if ([SlotType.OffIceDancing, SlotType.OffIceGym].includes(slotType)) {
      setValue(Object.values(Category));

      setDisabled(true);
    } else {
      setDisabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotType]);

  return (
    <>
      <Box className={classes.container} display="flex" flexWrap="wrap">
        {Object.values(Category).map((category) => (
          <CategoryCheckbox {...{ category, disabled, key: category }} />
        ))}
        <ErrorMessage>{error}</ErrorMessage>
      </Box>
    </>
  );
};

// #endregion main

// #region CategoryCheckbox

interface CategoryCheckboxProps {
  category: Category;
  disabled?: boolean;
}

/**
 * A custom Checkbox component: mapping of Formik props to MUI FormControl - Checkbox
 * @param param0
 * @returns
 */
export const CategoryCheckbox: React.FC<CategoryCheckboxProps> = ({
  category,
  disabled,
}) => {
  const { t } = useTranslation();

  // create field values from Formik
  const [field] = useField({
    name: "categories",
    type: "checkbox",
    value: category,
  });

  return (
    <FormControlLabel
      control={<Checkbox {...field} />}
      disabled={disabled}
      label={t(CategoryLabel[category])}
    />
  );
};

// #endregion CategoryCheckbox

const useStyles = makeStyles((theme) => ({
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "space-evenly",
    paddingBottom: theme.spacing(1),
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

export default SelectCategories;
