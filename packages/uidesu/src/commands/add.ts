import { Command } from "commander";
import path from "path";
import prompts from "prompts";
import z from "zod";
import { getRegistryItems } from "../registry/api";
import { clearRegistryContext } from "../registry/context";
import { isUniversalRegistryItem } from "../registry/utils";
import { addComponents } from "../utils/add-components";
import { loadEnvFiles } from "../utils/env-loader";
import { createConfig, getConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { highlighter } from "../utils/highlighter";
import { logger } from "../utils/logger";
import { ensureRegistriesInConfig } from "../utils/registries";

export const addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
  silent: z.boolean(),
  srcDir: z.boolean().optional(),
  cssVariables: z.boolean(),
})

export const add = new Command()
  .name("add")
  .description("add a component to your project.")
  .argument("[components...]", "names, url or local path to component.")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add the component to.")
  .option("-s, --silent", "mute output.", false)
  .option(
    "--src-dir",
    "use the src directory when creating a new project.",
    false
  )
  .option(
    "--no-src-dir",
    "do not use the src directory when creating a new project."
  )
  .option("--css-variables", "use css variables for theming.", true)
  .option("--no-css-variables", "do not use css variables for theming.")
  .action(async (components, opts) => {
    try{
      const options = addOptionsSchema.parse({
        components,
        cwd: path.resolve(opts.cwd),
        ...opts,
      });

      await loadEnvFiles(options.cwd);

      let initialConfig = await getConfig(options.cwd);
      if (!initialConfig) {
        initialConfig = createConfig({
          style: "aodesu",
          resolvedPaths: {
            cwd: options.path,
          },
        })
      }

      let hasNewRegistries = false;
      if (components.length > 0) {
        const { config: updatedConfig, newRegistries } =
          await ensureRegistriesInConfig(components, initialConfig, {
            silent: options.silent,
            writeFile: false,
          });
        initialConfig = updatedConfig;
        hasNewRegistries = newRegistries.length > 0;
      }

      if (components.length > 0) {
        const [registryItem] = await getRegistryItems([components[0]], {
          config: initialConfig,
        })
        const itemType = registryItem?.type

        if (isUniversalRegistryItem(registryItem)) {
          await addComponents(components, initialConfig, options)
          return
        }

        if (
          !options.yes &&
          (itemType === "registry:style" || itemType === "registry:theme")
        ) {
          logger.break()
          const { confirm } = await prompts({
            type: "confirm",
            name: "confirm",
            message: highlighter.warn(
              `You are about to install a new ${itemType.replace(
                "registry:",
                ""
              )}. \nExisting CSS variables and components will be overwritten. Continue?`
            ),
          })
          if (!confirm) {
            logger.break()
            logger.log(`Installation cancelled.`)
            logger.break()
            process.exit(1)
          }
        }
      }

    } catch (error) {
      logger.break();
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  })
