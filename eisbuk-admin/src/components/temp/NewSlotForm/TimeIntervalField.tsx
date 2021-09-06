import React from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import makeStyles from "@material-ui/core/styles/makeStyles";

import TimePickerField from "./TimePickerField";

import {
  __startTimeInputId__,
  __endTimeInputId__,
  __deleteIntervalId__,
  __timeIntervalFieldId__,
} from "./__testData__/testIds";
import { DateTime } from "luxon";
import { __timeMismatch } from "@/lib/errorMessages";

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
    <div data-testid={__timeIntervalFieldId__} className="list-group-item">
      <div className={[classes.intervalContainer, colorClass].join(" ")}>
        <TimePickerField
          name={`${name}.startTime`}
          className={classes.intervalField}
          label={t("SlotForm.StartTime")}
          data-testid={__startTimeInputId__}
        />
        <TimePickerField
          name={`${name}.endTime`}
          className={classes.intervalField}
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

        <div className={classes.error}>
          {typeof error === "string" && error}
        </div>
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  intervalField: {
    border: theme.spacing(0),
    margin: theme.spacing(1),
    display: "inline-flex",
    padding: theme.spacing(0),
    position: "relative",
    minWidth: theme.spacing(0),
    flexDirection: "column",
    verticalAlign: "top",
    width: theme.spacing(18),
  },
  error: {
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  },
  intervalTitles: {
    fontSize: theme.typography.pxToRem(17),
    fontWeight: theme.typography.fontWeightLight,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
  intervalContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: theme.spacing(1),
  },
  dark: {
    backgroundColor: theme.palette.grey[50],
  },
}));

export default TimeIntervalField;
