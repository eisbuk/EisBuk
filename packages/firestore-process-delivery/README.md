# Firestore process delivery

Firestore process delivery provides a convenient way of processing a "delivery" which might or might not be successful. It uses Firestore documents to record the delivery state and allow for success/error reporting and retries.

## Basic usage

Rather than using a single async function to execute the delivery, the process delivery uses a firestore document as its `ProcessDocument`. That document is used to initialize the delivery process, record current delivery state (as `delivery` property on the document) and pass `payload` to delivery execution (the structure of the `payload` depends on the execution implementation). The delivery execution is specified as a callback to `processDelivery` function.

To set up an instance utilising `processDelivery`, we first need a designated collection to listen to. Let's say we want to create a process delivery logic for email sending. We need to create a collection for email process documents. Let's name the collection `send-email`. Each time we write to `send-email` collection, the document should get picked up by Firestore's `onWrite` data trigger and start the execution of email delivery process.

Each (email) document should contain a `payload` entry specifying a payload for a particular email (to, subject, html, etc...).

To set up the data trigger, we create an `onWrite` listener, listening to document updates in `send-email` collection and calling to the `processDelivery` function (a default export of `firestore-process-delivery` package), passing to it the send-email execution logic as a callback:

```typescript
import processDelivery from "firestore-process-delivery";

const deliverEmail = functions
  .region(__functionsZone__)
  // Listen to document writes to "send-email" collection
  .firestore.document("send-email/{email}")
  .onWrite((change) =>
    processDelivery(change, async () => {
      // Read payload from the email process document
      //
      // Payload depends on the delivery implementation. For this case (email sending)
      // if can contain something like email 'to', 'subject' and 'html' properties
      const { payload } = change.after.data();

      // sendEmail is an imaginary async function used to deliver the email to the recipient
      sendEmail({ to });
    })
  );
```

### Reporting delivery status

With the basic usage above, we're able to execute `sendEmail` as an email delivery function, on each email document write. This, however doesn't achieve much in terms of status reporting and, in fact, TypeScript will yell at you for not returning anything from the function, when a `DeliverResultTuple` is expected.

There's no need to return that tuple manually. For that we have the convenience methods `success` and `failure` passed as an argument to the `deliver` callback. Both of those methods construct a success/error tuple respectively, to be returned from the `deliver` function. The returned data is then used by the `processDelivery` logic to update the `delivery` state on a given process document.

So the appropriate usage should look something like this:

```typescript
import processDelivery from "firestore-process-delivery";

const deliverEmail = functions
  .region(__functionsZone__)
  // Listen to document writes to "send-email" collection
  .firestore.document("send-email/{email}")
  .onWrite((change) =>
    processDelivery(change, async ({ success, error }) => {
      try {
        // Read payload from the email process document
        //
        // Payload depends on the delivery implementation. For this case (email sending)
        // if can contain something like email 'to', 'subject' and 'html' properties
        const { payload } = change.after.data();

        // sendEmail is an imaginary async function used to deliver the email to the recipient
        const res = await sendEmail({ to });

        // Return a success tuple with the result (to be written to `delivery` state in the process document)
        return success(res);
      } catch (err) {
        // On error, construct an error tuple, used to update the `delivery` state accordingly
        //
        // Please note that some usages might return multiple errors.
        // Therefore errors are always returned as an array of error message strings
        return error([err.message]);
      }
    })
  );
```

### Reporting metadata

Some deliveries might have multiple success states. An example, using email sending might be that we're using a service to which we send a request with the email payload. The successful delivery (in scope of this delivery process) is when the email sending service receives our request. However, the status of the request (on service provider's side) might be (for instance) `delivered`, `accepted`, `waiting`. All three are accaptable (success) states. However, we might want to check and/or update the state on provider's side and have that somehow logged to out process document.

We can report that, lets call it `acceptanceState`, as metadata like so:

```typescript
import processDelivery from "firestore-process-delivery";

const deliverEmail = functions
  .region(__functionsZone__)
  .firestore.document("send-email/{email}")
  .onWrite((change) =>
    processDelivery(change, async ({ success, error }) => {
      try {
        const { payload } = change.after.data();

        const res = await sendEmail({ to });

        // Let's say our `sendEmail` function returns the `acceptanceState` among other things
        const { acceptanceState } = res;

        // Create a success tuple with metadata (both recorded in process document)
        return success(res, { acceptanceState });
      } catch (err) {
        return error([err.message]);
      }
    })
  );
```
