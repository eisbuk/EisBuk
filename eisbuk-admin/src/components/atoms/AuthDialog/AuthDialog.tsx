import React, { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithRedirect,
  signInWithEmailLink,
  isSignInWithEmailLink,
} from "@firebase/auth";
import { useTranslation } from "react-i18next";

import "firebaseui/dist/firebaseui.css";

import makeStyles from "@mui/styles/makeStyles";

import { AuthTitle } from "@/enums/translations";

import AuthButton from "./AuthButton";
import AuthContainer from "./AuthContainer";
import EmailFlow from "./EmailFlow";
import EmailLinkFlow from "./EmailLinkFlow";
import PhoneFlow from "./PhoneFlow";

import { getEmailForSignIn, unsetEmailForSignIn } from "@/utils/localStorage";

enum AuthFlow {
  Email = "email",
  EmailLink = "email-link",
  Phone = "phone",
  Google = "google",
}

const AuthDialog: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [authFlow, setAuthFlow] = useState<AuthFlow | null>(null);

  useEffect(() => {
    if (isSignInWithEmailLink(getAuth(), window.location.href)) {
      const email = getEmailForSignIn();
      console.log("Sign in link", window.location.href);
      if (email) {
        console.log("Sign in email:", email);
        signInWithEmailLink(getAuth(), window.location.href);
        unsetEmailForSignIn();
      }
    }
  }, []);

  // control login with google flow
  useEffect(() => {
    if (authFlow === AuthFlow.Google) {
      const provider = new GoogleAuthProvider();
      signInWithRedirect(getAuth(), provider);
    }
  }, [authFlow]);

  switch (authFlow) {
    case AuthFlow.Email:
      return <EmailFlow onCancel={() => setAuthFlow(null)} />;

    case AuthFlow.EmailLink:
      return <EmailLinkFlow onCancel={() => setAuthFlow(null)} />;

    case AuthFlow.Phone:
      return <PhoneFlow onCancel={() => setAuthFlow(null)} />;

    default:
      return (
        <AuthContainer>
          {({ Content }) => (
            <Content>
              <ul className={classes.buttonsContainer}>
                {buttons.map(({ authFlow, label, ...button }) => (
                  <AuthButton
                    {...button}
                    label={t(label)}
                    onClick={() => setAuthFlow(authFlow)}
                  />
                ))}
              </ul>
            </Content>
          )}
        </AuthContainer>
      );
  }
};

const useStyles = makeStyles(() => ({
  buttonsContainer: {
    listStyle: "none",
    margin: "1rem 0",
    padding: 0,
  },
}));

export const buttons = [
  {
    color: "#ffff",
    backgroundColor: "#02bd7e",
    label: AuthTitle.SignInWithPhone,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/phone.svg",
    authFlow: AuthFlow.Phone,
  },
  {
    color: "#757575",
    backgroundColor: "#ffffff",
    label: AuthTitle.SignInWithGoogle,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
    authFlow: AuthFlow.Google,
  },
  {
    color: "#ffff",
    backgroundColor: "#db4437",
    label: AuthTitle.SignInWithEmail,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
    authFlow: AuthFlow.Email,
  },
  {
    color: "#ffff",
    backgroundColor: "rgba(0,0,0,0.8)",
    label: `${AuthTitle.SignInWithEmailLink}`,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
    authFlow: AuthFlow.EmailLink,
  },
];

export default AuthDialog;
