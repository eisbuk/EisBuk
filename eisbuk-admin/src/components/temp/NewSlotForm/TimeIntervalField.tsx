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
  const [, , { setValue }] = useField<string>(name);

  const colorClass = dark ? classes.dark : "";

  // const handleChange = (field: "start" | "end") => (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   console.log("Called");
  //   const value = e.target.value;
  //   console.log("Start > ", value);
  // };

  setValue("test");
  return (
    <div className="list-group list-group-flush">
      <div className="list-group-item">
        <div className={[classes.intervalContainer, colorClass].join(" ")}>
          <Field
            as={TimePickerField}
            label={t("SlotForm.StartTime")}
            name="start_time"
            type="text"
            className={classes.intervalField}
            data-testid={__startTimeInputId__}
            // onChange={handleChange("start")}
          />
          <Field
            as={TimePickerField}
            label={t("SlotForm.EndTime")}
            name="end_time"
            type="text"
            className={classes.intervalField}
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

          {/* <ErrorMessage
            className={classes.error}
            data-testid={__startTimeErrorId__}
            name="startTime"
          />
          <ErrorMessage
            className={classes.error}
            data-testid={__endTimeErrorId__}
            name="endTime"
          /> */}
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
