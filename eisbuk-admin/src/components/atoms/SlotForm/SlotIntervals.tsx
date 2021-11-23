import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import createStyles from "@material-ui/core/styles/createStyles";
import { useTranslation } from "react-i18next";
import { useField } from "formik";

import Button from "@material-ui/core/Button";

import { SlotInterval } from "eisbuk-shared";

import { defaultInterval } from "@/lib/data";

import { SlotFormLabel } from "@/enums/translations";

import TimeIntervalField from "./TimeIntervalField";

const SlotIntervals: React.FC = () => {
  const { t } = useTranslation();

  const classes = useStyles();

  const [{ value: intervals }, , { setValue }] =
    useField<SlotInterval[]>("intervals");

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
      <h5 className={classes.intervalsTitle}>{t(SlotFormLabel.Intervals)}</h5>
      {intervals?.map((_, i) => (
        <TimeIntervalField
          key={i}
          name={`intervals[${i}]`}
          onDelete={() => deleteInterval(i)}
          dark={i % 2 === 1}
        />
      ))}
      <div className={classes.buttonContainer}>
        <Button
          onClick={addInterval}
          color="primary"
          variant="contained"
          className={classes.addInterval}
        >
          {t(SlotFormLabel.AddInterval)}
        </Button>
      </div>
    </>
  );
};

const useStyles = makeStyles((theme) =>
  createStyles({
    intervalsTitle: {
      letterSpacing: 1,
      fontSize: theme.typography.pxToRem(18),
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
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
  })
);

export default SlotIntervals;
