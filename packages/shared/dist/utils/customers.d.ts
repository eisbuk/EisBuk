import { Customer, CustomerBase } from "../types/firestore";
/**
 * A helper function used to strip excess customer data
 * and create customer base data (used as `bookings` data for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer base structure
 */
export declare const getCustomerBase: ({ id, name, surname, category, extendedDate, deleted, }: Omit<Customer, "secretKey">) => CustomerBase;
