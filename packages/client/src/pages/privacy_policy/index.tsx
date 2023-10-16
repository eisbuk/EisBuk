import React from "react";
import ReactMarkdown from "react-markdown";
import { useHistory } from "react-router-dom";

import { LayoutContent } from "@eisbuk/ui";
import { defaultPrivacyPolicy } from "@eisbuk/shared/ui";
import { ChevronLeft } from "@eisbuk/svg";
import { ActionButton, useTranslation } from "@eisbuk/translations";

import Layout from "@/controllers/Layout";

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const back = () => history.goBack();

  return (
    <Layout>
      <LayoutContent>
        <div className="pt-8 pb-16">
          <button
            onClick={back}
            className="inline-block py-2 pr-3 -translate-x-2"
          >
            <span className="inline-block h-6 w-6 align-middle mr-1.5">
              <ChevronLeft />
            </span>
            <span className="align-middle">{t(ActionButton.Back)}</span>
          </button>

          <ReactMarkdown className="privacy-policy-md">
            {defaultPrivacyPolicy}
          </ReactMarkdown>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default CustomerArea;
