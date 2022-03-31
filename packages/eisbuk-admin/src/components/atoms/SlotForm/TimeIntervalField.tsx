import React from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import IconButton from "@mui/material/IconButton";

import DeleteIcon from "@mui/icons-material/Delete";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import TimePickerField from "./TimePickerField";
import ErrorMessage from "@/components/atoms/ErrorMessage";

import { SlotFormAria } from "@/enums/translations";

import {
  __startTimeInputId__,
  __endTimeInputId__,
  __deleteIntervalId__,
  __timeIntervalFieldId__,
} from "./__testData__/testIds";

interface Props {
  /**
   * Remove interval handler, internally only fires an event.
   * IDing of the interval should be handled outside the component.
   */
  onDelete: () => void;
  /**
   * Display gray background (used for every other interval in the list).
   */
  dark?: boolean;
  /**
   * Input field name (used for Formik context: updating value etc.)
   */
  name: string;
}

const TimeIntervalField: React.FC<Props> = ({ onDelete, dark, name }) => {
  const { t } = useTranslation();

  const classes = useStyles();

  const colorClass = dark ? classes.dark : "";

  const [, { error }] = useField<string>(name);

  return (
    <div
      data-testid={__timeIntervalFieldId__}
      className={[classes.container, colorClass].join(" ")}
    >
      <TimePickerField
        name={`${name}.startTime`}
        label={t("SlotForm.StartTime")}
        data-testid={__startTimeInputId__}
        aria-label={t(SlotFormAria.IntervalStart)}
      />
      <TimePickerField
        name={`${name}.endTime`}
        label={t("SlotForm.EndTime")}
        data-testid={__endTimeInputId__}
        aria-label={t(SlotFormAria.IntervalEnd)}
      />
      <IconButton
        className={classes.deleteButton}
        data-testid={__deleteIntervalId__}
        aria-label={t(SlotFormAria.DeleteInterval)}
        color="primary"
        onClick={onDelete}
        size="large"
      >
        <DeleteIcon />
      </IconButton>

      <ErrorMessage className={classes.error} overridePosition>
        {error}
      </ErrorMessage>
    </div>
  );
};

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      position: "relative",
      flexDirection: "column",
      width: "100%",
      [theme.breakpoints.up("sm")]: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
      },
    },
    error: {
      position: "absolute",
      bottom: 4,
      left: "50%",
      witdh: "80%",
      whitespace: "normal",
      transform: "translateX(-50%)",
    },
    intervalTitles: {
      fontSize: theme.typography.pxToRem(17),
      fontWeight: theme.typography.fontWeightBold,
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.primary.light,
    },
    dateInput: {
      [theme.breakpoints.down("sm")]: {
        width: "100%",
      },
    },
    deleteButton: {
      [theme.breakpoints.down("sm")]: {
        position: "absolute",
        top: "50%",
        transform: "translate(0, -50%)",
        right: 0,
      },
    },
    dark: {
      backgroundColor: theme.palette.grey[50],
    },
  })
);

export default TimeIntervalField;
