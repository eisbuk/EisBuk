/**
 * Get params as key/value from url params string
 * @param {string} params url params string (separated by "&" char)
 * @returns {object} params record
 */
export const getParams = (url: string): Record<string, any> =>
  url
    // split params
    .split("&")
    // return params as key/value pairs
    .reduce((acc, param) => {
      const [key, value] = param.split("=");
      return { ...acc, [key]: value };
    }, {});
