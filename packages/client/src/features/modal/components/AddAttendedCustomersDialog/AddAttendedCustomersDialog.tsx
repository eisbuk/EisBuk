import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, { ActionButton } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";
import IconButton from "@mui/material/IconButton";
import { __closeCustomersListId__ } from "@/components/atoms/AttendanceCard/__testData__/testIds";
import Close from "@mui/icons-material/Close";
import CustomerList from "@/components/atoms/CustomerList";
import { markAttendance } from "@/store/actions/attendanceOperations";

type AddAttendedCustomersProps = BaseModalProps &
  SlotInterface & {
    defaultInterval: string;
    customers: Customer[];
  };

const AddAttendedCustomersDialog: React.FC<AddAttendedCustomersProps> = ({
  onClose,
  className,
  customers,
  defaultInterval,
  ...slot
}) => {
  const dispatch = useDispatch();

  const { id: slotId } = slot;
  const handleCustomerClick = ({ id: customerId }: Customer) => {
    dispatch(
      markAttendance({ customerId, slotId, attendedInterval: defaultInterval })
    );
    // Remove customer from list when marked as attended
    setRemovedFromList((s) => [...s, customerId]);
  };

  // Each customer marked as attended should be marked here
  // and removed from the list
  const [removedFromList, setRemovedFromList] = useState<string[]>([]);
  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        /** @TODO Deleted customers should probably not be retrieved from store */
        // Filter customers marked as attended as well as customers marked as deleted
        ({ id, deleted }) => !removedFromList.includes(id) && !deleted
      ),
    [removedFromList]
  );

  // Close the modal when there are no more customers to show
  useEffect(() => {
    if (!filteredCustomers.length) {
      onClose();
    }
  }, [filteredCustomers]);

  const classes = useStyles();

  return (
    <div className={[className, classes.container].join(" ")}>
      <Typography variant="h6" component="h2" className={classes.title}>
        {i18n.t(ActionButton.AddCustomers)}
      </Typography>
      <IconButton
        className={classes.closeButton}
        onClick={() => onClose()}
        data-testid={__closeCustomersListId__}
        size="large"
      >
        <Close />
      </IconButton>
      <CustomerList
        className={classes.listContainer}
        tableContainerClassName={classes.tableContainer}
        customers={filteredCustomers}
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
