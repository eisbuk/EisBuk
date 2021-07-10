import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Paper, Typography } from "@material-ui/core";
import _ from "lodash";

import { signOut } from "@/store/actions/actions";

import figureSkatingSilhouetteCouple from "@/assets/images/login/figure-skating-silhouette-couple.svg";
import figureSkatingSilhouetteSkirt from "@/assets/images/login/figure-skating-silhouette-skirt.svg";
import figureSkatingSilhouette from "@/assets/images/login/figure-skating-silhouette.svg";
import girlIceSkating from "@/assets/images/login/girl-ice-skating-silhouette.svg";
import iceSkatingSilhouette from "@/assets/images/login/ice-skating-silhouette.svg";

const backgrounds = [
  figureSkatingSilhouetteCouple,
  figureSkatingSilhouetteSkirt,
  figureSkatingSilhouette,
  girlIceSkating,
  iceSkatingSilhouette,
];

interface Props {
  backgroundIndex: boolean;
}

const Unauthorized: React.FC<Props> = ({ backgroundIndex }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.firebase.auth);
  var background;
  if (!_.isNil(backgroundIndex)) {
    background = backgrounds[backgroundIndex % backgrounds.length];
  } else {
    background = _.sample(backgrounds);
  }
  const style = {
    backgroundImage: `url(${background})`,
    backgroundRepeat: "no-repeat",
    backgroundOpacity: "20%",
    backgroundSize: "contain",
    backgroundPosition: "center",
    height: "100vh",
  };
  const logOut = () => dispatch(signOut());
  return (
    <Paper style={style}>
      <Typography component="h1" variant="h2">
        Non sei autorizzato ad accedere.
      </Typography>
      <Typography component="h2" variant="h4">
        Questo spazio è riservato agli amministratori
      </Typography>
      <Typography component="h2" variant="h5">
        Hai effettuato l'accesso con: <b>{auth.email || auth.phoneNumber}</b>
      </Typography>

      <Button variant="contained" onClick={logOut}>
        Esci e riprova con un altro utente
      </Button>
    </Paper>
  );
};

export default Unauthorized;
