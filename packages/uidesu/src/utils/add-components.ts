import z from "zod";
import { getRegistryItems } from "../registry/api";
import { configWithDefaults } from "../registry/config";
import { resolveRegistryTree } from "../registry/resolver";
import { configSchema, registryItemFileSchema, registryItemSchema, workspaceConfigSchema } from "../schema";
import { Config, getWorkspaceConfig } from "./get-config";
import { getProjectTailwindVersionFromConfig } from "./get-project-info";
import { handleError } from "./handle-error";
import { isSafeTarget } from "./is-safe-target";
import { logger } from "./logger";
import { spinner } from "./spinner";
import { updateCss } from "./updaters/update-css";
import { updateCssVars } from "./updaters/update-css-vars";
import { updateDependencies } from "./updaters/update-dependencies";
import { updateEnvVars } from "./updaters/update-env-vars";
import { updateFiles } from "./updaters/update-files";
import { updateTailwindConfig } from "./updaters/update-tailwind-config";

export async function addComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean;
    silent?: boolean;
    isNewProject?: boolean;
    baseStyle?: boolean;
    registryHeaders?: Record<string, Record<string, string>>;
    path?: string;
  }
) {
  options = {
    overwrite: false,
    silent: false,
    isNewProject: false,
    baseStyle: true,
    ...options,
  }

  const workspaceConfig = await getWorkspaceConfig(config);
  if (
    workspaceConfig &&
    workspaceConfig.ui &&
    workspaceConfig.ui.resolvedPaths.cwd !== config.resolvedPaths.cwd
  ) {
    return await addWorkspaceComponents(components, config, workspaceConfig, {
      ...options,
      isRemote:
        components?.length === 1 && !!components[0].match(/\/chat\/b\//),
    });
  }

  return await addProjectComponents(components, config, options)
}

async function addProjectComponents(
  components: string[],
  config: z.infer<typeof configSchema>,
  options: {
    overwrite?: boolean
    silent?: boolean
    isNewProject?: boolean
    baseStyle?: boolean
    path?: string
  }
) {
  if (!options.baseStyle && !components.length) {
    return;
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start();
  const tree = await resolveRegistryTree(components, configWithDefaults(config));

  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch components from registry."));
  }

  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd)
  } catch (error) {
    registrySpinner?.fail();
    return handleError(error);
  }

  registrySpinner?.succeed();

  const tailwindVersion = await getProjectTailwindVersionFromConfig(config);

  await updateTailwindConfig(tree.tailwind?.config, config, {
    silent: options.silent,
    tailwindVersion,
  });

  const overwriteCssVars = await shouldOverwriteCssVars(components, config)
  await updateCssVars(tree.cssVars, config, {
    cleanupDefaultNextStyles: options.isNewProject,
    silent: options.silent,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
    overwriteCssVars,
    initIndex: options.baseStyle,
  })

  // Add CSS updater
  await updateCss(tree.css, config, {
    silent: options.silent,
  })

  await updateEnvVars(tree.envVars, config, {
    silent: options.silent,
  })

  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent,
  })
  await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
    path: options.path,
  })

  if (tree.docs) {
    logger.info(tree.docs)
  }
}

async function addWorkspaceComponents(
  components: string[],
  config: z.infer<typeof configSchema>,
  workspaceConfig: z.infer<typeof workspaceConfigSchema>,
  options: {
    overwrite?: boolean;
    silent?: boolean;
    isNewProject?: boolean;
    isRemote?: boolean;
    baseStyle?: boolean;
    path?: string;
  }
) {
  if (!options.baseStyle && !components.length) {
    return;
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start();
  const tree = await resolveRegistryTree(components, configWithDefaults(config));

  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch components from registry."))
  }
}

async function shouldOverwriteCssVars(
  components: z.infer<typeof registryItemSchema>["name"][],
  config: z.infer<typeof configSchema>
) {
  const result = await getRegistryItems(components, { config })
  const payload = z.array(registryItemSchema).parse(result)

  return payload.some(
    (component) =>
      component.type === "registry:theme" || component.type === "registry:style"
  )
}

function validateFilesTarget(
  files: z.infer<typeof registryItemFileSchema>[],
  cwd: string
) {
  for (const file of files) {
    if (!file?.target) {
      continue
    }

    if (!isSafeTarget(file.target, cwd)) {
      throw new Error(
        `We found an unsafe file path "${file.target} in the registry item. Installation aborted.`
      )
    }
  }
}
