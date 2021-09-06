import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useTranslation } from "react-i18next";
import { useField } from "formik";

import Button from "@material-ui/core/Button";

import { __addNewInterval__ } from "@/lib/labels";
import { defaultInterval } from "@/lib/data";

import { SlotInterval } from "@/types/temp";

import TimeIntervalField from "./TimeIntervalField";

const SlotIntervals: React.FC = () => {
  const { t } = useTranslation();

  const classes = useStyles();

  const [{ value: intervals }, , { setValue }] = useField<SlotInterval[]>(
    "intervals"
  );

  const addInterval = () => {
    const newIntervals = [...intervals, defaultInterval];
    setValue(newIntervals);
  };
  const deleteInterval = (index: number) => {
    const filteredIntervals = intervals.filter((_, i) => i !== index);
    setValue(filteredIntervals);
  };

  return (
    <>
      <h5 className={classes.intervalsTitle}>{t("SlotForm.Intervals")}</h5>
      {intervals?.map((_, i) => (
        <TimeIntervalField
          key={i}
          name={`intervals[${i}]`}
          onDelete={() => deleteInterval(i)}
        />
      ))}
      <div className="list-group list-group-flush">
        <div className={classes.buttonContainer}>
          <Button
            onClick={addInterval}
            color="primary"
            variant="contained"
            className={classes.addInterval}
          >
            {t(__addNewInterval__)}
          </Button>
        </div>
      </div>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  intervalsTitle: {
    fontSize: theme.typography.pxToRem(17),
    fontWeight: theme.typography.fontWeightLight,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
  },
  addInterval: {
    marginTop: theme.spacing(3),
    borderRadius: theme.spacing(100),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

export default SlotIntervals;
