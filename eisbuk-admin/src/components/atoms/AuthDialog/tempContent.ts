export const buttons = [
  {
    color: "#ffff",
    backgroundColor: "#02bd7e",
    label: "Sign in with phone",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/phone.svg",
  },
  {
    color: "#757575",
    backgroundColor: "#ffffff",
    label: "Sign in with Google",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
  },
  {
    color: "#ffff",
    backgroundColor: "#db4437",
    label: "Sign in with email",
    icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
  },
];

// declare global {
//   interface Window {
//     recaptchaVerifier: RecaptchaVerifier;
//   }
// }

// window.recaptchaVerifier = new RecaptchaVerifier(
//   "sign-in-button",
//   {
//     size: "invisible",
//     callback: () => {
//       console.log("Bump");
//     },
//   },
//   auth
// );

export {};
