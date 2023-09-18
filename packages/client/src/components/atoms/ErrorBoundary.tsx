import React from "react";
import { useSelector } from "react-redux";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { captureException } from "@sentry/react";

import { Fallback } from "@eisbuk/ui";
import { Alerts, useTranslation } from "@eisbuk/translations";

import { getOrgEmail } from "@/store/selectors/orgInfo";

const ErrorBoundary: React.FC<{
  children: React.ReactNode;
  resetKeys: any[] | undefined;
}> = (props) => {
  const { t } = useTranslation();
  const orgEmail = useSelector(getOrgEmail);

  const onErrorHandler = (error: Error): void => {
    captureException(error);
  };

  return (
    <ReactErrorBoundary
      resetKeys={props.resetKeys}
      onError={onErrorHandler}
      fallbackRender={() => (
        <Fallback>{t(Alerts.ErrorBoundary, { email: orgEmail })}</Fallback>
      )}
    >
      {props.children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
