import React from "react";

import { Fallback, LayoutContent } from "@eisbuk/ui";
import { Alerts, useTranslation } from "@eisbuk/translations";

import Layout from "@/controllers/Layout";
import { ErrorBoundary } from "react-error-boundary";
import { useSelector } from "react-redux";
import { getOrgEmail } from "@/store/selectors/orgInfo";

const ComponentThatThrows = () => {
  throw new Error("This is an error");
};
const ErrorBoundaryPage: React.FC = () => {
  const { t } = useTranslation();
  const orgEmail = useSelector(getOrgEmail);

  return (
    <Layout>
      <LayoutContent>
        <div className="py-8">
          <div className="p-2">
            <ErrorBoundary
              fallbackRender={() => (
                <Fallback>
                  {t(Alerts.ErrorBoundary, { email: orgEmail })}
                </Fallback>
              )}
            >
              <ComponentThatThrows />
            </ErrorBoundary>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default ErrorBoundaryPage;
