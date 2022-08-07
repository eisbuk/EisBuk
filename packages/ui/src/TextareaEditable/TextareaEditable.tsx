import React from "react";
import { FieldProps } from "formik";

type TextareaEditableProps = React.HTMLAttributes<HTMLElement> &
  Partial<Pick<FieldProps, "field">> & {
    /**
     * A boolean flag to toggle between editing and display mode
     */
    isEditing?: boolean;
    value?: string;
  };

/**
 * A wysiwyg text area component. On default it show the text while with 'isEditing' turns into
 * a textarea elmenent with all appropriate functionality.
 */
const TextareaEditable: React.FC<TextareaEditableProps> = ({
  isEditing,
  className: inputClasses = "",
  field = {},
  ...initialProps
}) => {
  // Transform props to use formik 'field' props if provided
  const { value, ...props } = { ...initialProps, ...field };

  const element: "textarea" | "p" = isEditing ? "textarea" : "p";

  // To achieve wysiwyg editable element, we're displaying the text value
  // as different properties whether we're using 'p' element or 'textarea'
  const displayedText = isEditing
    ? { value }
    : { children: value || props.placeholder };

  const className = [...baseClasses, inputClasses].join(" ").trim();

  const innerClasses = [
    "w-full",
    "h-full",
    "block",
    "resize-none",
    "focus:outline-none",
    // If there's no value, we might show a placeholder (even outside edit mode)
    // so it should be colored as such
    value ? "text-gray-900" : "text-gray-400",
  ];

  return (
    <div className={className}>
      {React.createElement<
        React.HTMLAttributes<HTMLParagraphElement | HTMLTextAreaElement>,
        HTMLParagraphElement | HTMLTextAreaElement
      >(element, {
        className: innerClasses.join(" "),
        ...props,
        ...displayedText,
        // Focus element when switching from non editable to editable
        ...(element === "textarea" && { autoFocus: true }),
      })}
    </div>
  );
};

const baseClasses: string[] = [
  "py-[9px]",
  "px-[13px]",
  "font-normal",
  "text-gray-900",
  "overflow-y-auto",
];

export default TextareaEditable;
