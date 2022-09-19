import { prompt } from "inquirer";

/**
 * Command preAction hook to confirm action before continuing
 * Hook should be used before any commands whose actions are irreversible
 */
export async function useConfirmPrompt(message: string): Promise<void> {
  const question = {
    type: "confirm",
    name: "confirmAction",
    message,
    default: false,
  };

  try {
    const { confirmAction } = await prompt([question]);

    if (!confirmAction) {
      throw new Error("Aborting...");
    }

    return;
  } catch (err: any) {
    console.log(err.message);
    process.exit(1);
  }
}
