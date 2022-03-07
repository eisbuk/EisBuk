import React, { useState, useEffect } from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotType, Category } from "eisbuk-shared";

import {
  CategoryLabel,
  SlotFormAria,
  SlotFormLabel,
} from "@/enums/translations";

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

  const { t } = useTranslation();

  const [disabled, setDisabled] = useState(false);

  // check value for "type" field in the form context
  const [{ value: slotType }] = useField<SlotType>("type");
  // we want to set value for "categories" to all if "type" is off_ice
  const [, { error }, { setValue }] = useField<string[]>("categories");

  useEffect(() => {
    // if slot type off_ice, disable all checkboxes and set value for "categories" to all
    if (slotType === SlotType.OffIce) {
      setValue(Object.values(Category));

      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [slotType]);

  return (
    <>
      <Box
        className={classes.container}
        role="group"
        aria-label={t(SlotFormAria.SlotCategory)}
        aria-disabled={disabled}
      >
        <Typography className={classes.categoriesTitle}>
          {t(SlotFormLabel.Categories)}
        </Typography>
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

  const classes = useCheckboxStyles();

  // create field values from Formik
  const [field] = useField({
    name: "categories",
    type: "checkbox",
    value: category,
  });

  return (
    <FormControlLabel
      className={classes.categoryCheckbox}
      control={<Checkbox {...field} />}
      disabled={disabled}
      label={`${t(CategoryLabel[category])}`}
      role="checkbox"
      aria-label={t(CategoryLabel[category])}
    />
  );
};

// #endregion CategoryCheckbox

const useStyles = makeStyles((theme) =>
  createStyles({
    categoriesTitle: {
      letterSpacing: 1,
      fontSize: theme.typography.pxToRem(18),
      fontWeight: theme.typography.fontWeightBold,
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.primary.light,

      [theme.breakpoints.up("sm")]: {
        display: "none",
      },
    },
    container: {
      position: "relative",
      [theme.breakpoints.up("sm")]: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "start",
        paddingBottom: theme.spacing(1),
      },
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
  })
);

const useCheckboxStyles = makeStyles((theme) => ({
  categoryCheckbox: {
    [theme.breakpoints.down("sm")]: {
      display: "block",
      marginLeft: "1rem",
    },
  },
}));

export default SelectCategories;
