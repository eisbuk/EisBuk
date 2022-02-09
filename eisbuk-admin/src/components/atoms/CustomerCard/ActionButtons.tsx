import React, { useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import i18n from "i18next";

import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import DateRangeIcon from "@material-ui/icons/DateRange";
import Mail from "@material-ui/icons/Mail";

import { Routes } from "@/enums/routes";
import { ActionButton, Prompt } from "@/enums/translations";
import { SendBookingLinkMethod } from "@/enums/other";

import { ActionButtonProps } from "./types";

import ConfirmDialog from "@/components/global/ConfirmDialog";
import { DateInput } from "@/components/atoms/DateInput";

import {
  extendBookingDate,
  sendBookingsLink,
} from "@/store/actions/customerOperations";

import {
  __openBookingsId__,
  __sendBookingsEmailId__,
  __sendBookingsSMSId__,
} from "./__testData__/testIds";

type ConfirmDialogProps = Parameters<typeof ConfirmDialog>[0];
/**
 * Controls different prompt displaying options
 */
type PromptOptions = Pick<ConfirmDialogProps, "title"> &
  Pick<ConfirmDialogProps, "children"> &
  Pick<ConfirmDialogProps, "onConfirm">;

/**
 * Labeled action buttons to open customer's bookings or send
 * booking link via sms/email, rendered as icon + text
 */
const ActionButtons: React.FC<ActionButtonProps> = ({
  customer,
  onClose,
  className,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const history = useHistory();

  const classes = useStyles();

  // redirect to customers `bookings` entry flow
  const bookingsRoute = `${Routes.CustomerArea}/${customer?.secretKey}`;
  const redirectToBookings = () => history.push(bookingsRoute);

  // send booking link flow
  const openSendBookingsPrompt = (method: SendBookingLinkMethod) => () =>
    setPrompt(
      getSendBookingPrompt({
        method,
        email: customer.email,
        phone: customer.phone,
        onConfirm: () => handleSendBookingsLink(method),
      })
    );
  const handleSendBookingsLink = (method: SendBookingLinkMethod) => {
    onClose();
    dispatch(sendBookingsLink({ customerId: customer.id, method }));
  };

  // extend booking flow
  const extendedDate = useRef("");
  const handleExtendBooking = () => {
    extendBookingDate(customer.id, extendedDate.current);
  };

  // prompt functionality
  const [prompt, setPrompt] = useState<PromptOptions | null>(null);
  const closePrompt = () => {
    setPrompt(null);
  };

  return (
    <div {...{ className }}>
      <Button
        startIcon={<DateRangeIcon />}
        className={classes.actionButton}
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
        variant="contained"
      >
        {t(ActionButton.CustomerBookings)}
      </Button>
      <Button
        startIcon={<Mail />}
        className={classes.actionButton}
        color="primary"
        onClick={openSendBookingsPrompt(SendBookingLinkMethod.Email)}
        data-testid={__sendBookingsEmailId__}
        variant="contained"
        // disable button if email or secret key not provided
        disabled={!(customer?.email && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsEmail)}
      </Button>
      <Button
        startIcon={<Mail />}
        className={classes.actionButton}
        color="primary"
        onClick={openSendBookingsPrompt(SendBookingLinkMethod.SMS)}
        data-testid={__sendBookingsSMSId__}
        variant="contained"
        // disable button if phone number or secret key not provided
        disabled={!(customer?.phone && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsSMS)}
      </Button>
      <Button
        startIcon={<Mail />}
        className={classes.actionButton}
        color="primary"
        onClick={() =>
          setPrompt({
            title: t(Prompt.ExtendBookingDateTitle, {
              customer: `${customer.name} ${customer.surname}`,
            }),
            children: (
              <>
                {t(Prompt.ExtendBookingDateBody, {
                  customer: `${customer.name} ${customer.surname}`,
                })}
                <DateInput
                  value={extendedDate.current}
                  onChange={(value) => {
                    extendedDate.current = value;
                  }}
                />
              </>
            ),
            onConfirm: handleExtendBooking,
          })
        }
        variant="contained"
        // disable button if phone number or secret key not provided
      >
        {t(ActionButton.ExtendBookingDate)}
      </Button>

      <ConfirmDialog
        open={Boolean(prompt)}
        setOpen={(open: boolean) => (open ? null : closePrompt())}
        {...prompt!}
      />
    </div>
  );
};

interface GetSendBookingPrompt {
  (payload: {
    method: SendBookingLinkMethod | null;
    email?: string;
    phone?: string;
    onConfirm: () => void;
  }): PromptOptions;
}

/**
 * Gets prompt text (title and body) for dialog prompt based on passed method.
 * For type safety, it accepts `null` as `method` (and returns empty strings for `title` and `body`),
 * but that should not happen in reality.
 * @param {string | null} param.method "email" or "sms"
 * @param {string} param.email (optional) customer's email
 * @param {string} param.phone (optional) customer's phone
 * @returns
 */
const getSendBookingPrompt: GetSendBookingPrompt = ({
  method,
  email,
  phone,
  onConfirm,
}) => {
  if (!method) return { title: "", body: "", onConfirm: () => {} };

  const promptLookup = {
    [SendBookingLinkMethod.Email]: {
      title: i18n.t(Prompt.SendEmailTitle),
      children: i18n.t(Prompt.ConfirmEmail, { email }),
    },
    [SendBookingLinkMethod.SMS]: {
      title: i18n.t(Prompt.SendSMSTitle),
      children: i18n.t(Prompt.ConfirmSMS, { phone }),
    },
  };

  return { ...promptLookup[method], onConfirm };
};

const useStyles = makeStyles(() => ({
  actionButton: {
    margin: "0.5rem",
  },
}));

export default ActionButtons;
