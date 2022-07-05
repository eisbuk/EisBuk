import React from "react";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { useField } from "formik";

import Button from "@mui/material/Button";

import { SlotInterval } from "@eisbuk/shared";
import {
  useTranslation,
  SlotFormLabel,
  SlotFormAria,
} from "@eisbuk/translations";

import { defaultInterval } from "@/lib/data";

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
          aria-label={t(SlotFormAria.AddInterval)}
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
      fontWeight: theme.typography.fontWeightBold,
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.primary.light,
    },
    addInterval: {
      marginTop: theme.spacing(3),
      borderRadius: theme.spacing(100),
      // The following is a workaround to not overrule the Mui base button styles
      // by Tailwind's preflight reset
      backgroundColor: theme.palette.primary.main,
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  })
);

export default SlotIntervals;
