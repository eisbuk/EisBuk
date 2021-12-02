import fs from "fs";
import path from "path";
import os from "os";

/**
 * Async procedure used to dump logs from log buffer (object) to string
 * and write that string to a file.
 * @param {object} testLogs object containing logs for each test
 * @param {string} specname the name of test suite ("spec" in cypress)
 * @returns {Promise<void>}
 */
const writeLogFile = async (
  testLogs: Record<string, unknown[][]>,
  specname: string
): Promise<void> => {
  let output = "";

  const processedSpecname = specname.replace(
    /_[a-z]/gi,
    (s) => ` ${s[1].toUpperCase()}`
  );

  // start with heading for the logfile
  output = appendLine(output, `## Logs for ${processedSpecname}`);
  output = appendLine(output, "");

  console.log("Initial output");
  console.log(output);

  Object.keys(testLogs).forEach((testname, i) => {
    const processedTestname = testname.replace(/%[0-9]+/g, " ");

    // add test title for logs region
    output = appendLine(
      output,
      `<b>Logs for Test ${i}: "${processedTestname}"</b>`,
      "</br>"
    );

    // create a markdown for expandable region
    output = appendLine(output, "<details>");
    output = appendLine(output, "<summary>See logs</summary>");

    // add each message to test logs box
    testLogs[testname].forEach(([timestamp, ...msgs]) => {
      output = appendLine(output, `[${timestamp}]`, "</br>");
      // we want the console logs to be indented to begin with
      output += indent("", 1);
      msgs.forEach((msg) => {
        if (["number", "string", "boolean"].includes(typeof msg)) {
          output += `${msg} `;
        } else {
          // if object, start with the new line
          output = appendLine(output, "");
          output += stringifyInteractive(msg, "Object", 1);
        }
      });
      // end with new line
      output = appendLine(output, "", "</br>");
    });

    // finish logs box for a test
    output = appendLine(output, "</details>");
    output = appendLine(output, "");
  });

  const logsDir = path.join(__dirname, "..", "logs");

  // check if logs directory exists
  await new Promise<void>((res) => {
    fs.readdir(logsDir, (err) => {
      if (!err) return res();
      // create dir if it doesn't exist
      return fs.mkdir(logsDir, (err) => {
        if (err) throw err;
        return res();
      });
    });
  });

  // write logs to file
  const logFilePath = path.join(logsDir, `${specname}.logs.md`);
  return new Promise((res) => {
    fs.writeFile(logFilePath, output, (err) => {
      if (err) throw err;
      res();
    });
  });
};

/**
 * Appends a line to passed string `buffer` with `os.EOL` and optional additional line break
 * @param {string} buffer string buffer to which we're appending a line
 * @param {string} content line to append
 * @param {string} additionalLineBreak optional line break added before EOL (i.e. `</br>`)
 * @returns buffer with added line
 */
const appendLine = (
  buffer: string,
  content: string,
  additionalLineBreak = ""
): string => buffer + content + additionalLineBreak + os.EOL;

/**
 * Recursively goes through JSON object and creates an HTML expandable region
 * for each (non-primitive) node
 * @param {unknown} obj object node: object or primitive
 * @param {string} key node key (starts with "Object") on top level and gets passed key for each child node
 * @param {number} level depth of the current node
 * @returns {string} HTML markup used to render interactive expandable object
 */
export const stringifyInteractive = (
  obj: unknown,
  key = "Object",
  level = 0
): string => {
  // key will always be bold, wherever displayed
  const boldKey = `<b>${key}</b>`;

  if (typeof obj !== "object") {
    return appendLine("", indent(`${boldKey}: ${obj}`, level), "</br>");
  }
  if (obj === null) {
    return appendLine("", indent(`${boldKey}: \\*null\\*`, level), "</br>");
  }

  const isArr = obj instanceof Array;

  let content = "";

  // process each property on this obj node
  Object.keys(obj).forEach((key) => {
    content = content + stringifyInteractive(obj[key], key, level + 1);
  });

  return createExpandable({
    title: boldKey,
    content,
    indentation: level + 1,
    isArr,
  });
};

/**
 * Creates a <details> + <summary> HTML expandable content
 * @param {string} title Summary title
 * @param {string} content hidden content
 * @param {number} indentation level of indentation (defaults to 0)
 * @returns HTML for expandable region
 */
const createExpandable = ({
  title,
  content,
  indentation = 0,
  isArr,
}: {
  title: string;
  content: string;
  indentation?: number;
  isArr?: boolean;
}): string => {
  const appendLineWithIndentation = (
    buffer: string,
    content: string,
    additionalLineBreak?: string
  ) =>
    appendLine(buffer, indent(content, indentation - 1), additionalLineBreak);

  let buffer = "";

  buffer = appendLine(buffer, "<details>");

  // brackets with respect to type
  const b = isArr ? ["[", "]"] : ["{", "}"];

  // if empty return correct notation
  if (!content) {
    return appendLineWithIndentation("", `${title}: ${b.join(" ")}`, "</br>");
  }

  buffer = appendLine(buffer, "", "</br>");
  buffer = appendLine(
    buffer,
    `<summary>${indent(title, indentation - 2)}: ${b[0]} ... ${b[1]}</summary>`
  );
  buffer = appendLineWithIndentation(buffer, b[0], "</br>");
  buffer = buffer + content;
  buffer = appendLineWithIndentation(buffer, b[1]);
  buffer = appendLineWithIndentation(buffer, `</details>`);

  return buffer;
};

/**
 * Prepends the content with four spaces per level of indentation
 * by adding HTML whitespace `"&nbsp;"`
 * @param {string} content
 * @param {number} indentation each level of indentation = 4 spaces
 * @returns {string} indented `content`
 */
const indent = (content: string, indentation = 1): string => {
  const numSpaces = indentation > 0 ? indentation * 4 : 0;
  return "&nbsp;".repeat(numSpaces) + content;
};

export default writeLogFile;
