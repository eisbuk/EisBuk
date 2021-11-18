import React from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import makeStyles from "@material-ui/core/styles/makeStyles";

import TimePickerField from "./TimePickerField";
import ErrorMessage from "@/components/atoms/ErrorMessage";

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
      />
      <TimePickerField
        name={`${name}.endTime`}
        label={t("SlotForm.EndTime")}
        data-testid={__endTimeInputId__}
      />
      <IconButton
        data-testid={__deleteIntervalId__}
        aria-label="delete"
        color="primary"
        onClick={onDelete}
      >
        <DeleteIcon />
      </IconButton>

      <ErrorMessage
        data-testid="error-message"
        className={classes.error}
        overridePosition
      >
        {error}
      </ErrorMessage>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "space-evenly",
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
    fontWeight: theme.typography.fontWeightLight,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
  dark: {
    backgroundColor: theme.palette.grey[50],
  },
}));

export default TimeIntervalField;
