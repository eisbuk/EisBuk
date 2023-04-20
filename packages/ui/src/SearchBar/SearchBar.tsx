import React from "react";

interface SearchBarProps
  extends Omit<React.HTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = "", ...props }) => (
  <input
    className={`border-l-0 border-t-0 border-r-0 border-b-2 border-gray-400 focus:border-gray-600 focus:ring-0 mx-4 mt-8 mb-16 ${className}}`}
    placeholder="Search"
    type="search"
    {...props}
  />
);

export default SearchBar;
