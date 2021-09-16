import React from "react";

import List from "@material-ui/core/List";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { DeprecatedSlot } from "eisbuk-shared/dist/types/deprecated/firestore";

import SlotsDay, { SlotsDayProps } from "./SlotsDay";

export interface SlotListProps
  extends Omit<
    Omit<Omit<SlotsDayProps, "slots">, "day">,
    "setCreateEditDialog"
  > {
  slots: Record<string, Record<string, DeprecatedSlot<"id">>>;
  className?: string;
  // onCreateSlot?: SlotFormProps["createSlot"];
  // onEditSlot?: SlotFormProps["editSlot"];
}

const SlotListByDay: React.FC<SlotListProps> = ({
  slots,
  // onCreateSlot,
  // onEditSlot,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  ...props
}) => {
  // const [createEditDialog, setCreateEditDialog] = useState<
  //   Partial<{
  //     isOpen: boolean;
  //     day: string | null;
  //     slotToEdit: DeprecatedSlot<"id"> | null;
  //   }>
  // >({
  //   isOpen: false,
  //   day: null,
  //   slotToEdit: null,
  // });

  const classes = useStyles();
  if (typeof slots === "undefined") {
    return <div>Loading...</div>;
  }

  const days = Object.keys(slots)
    .filter((el) => el !== "id")
    .sort();

  // const onCloseCreateEditDialog = () => {
  //   setCreateEditDialog({
  //     isOpen: false,
  //     day: null,
  //     slotToEdit: null,
  //   });
  // };

  return (
    <>
      <List dense={true} className={className + " " + classes.root}>
        {days.map((day) => (
          <SlotsDay
            key={day}
            day={day}
            slots={slots[day]}
            {...{
              ...props,
              // setCreateEditDialog,
            }}
          ></SlotsDay>
        ))}
      </List>
      {/* <SlotForm
        isoDate={createEditDialog.day!}
        slotToEdit={createEditDialog.slotToEdit!}
        createSlot={onCreateSlot}
        editSlot={onEditSlot}
        open={createEditDialog.isOpen!}
        onClose={onCloseCreateEditDialog}
      ></SlotForm> */}
    </>
  );
};

export default SlotListByDay;

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
}));
