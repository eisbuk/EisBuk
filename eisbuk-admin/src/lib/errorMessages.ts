// #region SlotForm
export const __noStartTimeError = "Start Time is required";
// #endregion SlotForm

// #region SlotOperationButtons
export const __slotButtonNoContextError =
  "Error: Each of the slot buttons needs to be nested under the 'SlotOperationButtons' for context. For more information, check the docs for 'SlotOperationButtons'";

export const __noDateProvidedError =
  "Error: No 'date' was provided within the context. This button requires 'date' param in order to have full functionality. For more information, please read the documentation for 'SlotOperationButtons'";

export const __newSlotButtonWrongContextError =
  "Error: NewSlotButton is only allowed to render within \"day\" context. For more information, please read the documentation for 'SlotOperationButtons'";

export const __noSlotProvidedError =
  "Error: No 'slot' param was provided within the context. This button requires 'slot' param in order to have full functionality. For more information, please read the documentation for 'SlotOperationButtons'";

export const __editSlotButtonWrongContextError =
  "Error: EditSlotButton cannot be rendered within any 'contextType' other than \"slot\". For more information, please read the documentation for 'SlotOpeartionButtons'";

export const __copyButtonWrongContextError =
  "Error: CopyButton cannot be rendered within 'contextType = \"slot\"'. For more information, please read the documentation for 'SlotOperationButtons'";

export const __noDateCopy =
  "Error: CopyButton within 'contextType = \"day\" | \"week\"' needs to have a value for 'date' param provided within the context. For more information, please read the documentation for 'SlotOperationButtons'";

export const __pasteButtonWrongContextError =
  "Error: PasteButton cannot be rendered within 'contextType = \"slot\"'. For more information, please read the documentation for 'SlotOperationButtons'";

export const __noDatePaste =
  "Error: PasteButton within 'contextType = \"day\" | \"week\"' needs to have a value for 'date' param provided within the context. For more information, please read the documentation for 'SlotOperationButtons'";

export const __noSlotToDelete =
  "Error: DeleteButton within 'contextType = \"slot\"' needs to have a value for 'slot' param provided within the context. For more information, please read the documentation for 'SlotOperationButtons'";

export const __noDateDelete =
  "Error: DeleteButton within 'contextType = \"day\" | \"week\"' needs to have a value for 'date' param provided within the context. For more information, please read the documentation for 'SlotOperationButtons'";
// #endregion SlotOperationButtons
