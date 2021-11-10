import createTheme, { Theme } from "@material-ui/core/styles/createTheme";
import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes";

import * as colors from "@material-ui/core/colors";

import { getOrganization } from "@/utils/helpers";

const base = {
  palette: {
    absent: colors.brown[200],
  },
  typography: {
    htmlFontSize: 16,
  },
  spacing: 8,
};

export const igorice = {
  ...base,
  palette: {
    ...base.palette,
    primary: {
      main: colors.blue[500],
      constrastText: "#fff",
    },
    secondary: {
      main: colors.lightBlue[900],
    },
    grey: colors.blueGrey,
  },
};

export const eisbuk = {
  ...base,
  palette: {
    ...base.palette,
    primary: {
      main: colors.lime[900],
    },
    secondary: {
      main: colors.purple[300],
    },
  },
};

export const development = {
  ...base,
  palette: {
    ...base.palette,
    primary: {
      main: colors.orange[900],
    },
    secondary: {
      main: colors.grey[900],
    },
  },
};

export const available = [igorice, eisbuk, development];

/**
 * Gets theme settings for current organization
 * @returns
 */
const getCurrentOrganizationSettings = () => {
  switch (getOrganization()) {
    case "igorice.web.app":
      return {
        theme: igorice,
        name: "Igor Ice Team",
      };
    case "eisbuk.web.app":
      return {
        theme: eisbuk,
        name: "EisBuk",
      };
    default:
      return {
        theme: development,
        name: "DEV",
      };
  }
};

export const organizationInfo = getCurrentOrganizationSettings();

export const currentTheme = responsiveFontSizes(
  createTheme(organizationInfo.theme)
);

/**
 * Stands for EisBuk Theme, typeof currentTheme (set for MUI)
 */
export interface ETheme extends Theme {
  palette: Theme["palette"] & {
    absent: string;
  };
}
