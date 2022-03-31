import React from "react";

import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const Copyright: React.FC = () => {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://www.igoriceteam.com/">
        Igor Ice Team
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
};

export default Copyright;
