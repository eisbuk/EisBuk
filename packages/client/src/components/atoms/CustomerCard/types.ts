import { Customer } from "@eisbuk/shared";

export interface ActionButtonProps {
  customer: Customer;
  onClose: () => void;
  className?: string;
}
