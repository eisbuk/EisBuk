import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DateRange as DateRangeIcon,
} from "@material-ui/icons";
import {
  Box,
  IconButton,
  Table,
  TableCell,
  TableContainer,
  TableBody,
  TableHead,
  TableRow,
  TextField,
} from "@material-ui/core";

import { Customer } from "eisbuk-shared";

import { useTranslation } from "react-i18next";

import CustomerForm from "@/components/customers/CustomerForm";
import EisbukAvatar from "@/components/users/EisbukAvatar";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import { capitalizeFirst } from "@/utils/capitalizeFirst";

// ***** Region Main Component ***** //
interface Props {
  customers: Customer[];
  onDeleteCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
}

const CustomerList: React.FC<Props> = ({
  customers,
  onDeleteCustomer,
  updateCustomer,
}) => {
  const [searchString, setSearchString] = useState("");
  const [
    customerCurrentlyEdited,
    setCustomerCurrentlyEdited,
  ] = useState<Customer | null>(null);
  const [
    customerCurrentlyDeleted,
    setCustomerCurrentlyDeleted,
  ] = useState<Customer | null>(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

  const searchRegex = new RegExp(searchString, "i");
  const customersToShow = customers.filter(
    (customer) =>
      searchRegex.test(customer.name) || searchRegex.test(customer.surname)
  );
  const history = useHistory();
  const { t } = useTranslation();

  return (
    <>
      <SearchField setSearchString={setSearchString}></SearchField>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>{t("CustomerList.Name")}</TableCell>
              <TableCell>{t("CustomerList.Surname")}</TableCell>
              <TableCell>{t("CustomerList.Category")}</TableCell>
              <TableCell>{t("CustomerList.Email")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customersToShow.map((customer) => {
              const deleteButton = (
                <IconButton
                  aria-label="delete"
                  color="primary"
                  onClick={() => {
                    setConfirmDeleteDialog(true);
                    setCustomerCurrentlyDeleted(customer);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              );
              const editButton = (
                <IconButton
                  aria-label="update"
                  color="primary"
                  onClick={() => setCustomerCurrentlyEdited(customer)}
                >
                  <EditIcon />
                </IconButton>
              );
              const bookingsButton = customer.secret_key && (
                <IconButton
                  color="primary"
                  href={`/clienti/${customer.secret_key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    history.push(`/clienti/${customer.secret_key}`);
                  }}
                >
                  <DateRangeIcon />
                </IconButton>
              );
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Box display="flex" flexDirection="row">
                      {deleteButton}
                      {editButton}
                      {bookingsButton}
                      <EisbukAvatar {...customer} />
                    </Box>
                  </TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.surname}</TableCell>
                  <TableCell>
                    {capitalizeFirst(t(`Categories.${customer.category}`))}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <CustomerForm
        open={Boolean(customerCurrentlyEdited)}
        handleClose={() => setCustomerCurrentlyEdited(null)}
        customer={customerCurrentlyEdited || undefined}
        updateCustomer={updateCustomer}
      />
      {customerCurrentlyDeleted && (
        <ConfirmDialog
          title={
            t("CustomerList.DeleteConfirmation") +
            customerCurrentlyDeleted.name +
            " " +
            customerCurrentlyDeleted.surname
          }
          open={confirmDeleteDialog}
          setOpen={setConfirmDeleteDialog}
          onConfirm={() => onDeleteCustomer!(customerCurrentlyDeleted)}
        >
          {t("CustomerList.NonReversible")}
        </ConfirmDialog>
      )}
    </>
  );
};
// ***** End Region Main Component ***** //

// ***** Region Search Field ***** //
const SearchField: React.FC<{ setSearchString: React.Dispatch<string> }> = ({
  setSearchString,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  return <TextField label="Search" type="search" onChange={handleChange} />;
};
// ***** EndRegion Search Field ***** //

export default CustomerList;
