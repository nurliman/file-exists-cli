import fs from "node:fs";
import path from "node:path";
import { version } from "@package";
import meow from "meow";

const cli = meow(
  `
	Usage
	  $ exists <file-path> [options]

	Options
    --reverse, -r   Reverse output
    --silent, -s    Silent output, except \`onError\` command
    --onError       Execute command on error
    --version       Show version
    --help          Show this help message

	Examples
	  $ exists ./package.json --reverse
`,
  {
    importMeta: import.meta,
    flags: {
      reverse: {
        type: "boolean",
        shortFlag: "r",
        default: false,
      },
      silent: {
        type: "boolean",
        shortFlag: "s",
        default: false,
      },
      version: {
        type: "boolean",
        default: false,
        isMultiple: false,
        isRequired: false,
        shortFlag: "v",
      },
      onError: {
        type: "string",
        default: "",
      },
    },
  },
);

type LogType = "log" | "debug" | "error" | "info" | "warn";

/** console wrapper */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const consola = (type: LogType = "log", ...args: any[]) => {
  if (!cli.flags.silent) {
    console[type]?.(...args);
  }
};
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
consola.log = (...args: any) => consola("log", ...args);
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
consola.info = (...args: any) => consola("info", ...args);
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
consola.error = (...args: any) => consola("error", ...args);

async function main() {
  // show version
  if (cli.flags.version) {
    console.log(version);
    return;
  }

  const filePath = cli.input[0];
  const { reverse } = cli.flags;

  // check if argument is not empty
  if (!filePath) {
    consola.error("No file path provided.");
    return cli.showHelp?.();
  }

  const isFileExists = fs.existsSync(filePath);

  let exitCode: number;
  let message: string;

  if (isFileExists) {
    message = `File "${path.resolve(filePath)}" exists.`;
  } else {
    message = `File "${path.resolve(filePath)}" does not exists.`;
  }

  if (reverse) {
    exitCode = isFileExists ? 1 : 0;
  } else {
    exitCode = isFileExists ? 0 : 1;
  }

  consola.info(message);

  if (cli.flags.onError && exitCode !== 0) {
    consola.info(`Executing command "${cli.flags.onError}"`);
    const { execa } = await import("execa");
    const onErrorReturn = await execa(cli.flags.onError, {
      shell: true,
      stdio: "inherit",
    });

    if (typeof onErrorReturn.exitCode === "number") {
      exitCode = onErrorReturn.exitCode;
    }
  }

  process.exit(exitCode);
}

main();
