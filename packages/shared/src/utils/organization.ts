import { HTTPSErrors } from "../index";

export const interpolateEmailTemplate = (
  template: string,
  fieldValues: Record<string, string>
): string => {
  const placeholders = template.match(/\{\{ (.*?) \}\}/g) || [""];

  placeholders.forEach((placeholder) => {
    const placeholderValue =
      fieldValues[placeholder.substring(3, placeholder.length - 3)];

    if (placeholderValue === undefined)
      throw new Error(
        `${HTTPSErrors.MissingParameter}: ${placeholder.substring(
          3,
          placeholder.length - 3
        )}`
      );

    template = template.replace(placeholder, placeholderValue);
  });
  return template;
};
