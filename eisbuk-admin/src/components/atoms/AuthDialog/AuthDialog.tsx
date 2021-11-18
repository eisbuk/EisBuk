import React, { useCallback } from "react";
import * as firebaseui from "firebaseui";

import {
  getAuth,
  PhoneAuthProvider,
  GoogleAuthProvider,
  EmailAuthProvider,
} from "firebase/auth";

// import styles necessary for firebase ui elements
import "firebaseui/dist/firebaseui.css";

const auth = getAuth();

const ui = new firebaseui.auth.AuthUI(auth);

const uiConfig = {
  signInOptions: [
    {
      provider: PhoneAuthProvider.PROVIDER_ID,
      // The default selected country.
      defaultCountry: "IT",
      recaptchaParameters: {
        type: "image", // 'audio'
        size: "invisible", // 'invisible' or 'compact'
        badge: "bottomleft", // 'bottomright' or 'inline' applies to invisible.
      },
    },
    GoogleAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID,
  ],
};

/**
 * An auth dialog we're using instead of `StyledFirebaseAuth`. It
 * utilizes `firebaseui` components with auth loaded internally and the
 * login flow handled by `firebaseui`
 * @returns
 */
const AuthDialog: React.FC = () => {
  const initAuthUI = useCallback((node: Element | null) => {
    if (node) {
      ui.start(node, uiConfig);
    }
  }, []);

  return <div ref={initAuthUI} />;
};

export default AuthDialog;
