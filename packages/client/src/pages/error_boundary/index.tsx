import React from "react";

import { LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";

const ComponentThatThrows = () => {
  throw new Error("This is an error");
};

const ErrorBoundaryPage: React.FC = () => {
  return (
    <Layout>
      <LayoutContent>
        <ErrorBoundary resetKeys={[]}>
          {() => <ComponentThatThrows />}
        </ErrorBoundary>
      </LayoutContent>
    </Layout>
  );
};

export default ErrorBoundaryPage;
