import React from "react";

interface ConditionalWrapperProps {
  shouldWrap?: boolean;
  Wrapper: React.FC<any>;
}
/**
 * Contidional wrapper wrapps the children in a wrapper (passed in as `Wrapper`)
 * if the `shouldWrap` condition is `true`. If `false returns children wrapped in
 * react fragment
 */
export const ConditionalWrapper: React.FC<ConditionalWrapperProps> = ({
  children,
  shouldWrap,
  Wrapper,
}) => (shouldWrap ? <Wrapper>{children}</Wrapper> : <>{children}</>);
