import z from "zod";
import { Config } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { logger } from "../utils/logger";
import { buildUrlAndHeadersForRegistryItem } from "./builder";
import { configWithDefaults } from "./config";
import { BASE_COLORS, REGISTRY_URL } from "./constants";
import { clearRegistryContext, setRegistryHeaders } from "./context";
import { RegistriesIndexParseError, RegistryInvalidNamespaceError, RegistryNotFoundError, RegistryParseError } from "./errors";
import { fetchRegistry } from "./fetcher";
import { fetchRegistryItems } from "./resolver";
import { registriesIndexSchema, registryIndexSchema, registrySchema, stylesSchema } from "./schema";
import { isUrl } from "./utils";

export async function getRegistry(
  name: string,
  options?: {
    config?: Partial<Config>
    useCache?: boolean
  }
) {
  const { config, useCache } = options || {};

  if (isUrl(name)) {
    const [result] = await fetchRegistry([name], { useCache });
    try {
      return registrySchema.parse(result);
    } catch (error) {
      throw new RegistryParseError(name, error);
    }
  }

  if (!name.startsWith("@")) {
    throw new RegistryInvalidNamespaceError(name);
  }

  let registryName = name;
  if (!registryName.endsWith("/registry")) {
    registryName = `${registryName}/registry`
  }

  const urlAndHeaders = buildUrlAndHeadersForRegistryItem(
    registryName as `@${string}`,
    configWithDefaults(config)
  );

  if (!urlAndHeaders?.url) {
    throw new RegistryNotFoundError(registryName);
  }

  if (urlAndHeaders.headers && Object.keys(urlAndHeaders.headers).length > 0) {
    setRegistryHeaders({
      [urlAndHeaders.url]: urlAndHeaders.headers,
    })
  }

  const [result] = await fetchRegistry([urlAndHeaders.url], { useCache });

  try {
    return registrySchema.parse(result);
  } catch (error) {
    throw new RegistryParseError(registryName, error);
  }
}

export async function getRegistryItems(
  items: string[],
  options?: {
    config?: Partial<Config>
    useCache?: boolean
  }
) {
  const { config, useCache } = options || {};

  clearRegistryContext();

  return fetchRegistryItems(items, configWithDefaults(config), { useCache })
}

export async function getAodesuRegistryIndex() {
  try {
    const [result] = await fetchRegistry(["index.json"])

    return registryIndexSchema.parse(result)
  } catch (error) {
    logger.error("\n")
    handleError(error)
  }
}

export async function getRegistryStyles() {
  try {
    const [result] = await fetchRegistry(["styles/index.json"]);

    return stylesSchema.parse(result);
  } catch (error) {
    logger.error("\n");
    handleError(error);
    return [];
  }
}

export async function getRegistryBaseColors() {
  return BASE_COLORS;
}

export async function getRegistriesIndex(options?: { useCache?: boolean }) {
  options = {
    useCache: true,
    ...options,
  }

  const url = `${REGISTRY_URL}/registries.json`
  const [data] = await fetchRegistry([url], {
    useCache: options.useCache,
  })

  try {
    return registriesIndexSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new RegistriesIndexParseError(error)
    }

    throw error
  }
}
