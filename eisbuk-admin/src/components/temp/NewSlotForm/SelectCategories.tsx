import React, { useState, useEffect } from "react";
import { useField, ErrorMessage } from "formik";
import { useTranslation } from "react-i18next";

import { SlotType, Category } from "eisbuk-shared";

import Box from "@material-ui/core/Box";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import makeStyles from "@material-ui/core/styles/makeStyles";

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
  const [, , { setValue }] = useField<string[]>("categories");

  useEffect(() => {
    // if slot type off_ice, disable all checkboxes and set value for "categories" to all
    if ([SlotType.OffIceDancing, SlotType.OffIceGym].includes(slotType)) {
      setValue(["course", "pre-competitive", "competitive", "adults"]);

      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [slotType, setValue]);

  return (
    <>
      <Box display="flex" flexWrap="wrap">
        {Object.values(Category).map((category) => (
          <CategoryCheckbox {...{ category, disabled, key: category }} />
        ))}
      </Box>
      <div className={classes.error}>
        <ErrorMessage name="categories" />
      </div>
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
      label={t(`Categories.${category}`)}
    />
  );
};

// #endregion CategoryCheckbox

const useStyles = makeStyles((theme) => ({
  error: {
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  },
}));

export default SelectCategories;
