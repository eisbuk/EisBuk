import React, { useState } from "react";

import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

const auth = getAuth();

const SignInSide: React.FC = () => {
  const style = {
    position: "absolute",
    width: "0.5vw",
    height: "0.5vh",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  } as React.CSSProperties;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getLoginMethods = async () => {
    const res = await fetchSignInMethodsForEmail(auth, email);
    console.log(res);
  };

  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
      console.log(res);
    } catch (err) {
      const { code, message } = err as Record<string, string>;
      console.log("Error, code > ", code);
      console.log("Error, message > ", message);
    }
  };

  // const signup = async () => {
  //   try {
  //     const res = await create(auth, email, password);
  //     console.log("Login successful");
  //     console.log(res);
  //   } catch (err) {
  //     const { code, message } = err as Record<string, string>;
  //     console.log("Error, code > ", code);
  //     console.log("Error, message > ", message);
  //   }

  // }

  return (
    <div {...{ style }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={getLoginMethods}>Fetch login methods</button>
      <button onClick={login}>Login</button>
      {/* <button onClick={signup}>Signup</button> */}
    </div>
  );
};

export default SignInSide;
