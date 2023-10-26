import React, { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithRedirect,
  isSignInWithEmailLink,
} from "@firebase/auth";

import { useTranslation, AuthTitle } from "@eisbuk/translations";
import { Google, Key } from "@eisbuk/svg";
import { HoverText, IconButton, IconButtonSize } from "@eisbuk/ui";

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
              <ul className="list-none my-4 mb-8">
                {mainButtons.map(({ authFlow, label, ...button }) => (
                  <AuthButton
                    key={label}
                    {...button}
                    label={t(label)}
                    onClick={() => setAuthFlow(authFlow)}
                  />
                ))}
              </ul>

              <ul className="list-none flex gap-2 items-center">
                <span className="h-0.5 w-full bg-gray-100" />
                {additionalButtons.map(({ authFlow, label, Icon }) => (
                  <li
                    className="cursor-pointer m-1"
                    onClick={() => setAuthFlow(authFlow)}
                    aria-label={t(label)}
                    key={label}
                  >
                    <HoverText text={t(label)}>
                      <IconButton size={IconButtonSize.XS} className="">
                        <Icon />
                      </IconButton>
                    </HoverText>
                  </li>
                ))}
              </ul>
            </Content>
          )}
        </AuthContainer>
      );
  }
};

export const mainButtons = [
  {
    color: "#ffff",
    backgroundColor: "#02bd7e",
    label: AuthTitle.SignInWithPhone,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/phone.svg",
    authFlow: AuthFlow.Phone,
  },
  {
    color: "#ffff",
    backgroundColor: "#db4437",
    label: `${AuthTitle.SignInWithEmailLink}`,
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
    authFlow: AuthFlow.EmailLink,
  },
];

export const additionalButtons = [
  {
    color: "#757575",
    backgroundColor: "#ffffff",
    label: AuthTitle.SignInWithGoogle,
    Icon: Google,
    authFlow: AuthFlow.Google,
  },
  {
    color: "#ffff",
    backgroundColor: "rgba(0,0,0,0.8)",
    label: AuthTitle.SignInWithEmail,
    Icon: Key,
    authFlow: AuthFlow.Email,
  },
];

export default AuthDialog;
