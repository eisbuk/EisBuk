import React from "react";

interface SectionProps {
  title: string;
  subtitle: string;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, children }) => (
  <div className="md:grid md:grid-cols-3 md:gap-6">
    <div className="md:col-span-1">
      <h2 className="text-lg text-cyan-700 font-medium">{title}</h2>
      <p className="text-sm text-gray-500 font-normal">{subtitle}</p>
    </div>
    <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">{children}</div>
  </div>
);

export default Section;
