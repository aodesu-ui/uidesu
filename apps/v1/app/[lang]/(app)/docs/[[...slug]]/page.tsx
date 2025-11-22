import { DocsCopyPage } from "@/components/docs-copy-page";
import LanguageAlternativeAlert from "@/components/language-alternative-alert";
import { source } from "@/lib/source";
import { absoluteUrl, getLocalizedUrl } from "@/lib/utils";
import { mdxComponents } from "@/mdx-components";
import fm from "front-matter";
import { findNeighbour } from "fumadocs-core/page-tree";
import Link from "next/link";
import { notFound } from "next/navigation";
import z from "zod";


export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: {
  params: Promise<{ slug?: string[], lang: string }>
}) {
  const { slug, lang: requestedLang } = await props.params;

  console.log("Params:", { slug, lang: requestedLang });
  console.log("Available languages:", Object.keys(source.pageTree));

  let page = source.getPage(slug, requestedLang);
  let alternativePage: typeof page | null = null;
  let alternativeLang = '';
  let usingAlternativeLanguage = false;

  console.log("Found page:", page);

  // Si la página no se encuentra en el idioma solicitado, buscar en otros idiomas
  if (!page) {
    console.log("Page not found for:", { slug, lang: requestedLang });

    // Buscar en otros idiomas
    const availableLanguages = Object.keys(source.pageTree);

    for (const otherLang of availableLanguages) {
      if (otherLang !== requestedLang) {
        const foundPage = source.getPage(slug, otherLang);
        if (foundPage) {
          alternativePage = foundPage;
          alternativeLang = otherLang;
          usingAlternativeLanguage = true;
          console.log(`Found page in alternative language: ${otherLang}`, foundPage);
          break;
        }
      }
    }

    // Si no se encontró en ningún idioma
    if (!alternativePage) {
      notFound();
    }

    // Usar la página del idioma alternativo
    page = alternativePage;
  }

  const doc = page.data;
  const MDX = doc.body;

  // Usar el tree del idioma de la página encontrada (puede ser diferente al solicitado)
  const pageLang = usingAlternativeLanguage ? alternativeLang : requestedLang;
  const localizedTree = source.pageTree[pageLang];
  const neighbours = findNeighbour(localizedTree, page.url);

  console.log("Using page from language:", pageLang);
  console.log("Neighbours:", neighbours);

  const raw = await page.data.getText("raw");
  const { attributes } = fm(raw);
  const { links } = z
    .object({
      links: z
        .object({
          doc: z.string().optional(),
          api: z.string().optional(),
        })
        .optional(),
    })
    .parse(attributes);

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-neutral-800 md:px-0 lg:py-8 dark:text-neutral-100">
          {/* Mostrar aviso si estamos usando un idioma alternativo */}
          {usingAlternativeLanguage && (
            <LanguageAlternativeAlert
              currentLang={requestedLang}
              availableLang={alternativeLang}
            />
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                  {doc.title}
                </h1>
                <div>
                  <DocsCopyPage page={raw} url={absoluteUrl(page.url)} />
                  {neighbours.previous && (
                    <Link href={getLocalizedUrl(neighbours.previous.url, requestedLang)}>
                      {neighbours.previous.name}
                    </Link>
                  )}
                  {neighbours.next && (
                    <Link href={getLocalizedUrl(neighbours.next.url, requestedLang)}>
                      {neighbours.next.name}
                    </Link>
                  )}
                </div>
              </div>
              {doc.description && (
                <p className="text-muted-foreground text-[1.05rem] text-balance sm:text-base">{doc.description}</p>
              )}
            </div>
            {links ? (
              <div className="flex items-center gap-2 pt-4">
                {links?.doc && (
                  <div>Docs</div>
                )}
                {links?.api && (
                  <div>API</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="w-full flex-1 *:data-[slot=alert]:first:mt-0">
            <MDX components={mdxComponents} />
          </div>

          {/* Aquí podrías agregar la navegación entre páginas si lo deseas */}
          {neighbours && (neighbours.previous || neighbours.next) && (
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              {neighbours.previous && (
                <a
                  href={neighbours.previous.url}
                  className="flex flex-col gap-1 sm:max-w-[45%] p-4 rounded-lg border border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 transition-colors"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Anterior
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {neighbours.previous.name}
                  </span>
                </a>
              )}
              {neighbours.next && (
                <a
                  href={neighbours.next.url}
                  className="flex flex-col gap-1 sm:max-w-[45%] p-4 rounded-lg border border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 transition-colors ml-auto text-right"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Siguiente
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {neighbours.next.name}
                  </span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
