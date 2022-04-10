# Auth hooks

## useAuthFlow

The `useAuthFlow` hook provides a level of abstraction for easier communication with firebase backend and handling errors in a predictable way:

Params:

- `errorFieldMap` (optional) - a map keyed by firebase error codes and appropriate field to invalidate upon received error (using `setFieldError`)

Returns:

- `wrapSubmit` - a higher order function which accepts `handleSubmit` callback and creates an `onSubmit` handler for `Formik`.
- `dialogError` - an error that should be displayed in the UI (as a dialog with a `dismiss` button)
- `removeDialogError` - a function called on `dismiss` button (in error dialog) click - removes the `dialogError` from hook's internal state

### Wrap submit

```tsx
const { wrapSubmit } = useAuthFlow();

// handle submit method for a particular step
const handleSubmit = async ({ email }: FormikValues<{ email: string }>) =>
  fetchSignInMethodsForEmail(email);

// wrap the `handleSubmit` function
return <Formik onSubmit={wrapSubmit(handleSubmit)}>{/* Form UI */}</Formik>;
```

`wrapSubmit` creates a handler of the same interface as `handleSubmit`:

```typescript
interface OnSubmit<V extends Record<string, any>> {
  (values: V, formikHelpers: FormikHelpers<V>): void | Promise<void>;
}
```

It wraps a `handleSubmit` function in a try/catch block, runs the `handleSubmit` with received params (`Pameters<OnSubmit>` in this case) and handles the received error by either keeping it in state as `dialogError` or setting the error message as field validation error using `setFieldError` from `formikHelpers` received as props. Setting This behaviour is configurable by passing `errorFieldMap`.

### Error field map

The `errorFieldMap` is a record keyed by firebase error code (i.e. `"auth/wrong-password"`) and the appropriate field name (i.e. `"email"`) as value. If the error caught by `wrapSubmit`'s `catch` block exists as a key in `errorFieldMap`, the hook will invalidate field with the name keyed by the given error:

```tsx
const errorFieldMap: ErrorFieldMap = {
  ["auth/wrong-email"]: "email",
};

const { wrapSubmit } = useAuthFlow(errorFieldMap);

const handleSubmit = () => {
  throw { code: "auth/wrong-email", message: "Please enter a valid email" };
};

return (
  <Formik onSubmit={wrapSubmit(handleSubmit)}>
    <Field name="email" />
  </Formik>
);
```

In the example above, the `handleSubmit` function throws `auth/wrong-email`, the `wrapSubmit` catches the error, looks it up in `errorFieldMap` and uses `setFieldError` (received as `formikHelpers`) to set `"Please enter a valid email"` as field error of `"email"` input field.\*

If the error isn't found in `errorFieldMap` keys, the erorr message will be updates as `dialogError` in the hook's internal state

```tsx
const errorFieldMap: ErrorFieldMap = {
  ["auth/wrong-email"]: "email",
};

const { dialogError, wrapSubmit } = useAuthFlow(errorFieldMap);

const handleSubmit = () => {
  throw { code: "auth/user-not-found", message: "This email doesn't belong to any of our users" };
};

return (
  <Formik onSubmit={wrapSubmit(handleSubmit)}>
    <Field name="email" />
  </Formik>
```

In this case (since `"auth/user-not-found"` isn't listed in `errorFieldMap`) the `dialogError` returned from `useAuthFlow` will have value of `"This email doesn't belong to any of our users"`.\*

_\*error messages here are used only as an example whereas, in reality, the error codes received will be used to find an i18n localized error message and fall back to `"Unknown error"` if localized error message not found_

### Dialog error

The `dialogError` is updated in the way explained above and returned from the hook to be used in the UI. Additionally the hook returns `resetDialogError` method, used to remove the `dialogError` from hook's internal state (and inherently from the UI)

```tsx
const { dialogError, resetDialogError } = useAuthFlow();

return (
  <Formik>
    <AuthErrorDialog
      message={dialogError}
      open={Boolean(dialogError)}
      onClose={resetDialogError}
    />
    {/* Form UI */}
  </Formik>
);
```
