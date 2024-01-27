import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { removeSecretKey, storeSecretKey } from "@/store/actions/appActions";

/**
 * Secret key logic abstracted away in a hook for easier readability
 */
const useSecretKey = (): string => {
  // Secret key is provided as a route param to the customer_area page
  const { secretKey } = useParams<{
    secretKey: string;
  }>();
  const dispatch = useDispatch();

  // Store secretKey to redux store
  // for easier access
  useEffect(() => {
    dispatch(storeSecretKey(secretKey));

    return () => {
      // remove secretKey from local storage on unmount
      dispatch(removeSecretKey);
    };
  }, [secretKey]);

  return secretKey;
};

export default useSecretKey;
