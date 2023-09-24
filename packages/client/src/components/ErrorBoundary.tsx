import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { captureException } from "@sentry/react";

import { Fallback } from "@eisbuk/ui";
import { Alerts, useTranslation } from "@eisbuk/translations";

import { getOrgEmail } from "@/store/selectors/orgInfo";

interface Props {
  children: () => null | ReactElement | ReactElement[];
  resetKeys: any[];
}
const ErrorBoundary: React.FC<Props> = ({ children, resetKeys }) => {
  const RenderChildren = React.useCallback(() => <>{children()}</>, resetKeys);

  const { t } = useTranslation();
  const orgEmail = useSelector(getOrgEmail);

  const onErrorHandler = (error: Error): void => {
    captureException(error);
  };

  return (
    <ReactErrorBoundary
      resetKeys={resetKeys}
      onError={onErrorHandler}
      fallbackRender={() => (
        <Fallback>{t(Alerts.ErrorBoundary, { email: orgEmail })}</Fallback>
      )}
    >
      <RenderChildren />
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
