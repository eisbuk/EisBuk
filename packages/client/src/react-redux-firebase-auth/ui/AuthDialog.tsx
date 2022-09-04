import React, { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithRedirect,
  isSignInWithEmailLink,
} from "@firebase/auth";

import { useTranslation, AuthTitle } from "@eisbuk/translations";

import AuthButton from "./atoms/AuthButton";
import AuthContainer from "./atoms/AuthContainer";
import EmailFlow from "./flows/EmailFlow";
import EmailLinkFlow from "./flows/EmailLinkFlow";
import PhoneFlow from "./flows/PhoneFlow";

enum AuthFlow {
  Email = "email",
  EmailLink = "email-link",
  Phone = "phone",
  Google = "google",
}

const AuthDialog: React.FC = () => {
  const { t } = useTranslation();

  const [authFlow, setAuthFlow] = useState<AuthFlow | null>(null);

  // redirect to login-with-email-link if site visited by login link
  useEffect(() => {
    if (isSignInWithEmailLink(getAuth(), window.location.href)) {
      setAuthFlow(AuthFlow.EmailLink);
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
              <ul className="list-none my-4">
                {buttons.map(({ authFlow, label, ...button }) => (
                  <AuthButton
                    key={label}
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
