import { __organization__ } from "@/lib/constants";

export const getOrganization = (): string => {
  return localStorage.getItem("organization") || __organization__;
};
