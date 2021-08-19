import React, { useState } from "react";

import IconButton, { IconButtonProps } from "@material-ui/core/IconButton";
import Box from "@material-ui/core/Box";

import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AssignmentIcon from "@material-ui/icons/Assignment";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";

import { SlotButton } from "@/enums/components";

import SlotForm from "@/components/slots/SlotForm";

import { __slotButtonId__ } from "./__testData__/testIds";

const icons = {
  [SlotButton.New]: null,
  [SlotButton.Copy]: FileCopyIcon,
  [SlotButton.Paste]: AssignmentIcon,
  [SlotButton.Delete]: DeleteIcon,
};

interface DynamicButtonArgs extends IconButtonProps {
  hidden?: boolean;
}

interface DynamicButtonProps extends DynamicButtonArgs {
  component: SlotButton;
}

export const NewSlotButton: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);

  const showForm = () => setOpenForm(true);

  return (
    <>
      <IconButton
        size="small"
        onClick={showForm}
        data-testid={__slotButtonId__}
      >
        <AddCircleOutlineIcon />
      </IconButton>
      <SlotForm open={openForm} onClose={() => setOpenForm(false)} />
    </>
  );
};

const DynamicButtonComponent: React.FC<DynamicButtonProps> = ({
  component,
  ...args
}) => {
  if (component === SlotButton.New) return <NewSlotButton />;
  const Icon = icons[component];
  return (
    <IconButton data-testid={__slotButtonId__} {...args}>
      <Icon />
    </IconButton>
  );
};

interface Props {
  buttons: DynamicButtonProps[];
  className?: string;
}

const SlotOperationButtons: React.FC<Props> = ({ buttons, className }) => {
  return (
    <Box display="flex" className={className}>
      {buttons.map((props) => (
        <DynamicButtonComponent key={props.component} {...props} />
      ))}
    </Box>
  );
};

export default SlotOperationButtons;
