import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { CustomerFull, SlotInterface } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AdminAria,
  useTranslation,
} from "@eisbuk/translations";

import { BaseModalProps } from "../../types";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import CustomerList from "@/components/atoms/CustomerList";
import { markAttendance } from "@/store/actions/attendanceOperations";

type AddAttendedCustomersProps = BaseModalProps &
  SlotInterface & {
    defaultInterval: string;
    customers: CustomerFull[];
  };

const AddAttendedCustomersDialog: React.FC<AddAttendedCustomersProps> = ({
  onClose,
  className,
  customers,
  defaultInterval,
  ...slot
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { id: slotId } = slot;
  const handleCustomerClick = ({ id: customerId }: CustomerFull) => {
    dispatch(
      markAttendance({ customerId, slotId, attendedInterval: defaultInterval })
    );
  };

  // Close the modal when there are no more customers to show
  useEffect(() => {
    if (!customers.length) {
      onClose();
    }
  }, [customers]);

  const classes = useStyles();

  return (
    <div
      aria-label="add-athletes-dialog"
      className={[className, classes.container].join(" ")}
    >
      <Typography variant="h6" component="h2" className={classes.title}>
        {i18n.t(ActionButton.AddCustomers)}
      </Typography>
      <IconButton
        className={classes.closeButton}
        aria-label={t(AdminAria.CloseModal)}
        onClick={() => onClose()}
        size="large"
      >
        <Close />
      </IconButton>
      <CustomerList
        className={classes.listContainer}
        tableContainerClassName={classes.tableContainer}
        customers={customers}
        onCustomerClick={handleCustomerClick}
      />
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    borderRadius: 6,
    height: "100%",
    width: "90vw",
    position: "relative",
    paddingTop: "4rem",
    paddingBottom: "0",
    backgroundColor: theme.palette.primary.light,
    overflow: "hidden",
    [theme.breakpoints.up("sm")]: {
      width: "70vw",
    },
    [theme.breakpoints.up("md")]: {
      width: "35vw",
    },
  },
  title: {
    position: "absolute",
    left: "1.5rem",
    top: "2rem",
    transform: "translateY(-50%)",
  },
  closeButton: {
    position: "absolute",
    top: "2rem",
    right: "2rem",
    transform: "translate(50%, -50%)",
  },
  listContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  tableContainer: {
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 14rem)",
  },
}));

export default AddAttendedCustomersDialog;
