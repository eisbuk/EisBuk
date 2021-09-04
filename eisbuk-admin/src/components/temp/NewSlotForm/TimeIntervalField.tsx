import React from "react";
import { Field, useField } from "formik";
import { useTranslation } from "react-i18next";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import makeStyles from "@material-ui/core/styles/makeStyles";

import TimePickerField from "./TimePickerField";

import {
  __startTimeInputId__,
  __endTimeInputId__,
  __startTimeErrorId__,
  __endTimeErrorId__,
  __deleteIntervalId__,
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
  const [{ value }, { error }, { setValue, setError }] = useField<string>(name);

  const colorClass = dark ? classes.dark : "";

  let [startTime, endTime] = value.split("-");

  const handleChange = (field: "start" | "end") => (updatedValue: string) => {
    switch (field) {
      case "start":
        startTime = updatedValue;
        break;
      case "end":
        endTime = updatedValue;
    }

    // set updated time string
    const newTime = `${startTime}-${endTime}`;
    setValue(newTime);

    // check for start/end time mismatch
    const startTimeLuxon = DateTime.fromISO(startTime);
    const endTimeLuxon = DateTime.fromISO(endTime);

    // both times should be valid for validation,
    // if not valid, error should be handled by different validation (inside TimePickerField)
    if (!startTimeLuxon.invalidReason && !endTimeLuxon.invalidReason) {
      const diff =
        startTimeLuxon.diff(endTimeLuxon).toObject().milliseconds || 0;
      if (diff > 0) setError(__timeMismatch);
    }
  };

  return (
    <div className="list-group list-group-flush">
      <div className="list-group-item">
        <div className={[classes.intervalContainer, colorClass].join(" ")}>
          <TimePickerField
            name="startTime"
            className={classes.intervalField}
            label={t("SlotForm.StartTime")}
            value={startTime}
            onChange={handleChange("start")}
            data-testid={__startTimeInputId__}
          />
          <TimePickerField
            name="endTime"
            className={classes.intervalField}
            label={t("SlotForm.EndTime")}
            value={endTime}
            onChange={handleChange("end")}
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

          <div>{error}</div>
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
