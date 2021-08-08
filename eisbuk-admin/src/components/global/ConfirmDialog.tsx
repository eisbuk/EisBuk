import React from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

interface Props {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Yes/No Dialog box
 * @param param0 props: title, children, open (boolean), setOpen (function), onConfirm (function)
 * @returns
 */
const ConfirmDialog: React.FC<Props> = ({
  title,
  children,
  open,
  setOpen,
  onConfirm,
}) => {
  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  const handleReject = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleReject} color="secondary">
          No
        </Button>
        <Button variant="contained" onClick={handleConfirm} color="primary">
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
