const matchPlaceholders = (template: string): string[] => {
  const placeholders = template.match(/\{\{\s*[a-zA-Z]+\s*\}\}/g) || [];
  return placeholders;
};

const interpolateForPlaceholder = (
  template: string,
  placeholder: string,
  value: string
): string => {
  const placeholderRegex = new RegExp(`{{\\s*${placeholder}\\s*}}`, "g");
  return template.replace(placeholderRegex, value);
};

/**
 * Goes through template and replaces placeholders `{{placeholderName}}` with values from `values` param.
 * @param template
 * @param values
 * @returns
 */
export const interpolateText = (
  template: string,
  values: Record<string, string>
): string => {
  const matches = matchPlaceholders(template);
  const placeholders = matches.map((match) =>
    // Extract the placeholder name (from '{{ placeholderName }}' pattern)
    match.replace(/\{\{/g, "").replace(/\}\}/g, "").trim()
  );

  placeholders.forEach((placeholder) => {
    const placeholderValue = values[placeholder];

    // If value found for placeholder, replace it in template, no-op otherwise
    if (placeholderValue) {
      template = interpolateForPlaceholder(
        template,
        placeholder,
        placeholderValue
      );
    }
  });

  return template;
};