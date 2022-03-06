import React, {
  useState, //  useCallback
} from "react";
// import * as firebaseui from "firebaseui";
// import { getApp } from "@firebase/app";
// import {
//   getAuth,
//   GoogleAuthProvider,
//   EmailAuthProvider,
//   PhoneAuthProvider,
//   // RecaptchaVerifier,
// } from "@firebase/auth";

// import styles necessary for firebase ui elements
import "firebaseui/dist/firebaseui.css";

import AuthButton from "./AuthButton";
import AuthContainer from "./AuthContainer";
import EmailFlow from "./EmailFlow";

// const auth = getAuth(getApp());

// const ui = new firebaseui.auth.AuthUI(auth);

// const uiConfig: firebaseui.auth.Config = {
//   signInOptions: [
//     /**
//      * Phone auth is temporarily removed as it seems to be incompatible with Firebase v9
//      * @TODO investigate further and/or implement our own solution if necessary
//      */
//     {
//       provider: PhoneAuthProvider.PROVIDER_ID,
//       // The default selected country.
//       defaultCountry: "IT",
//       recaptchaParameters: {
//         type: "image", // 'audio'
//         size: "invisible", // 'invisible' or 'compact'
//         badge: "bottomleft", // 'bottomright' or 'inline' applies to invisible.
//       },
//     },
//     GoogleAuthProvider.PROVIDER_ID,
//     EmailAuthProvider.PROVIDER_ID,
//   ],
// };

enum AuthFlow {
  Email = "email",
  Phone = "phone",
  Google = "google",
}

/**
 * An auth dialog we're using instead of `StyledFirebaseAuth`. It
 * utilizes `firebaseui` components with auth loaded internally and the
 * login flow handled by `firebaseui`
 * @returns
 */
const AuthDialog: React.FC = () => {
  // const initAuthUI = useCallback((node: Element | null) => {
  //   if (node) {
  //     ui.start(node, uiConfig);
  //   }
  // }, []);

  const [authFlow, setAuthFlow] = useState<AuthFlow | null>(null);

  switch (authFlow) {
    case AuthFlow.Email:
      return <EmailFlow onCancel={() => setAuthFlow(null)} />;

    default:
      return (
        <AuthContainer>
          {({ Content }) => (
            <Content>
              {buttons.map(({ authFlow, ...button }) => (
                <ul className="firebaseui-idp-list">
                  <AuthButton
                    {...button}
                    onClick={() => setAuthFlow(authFlow)}
                  />
                </ul>
              ))}
            </Content>
          )}
        </AuthContainer>
      );
  }

  // return (
  //   <>
  //     <div style={{ border: "1px solid red" }} ref={initAuthUI} />
  //   </>
  // );
};

export const buttons = [
  {
    color: "#ffff",
    backgroundColor: "#02bd7e",
    label: "Sign in with phone",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/phone.svg",
    authFlow: AuthFlow.Phone,
  },
  {
    color: "#757575",
    backgroundColor: "#ffffff",
    label: "Sign in with Google",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
    authFlow: AuthFlow.Google,
  },
  {
    color: "#ffff",
    backgroundColor: "#db4437",
    label: "Sign in with email",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
    authFlow: AuthFlow.Email,
  },
];

export default AuthDialog;
