import React from "react";

import { Fallback, LayoutContent } from "@eisbuk/ui";

import Layout from "@/controllers/Layout";
import ErrorBoundary from "@/components/atoms/ErrorBoundaryClass";

const ErrorBoundaryPage: React.FC = () => {
  return (
    <Layout>
      <LayoutContent>
        <ErrorBoundary fallback={<Fallback />} resetKeys={[]}>
          {() => Object.keys(null).map(() => "unreachable")}
        </ErrorBoundary>
      </LayoutContent>
    </Layout>
  );
};

export default ErrorBoundaryPage;
