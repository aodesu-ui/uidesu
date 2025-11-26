import z from "zod";
import { Config } from "../utils/get-config";
import { getProjectInfo } from "../utils/get-project-info";
import { findCommonRoot, resolveFilePath } from "../utils/updaters/update-files";
import { registryItemFileSchema, registryItemSchema } from "./schema";

export function isUrl(path: string) {
  try {
    new URL(path);
    return true;
  } catch (error) {
    return false;
  }
}

export function isLocalFile(path: string) {
  return path.endsWith(".json") && !isUrl(path);
}

export function isUniversalRegistryItem(
  registryItem:
    | Pick<z.infer<typeof registryItemSchema>, "files" | "type">
    | null
    | undefined
): boolean {
  if (!registryItem) {
    return false;
  }

  if (
    registryItem.type !== "registry:item" &&
    registryItem.type !== "registry:file"
  ) {
    return false;
  }

  const files = registryItem.files ?? [];

  return files.every(
    (file) =>
      !!file.target &&
    (file.type === "registry:file" || file.type === "registry:item")
  );
}

// Deduplicates files based on their resolved target paths.
// When multiple files resolve to the same target path, the last one wins.
export async function deduplicateFilesByTarget(
  filesArrays: Array<z.infer<typeof registryItemFileSchema>[] | undefined>,
  config: Config
) {
  // Fallback to simple concatenation when we don't have complete config.
  if (!canDeduplicateFiles(config)) {
    return z
      .array(registryItemFileSchema)
      .parse(filesArrays.flat().filter(Boolean))
  }

  // Get project info for file resolution.
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd)
  const targetMap = new Map<string, z.infer<typeof registryItemFileSchema>>()
  const allFiles = z
    .array(registryItemFileSchema)
    .parse(filesArrays.flat().filter(Boolean))

  allFiles.forEach((file) => {
    const resolvedPath = resolveFilePath(file, config, {
      isSrcDir: projectInfo?.isSrcDir,
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        allFiles.map((f) => f.path),
        file.path
      ),
    })

    if (resolvedPath) {
      // Last one wins - overwrites previous entry.
      targetMap.set(resolvedPath, file)
    }
  })

  return Array.from(targetMap.values())
}

// Checks if the config has the minimum required paths for file deduplication.
export function canDeduplicateFiles(config: Config) {
  return !!(
    config?.resolvedPaths?.cwd &&
    (config?.resolvedPaths?.ui ||
      config?.resolvedPaths?.lib ||
      config?.resolvedPaths?.components ||
      config?.resolvedPaths?.hooks)
  )
}
