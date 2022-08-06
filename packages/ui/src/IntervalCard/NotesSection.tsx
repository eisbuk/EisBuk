import React from "react";
import { Formik, FastField, Form } from "formik";
import { ExclamationCircle } from "@eisbuk/svg";

import TextareaEditable from "../TextareaEditable";
import HoverText from "../HoverText";
import IconButton, {
  IconButtonContentSize,
  IconButtonShape,
  IconButtonSize,
} from "../IconButton";

interface NotesSectionProps {
  className?: string;
  notes?: string;
  isEditing?: boolean;
  onCancel?: () => void;
  onSave?: (notes: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  className,
  notes = "",
  isEditing,
  onCancel = () => {},
  onSave = () => {},
}) => {
  const actionButtonProps = {
    size: IconButtonSize.XS,
    contentSize: IconButtonContentSize.Tight,
    shape: IconButtonShape.Round,
    disableHover: true,
    disabled: !isEditing,
  };

  return (
    <Formik
      initialValues={{ notes }}
      onSubmit={({ notes }) => {
        onSave(notes!);
      }}
      onReset={() => onCancel()}
    >
      <Form className={className}>
        <FastField
          name="notes"
          className="w-full h-[105px] border-t border-gray-300"
          component={TextareaEditable}
          isEditing={isEditing}
          // Fast field runs some sort of memoization
          // by switching the key (when 'isEditing' is toggled)
          // we're ensuring the component gets rerendered (from 'p' to 'textarea' in this case)
          key={String(isEditing)}
        />
        <div className="relative w-full h-7 border-t border-gray-300">
          <HoverText
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full overflow-hidden bg-gray-300 p-0.5"
            text="hover-text"
          >
            <ExclamationCircle />
          </HoverText>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <IconButton
              className="text-red-500"
              {...actionButtonProps}
              type="reset"
            >
              <ExclamationCircle />
            </IconButton>
            <IconButton
              className="text-green-500"
              {...actionButtonProps}
              type="submit"
            >
              <ExclamationCircle />
            </IconButton>
          </div>
        </div>
      </Form>
    </Formik>
  );
};

export default NotesSection;
