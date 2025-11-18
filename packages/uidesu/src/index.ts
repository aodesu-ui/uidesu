#!/usr/bin/env node
import { Command } from "commander";
import packageJson from "../package.json";
import { build } from "./commands/build";
import { init } from "./commands/init";

process.on("SIGNINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command()
    .name("uidesu")
    .description("add items from registry to your project")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program
    .addCommand(init)
    .addCommand(build)

  program.parse()
}

main()

// export * from './registry/api';
