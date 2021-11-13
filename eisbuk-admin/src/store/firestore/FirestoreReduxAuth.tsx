// import React from "react"

// interface Props {

// }

// const useFirestoreReduxAuth: React.FC = () =>

// import { Store } from "redux";
// import { onAuthStateChanged, Auth } from "@firebase/auth";

// import { LocalStore } from "@/types/store";

// import { updateAuthUser } from "@/store/actions/authOperations";
// import { useEffect } from "react";
// import { isEmpty } from "lodash";

// /**
//  * A hook used to subscribe to firebase auth state changes and
//  * update said changes to the store
//  * @param auth
//  * @param store
//  */
// export const useConnectAuthToStore = (
//   auth: Auth,
//   store: Store<LocalStore, any>
// ): void => {
//   const dispatch = store.dispatch;
//   const { organizations } = store.getState().firestore.data;
//   const { userData } = store.getState().auth;

//   useEffect(() => {
//     if (organizations && !isEmpty(organizations)) {
//       updateAuthUser(userData);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [organizations]);

//   onAuthStateChanged(auth, (user) => dispatch(updateAuthUser(user)));
// };
export {};
