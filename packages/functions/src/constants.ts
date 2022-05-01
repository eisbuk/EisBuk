/** @TODO Read these from `process.env` */
export const __functionsZone__ = "europe-west6";
export const __projectId__ = process.env.PROJECT_ID;
/** @TODO Read these from `process.env` */

export const __smsUrl__ = "https://gatewayapi.com/rest/mtsms";

// #region validation
export const emailPattern = "^[-_.a-z0-9A-Z]*@[-_.a-z0-9A-Z]*[.][a-z][a-z]+$";

export const __invalidEmailError = "must be a valid email string";
export const __noSecretsError =
  "No secrets document found, make sure you create a secrets document for an organziation at: '/secrets/{ organization }'";
// #endregion validation
