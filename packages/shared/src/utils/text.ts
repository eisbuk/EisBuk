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
  values: Partial<Record<string, string>>
): string => {
  const matches = matchPlaceholders(template);
  const placeholders = matches.map((match) =>
    // Extract the placeholder name (from '{{ placeholderName }}' pattern)
    match.replace(/\{\{/g, "").replace(/\}\}/g, "").trim()
  );

  placeholders.forEach((placeholder) => {
    const placeholderValue = values[placeholder];

    template = interpolateForPlaceholder(
      template,
      placeholder,
      // If no value for a placeholder provided (or unsupported placeholder), replace it with an empty string
      placeholderValue || ""
    );
  });

  return template.trim();
};

export const checkExpected = (input: string, expected: string) => {
  /* Compares two strings without taking into account differences
    in whitespace, punctuation, and capitalization.
    If the two strings are equal, returns true, otherwise false.
    */
  const sanitizedInput = input.replace(/[\s,;:!?'.-]/g, "").toLowerCase();
  const sanitizedExpected = expected.replace(/[\s,;:!?'.-]/g, "").toLowerCase();
  return sanitizedInput === sanitizedExpected;
};

/**
 * A helper function that removes uppercase and trailing spaces from emails
 * ie: anExampleEmail@eXAMPLE.coM into anexampleemail@example.com
 */
export const normalizeEmail = (email: string) => {
  return email.toLowerCase().trim();
};
