import React from "react";

import Button from "../Button";
import { type PrivacyPolicyParams } from "@eisbuk/shared";
import { defaultPrivacyPolicyParams } from "@eisbuk/shared/ui";

interface Props {
  show?: boolean;
  policyParams?: Omit<PrivacyPolicyParams, "policy">;
  onLearnMore?: () => void;
  onAccept?: () => void;
}

const PrivacyPolicyToast: React.FC<Props> = ({
  policyParams = defaultPrivacyPolicyParams,
  show = true,
  onLearnMore = () => {},
  onAccept = () => {},
}) => {
  const { prompt = "", learnMoreLabel = "", acceptLabel = "" } = policyParams;

  if (!show) return null;

  return (
    <div className="my-4 py-2 px-2 inline-block border-2 bg-white rounded-lg border-cyan-600">
      <div className="flex gap-x-8 items-center">
        <p className="ml-4 font-medium">{prompt}</p>
        <div className="flex items-center gap-x-2">
          <Button
            className="!whitespace-nowrap bg-cyan-600"
            onClick={onLearnMore}
          >
            {learnMoreLabel}
          </Button>
          <Button className="!whitespace-nowrap bg-cyan-600" onClick={onAccept}>
            {acceptLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyToast;
