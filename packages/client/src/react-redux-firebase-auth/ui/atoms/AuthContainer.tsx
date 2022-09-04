import React from "react";

/** Styled component used as auth dialog header container */
const Header: React.FC = ({ children }) => (
  <div className="pt-6 px-6">
    {typeof children === "string" ? (
      // Provide default styling for title
      <h1 className="text-xl font-semibold tracking-tight leading-6 pb-4">
        {children}
      </h1>
    ) : (
      children
    )}
  </div>
);

/** Styled text message */
const TextMessage: React.FC = ({ children }) => (
  <div className="w-full px-6 pb-2 sm:w-[360px]">{children}</div>
);

/** Styled component used as auth dialog content container */
const Content: React.FC = ({ children }) => (
  <div className="px-6">{children}</div>
);

/** Styled container for action buttons */
export const ActionButtons: React.FC = ({ children }) => (
  <div className="pt-2 px-6 pb-6 flex justify-end items-center gap-2">
    {children}
  </div>
);

/** Styled component used as auth dialog footer container */
const Footer: React.FC = ({ children }) => (
  <div className="p-6 pt-0 flex">
    <div>{children}</div>
  </div>
);

/**
 * Render prop passed as `children` to `AuthContainer`
 * called with `Header`, `Content` and `Footer` styled containers
 * for easier rendering
 */
type RenderFunction = React.FC<{
  Header: React.FC;
  Content: React.FC;
  Footer: React.FC;
  TextMessage: React.FC;
  ActionButtons: React.FC;
}>;

const AuthContainer: React.FC<{
  style?: React.CSSProperties;
  className?: string;
  children: RenderFunction;
}> = ({ children, ...props }) => (
  <div
    className="relative rounded shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.20),0px_6px_10px_0px_rgba(0,0,0,0.14),0px_1px_18px_0px_rgba(0,0,0,0.12)]"
    {...props}
  >
    {children({ Header, Content, Footer, TextMessage, ActionButtons })}
  </div>
);

export default AuthContainer;
