import React from "react";
import { Field, FieldProps } from "formik";

import { TextInput } from "@eisbuk/ui";

export interface FormSectionFieldProps {
  name: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  component?: React.FC<Pick<FieldProps, "field">>;
}
interface Props {
  title?: string;
  content: FormSectionFieldProps[];
}

const FormSection: React.FC<Props> = ({ title, content }) => {
  return (
    <div className="pb-4 border-t border-gray-300">
      {title && (
        <div className="pt-16 pb-8">
          <h2 className="text-xl text-gray-700 font-medium tracking-wide">
            {title}
          </h2>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {content.map(
          ({ name, multiline, label, component = TextInput, ...rest }) => {
            const textareaClasses = "col-span-1 md:col-span-2";
            const fieldClasses = "col-span-1";

            return (
              <div
                className={[
                  multiline ? textareaClasses : fieldClasses,
                  "min-h-[60px]",
                ].join(" ")}
                key={name}
              >
                <Field
                  label={label}
                  name={name}
                  component={component}
                  variant="outlined"
                  multiline={multiline}
                  {...rest}
                />
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default FormSection;
