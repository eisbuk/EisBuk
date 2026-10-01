import React, { useEffect, useRef, useState } from "react";
import {
  AuthError,
  AuthErrorCodes,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  isSignInWithEmailLink,
} from "@firebase/auth";

import {
  useTranslation,
  AuthTitle,
  AuthErrorMessage,
} from "@eisbuk/translations";
import { Google, Key } from "@eisbuk/svg";
import { HoverText, IconButton, IconButtonSize } from "@eisbuk/ui";

import AuthButton from "./atoms/AuthButton";
import AuthContainer from "./atoms/AuthContainer";
import AuthErrorDialog from "./atoms/AuthErrorDialog";
import EmailFlow from "./flows/EmailFlow";
import EmailLinkFlow from "./flows/EmailLinkFlow";
import PhoneFlow from "./flows/PhoneFlow";

enum AuthFlow {
  Email = "email",
  EmailLink = "email-link",
  Phone = "phone",
  Google = "google",
}

/**
 * Signs in with Google in a popup.
 *
 * The redirect flow ('signInWithRedirect') doesn't work when the app is served
 * from a domain other than the 'authDomain' (app on '<site>.web.app',
 * 'authDomain' '<project>.firebaseapp.com'): browsers partition the
 * third-party storage the redirect result is read from (Chrome 115+,
 * Firefox 109+, Safari 16.1+), so users came back to the login page signed
 * out (#960). See https://firebase.google.com/docs/auth/web/redirect-best-practices
 *
 * Must be called straight from the click handler, or browsers block the popup.
 */
export const signInWithGoogle = async (): Promise<void> => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // In the iOS home-screen app, Firebase opens the "popup" as a separate window
  // it can't watch: if the user closes it, 'signInWithPopup' never settles.
  // Use the redirect flow there instead.
  if (isIOSStandalone()) {
    await signInWithRedirect(auth, provider);
    return;
  }

  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    switch ((err as AuthError)?.code) {
      // The user closed the popup, or clicked the button again
      case AuthErrorCodes.POPUP_CLOSED_BY_USER:
      case AuthErrorCodes.EXPIRED_POPUP_REQUEST:
      case AuthErrorCodes.USER_CANCELLED:
        return;
      // No popups here (blocked, or an embedded browser): try a redirect instead
      case AuthErrorCodes.POPUP_BLOCKED:
      case AuthErrorCodes.OPERATION_NOT_SUPPORTED:
        await signInWithRedirect(auth, provider);
        return;
      default:
        throw err;
    }
  }
};

/** The app runs from the iOS home screen ('navigator.standalone' is iOS only) */
const isIOSStandalone = () =>
  Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );

const AuthDialog: React.FC = () => {
  const { t } = useTranslation();

  const [authFlow, setAuthFlow] = useState<AuthFlow | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // A sign in started by a previous click, still in progress: further clicks
  // would start another one (and could open a second popup)
  const googleSignInPending = useRef(false);

  const startGoogleSignIn = async () => {
    if (googleSignInPending.current) return;
    // Set synchronously, before anything is awaited
    googleSignInPending.current = true;
    try {
      await signInWithGoogle();
    } catch (err) {
      const { code } = (err as AuthError) || { code: "" };
      setDialogError(t(AuthErrorMessage[code] || AuthErrorMessage.UNKNOWN));
    } finally {
      googleSignInPending.current = false;
    }
  };

  const handleSelectFlow = (flow: AuthFlow) =>
    flow === AuthFlow.Google ? startGoogleSignIn() : setAuthFlow(flow);

  // redirect to login-with-email-link if site visited by login link
  useEffect(() => {
    if (isSignInWithEmailLink(getAuth(), window.location.href)) {
      setAuthFlow(AuthFlow.EmailLink);
    }
  }, []);

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
              <AuthErrorDialog
                message={dialogError || ""}
                open={Boolean(dialogError)}
                onClose={() => setDialogError(null)}
              />
              <ul className="list-none my-4 mb-8">
                {mainButtons.map(({ authFlow, label, ...button }) => (
                  <AuthButton
                    key={label}
                    {...button}
                    label={t(label)}
                    onClick={() => handleSelectFlow(authFlow)}
                  />
                ))}
              </ul>

              <ul className="list-none flex gap-2 items-center">
                <span className="h-0.5 w-full bg-gray-100" />
                {additionalButtons.map(({ authFlow, label, Icon }) => (
                  <li
                    className="cursor-pointer m-1"
                    onClick={() => handleSelectFlow(authFlow)}
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
