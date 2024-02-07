import React from "react";

import { LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";
import ErrorBoundary from "@/components/atoms/ErrorBoundary";

const ComponentThatThrows = () => {
  throw new Error("This is an error thrown on purpose");
};

const ErrorBoundaryPage: React.FC = () => {
  return (
    <Layout>
      <LayoutContent>
        <ErrorBoundary resetKeys={[]}>
          <ComponentThatThrows />
        </ErrorBoundary>
      </LayoutContent>
    </Layout>
  );
};

export default ErrorBoundaryPage;
