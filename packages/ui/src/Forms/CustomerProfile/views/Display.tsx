import React from "react";

import { Customer } from "@eisbuk/shared";
import {
  useTranslation,
  CustomerLabel,
  // TODO: add "edit" to ActionButton enums
} from "@eisbuk/translations";
import {
  User,
  Cake,
  Mail,
  Phone,
  ClipboardList,
  SheildCheck,
} from "@eisbuk/svg";

import { isoToDate } from "../../../utils/date";

import Section from "./Section";

interface DisplayProps {
  customer: Partial<Customer>;
}

interface TextDescription {
  label: string | undefined;
  data: string | undefined;
  Icon?: JSX.Element | null;
}

interface CheckboxDescription {
  label: string | undefined;
  data: boolean | undefined;
}

const TextDescription: React.FC<TextDescription> = ({ Icon, label, data }) => (
  <div className="space-y-1 min-h-[84px]">
    <dt className="text-sm font-medium text-gray-700">{label}</dt>
    <div className="flex items-center mr-1 min-h-[36px]">
      <div className="pl-3">
        <div className="h-5 w-5 text-cyan-700">{Icon}</div>
      </div>
      <dd className="pl-4 text-sm">{data}</dd>
    </div>
  </div>
);

const CheckboxDescription: React.FC<CheckboxDescription> = ({
  label,
  data,
}) => (
  <div className="relative flex items-start">
    <dd className="flex items-center h-5">
      <input
        disabled={true}
        aria-hidden
        type="checkbox"
        className="h-4 w-4 text-gray-800 border-gray-300 rounded disabled:text-gray-200"
        checked={data}
      />
    </dd>
    <div className="ml-3 text-sm">
      <dt className="font-medium text-gray-700">{label}</dt>
    </div>
  </div>
);

const CustomerDetailsForm: React.FC<DisplayProps> = ({ customer }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-y-10 justify-between">
      <Section title="Personal Details" subtitle="Manage your personal details">
        <dl className="sm:grid sm:grid-cols-6 gap-x-6 gap-y-2 md:border-b-2 md:border-gray-100">
          <div className="col-span-3">
            <TextDescription
              label={t(CustomerLabel.Name)}
              data={customer?.name}
              Icon={<User />}
            />
          </div>
          <div className="col-span-3">
            <TextDescription
              label={t(CustomerLabel.Surname)}
              data={customer?.surname}
              Icon={<User />}
            />
          </div>
          <div className="col-span-4">
            <TextDescription
              label={t(CustomerLabel.Birthday)}
              data={isoToDate(customer?.birthday || "")}
              Icon={<Cake />}
            />
          </div>
          <div className="col-span-3">
            <TextDescription
              label={t(CustomerLabel.Email)}
              data={customer?.email}
              Icon={<Mail />}
            />
          </div>
          <div className="col-span-3">
            <TextDescription
              label={t(CustomerLabel.Phone)}
              data={customer?.phone}
              Icon={<Phone />}
            />
          </div>
        </dl>
      </Section>
      <Section title="Medical Details" subtitle="Manage your medical details">
        <dl className="grid sm:grid-cols-6 gap-y-2">
          <div className="col-span-4">
            <TextDescription
              label={t(CustomerLabel.CertificateExpiration)}
              data={isoToDate(customer?.certificateExpiration || "")}
              Icon={<ClipboardList />}
            />
          </div>
          <div className="col-span-4">
            <TextDescription
              label={t(CustomerLabel.CovidCertificateReleaseDate)}
              data={isoToDate(customer?.covidCertificateReleaseDate || "")}
              Icon={<SheildCheck />}
            />
          </div>
          <div className="col-span-4">
            <CheckboxDescription
              label={t(CustomerLabel.CovidCertificateSuspended)}
              data={customer?.covidCertificateSuspended}
            />
          </div>
        </dl>
      </Section>
    </div>
  );
};

export default CustomerDetailsForm;
