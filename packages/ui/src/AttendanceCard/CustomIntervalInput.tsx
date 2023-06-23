import React, { useState, useCallback } from "react";
import { Form, Formik } from "formik";
import * as Yup from "yup";

import { XCircle, CheckCircle } from "@eisbuk/svg";
import {
  ActionButton,
  AttendanceAria,
  useTranslation,
  ValidationMessage,
} from "@eisbuk/translations";
import {
  __addCustomIntervalId__,
  __cancelCustomIntervalId__,
  __customIntervalInputId__,
} from "@eisbuk/testing/testIds";

const validationSchema = Yup.object().shape({
  interval: Yup.string()
    .required(ValidationMessage.InvalidInterval)
    .test({
      message: ValidationMessage.InvalidInterval,
      test: (time) =>
        /^[0-9]?[0-9]:[0-9][0-9]\s*-\s*[0-9]?[0-9]:[0-9][0-9]$/.test(
          time || ""
        ),
    }),
});

const CustomIntervalInput: React.FC<{
  disabled?: boolean;
  onInterval?: (interval: string) => void;
}> = ({ disabled = false, onInterval = () => {} }) => {
  const [showInput, setShowInput] = useState(false);

  const { t } = useTranslation();

  const autofocus = useCallback((el: HTMLInputElement | null) => {
    if (el) {
      el.focus();
    }
  }, []);

  const handleSubmitInterval = (interval: string) => {
    // Submit interval with whitespace removed
    onInterval(interval.replace(/\s/g, ""));
    setShowInput(false);
  };

  React.useEffect(() => {
    if (disabled) {
      setShowInput(false);
    }
  }, [disabled]);

  return showInput ? (
    <Formik
      initialValues={{ interval: "" }}
      validationSchema={validationSchema}
      validateOnChange={false}
      onSubmit={({ interval }) => handleSubmitInterval(interval)}
    >
      {({ values, errors, setFieldValue }) => {
        const error = errors.interval;
        const value = values.interval;
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setFieldValue("interval", e.target.value);
        };

        return (
          <Form
            // We couldn't get the desired "Esc" press behaviour to work with the "reset" button
            // so we're adding the functionality explicitly here.
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowInput(false);
            }}
            className="relative gap-0.5 w-full flex items-center border-b border-cyan-700"
          >
            {error && (
              <div className="bg-yellow-100 absolute text-black font-sans text-sm top-0 left-1/2 -translate-x-1/2 -translate-y-full px-2 max-w-[80%] inline-block">
                {t(error)}
              </div>
            )}
            <input
              disabled={false}
              className={`px-2 w-full text-black focus:outline-none ${
                disabled ? "" : ""
              }`}
              ref={autofocus}
              name="interval"
              value={value}
              onChange={onChange}
              placeholder="08:00-09:00"
              data-testid={__customIntervalInputId__}
            />
            <button
              type="reset"
              aria-label={t(AttendanceAria.CancelCustomInterval)}
              onClick={() => setShowInput(false)}
              className="flex-shrink-0 text-red-400 h-6 w-6 rounded"
              data-testid={__cancelCustomIntervalId__}
            >
              <XCircle />
            </button>
            <button
              type="submit"
              aria-label={t(AttendanceAria.AddCustomInterval)}
              className="flex-shrink-0 text-lime-400 h-6 w-6 rounded"
              data-testid={__addCustomIntervalId__}
            >
              <CheckCircle />
            </button>
          </Form>
        );
      }}
    </Formik>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setShowInput(true);
      }}
      disabled={disabled}
      className={`px-4 rounded ${
        disabled
          ? "cursor-default bg-cyan-700/30"
          : "bg-cyan-700 active:bg-cyan-600"
      }`}
    >
      {t(ActionButton.CustomInterval)}
    </button>
  );
};

export default CustomIntervalInput;
