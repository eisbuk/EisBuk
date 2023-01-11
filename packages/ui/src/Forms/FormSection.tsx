import React from "react";

export const FormSectionContext = React.createContext<{
  disabled?: boolean;
  disabledFields?: string[];
}>({});

export interface FormSectionProps {
  title: string;
  subtitle?: string;
  disabled?: boolean;
  disabledFields?: string[];
  columns?: number;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  columns = 6,
  ...formSectionContext
}) => {
  const columnsClass = `sm:grid-cols-${columns}`;
  return(

  <FormSectionContext.Provider value={formSectionContext}>
    <div className="py-3 md:grid md:grid-cols-3 md:gap-6">
      <div className="md:col-span-1">
        <h2 className="text-lg text-cyan-700 font-medium">{title}</h2>

          {subtitle && (
            <p className="text-sm text-gray-500 font-normal">{subtitle}</p>
          )}
        </div>

        <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
          <div
            className={[
              "grid pb-3 col gap-x-6 gap-y-2 md:border-b-2 md:border-gray-100",
              columnsClass,
            ].join(" ")}
          >
            {children}
          </div>
        </div>
      </div>
    </FormSectionContext.Provider>
  );
};

export default FormSection;
