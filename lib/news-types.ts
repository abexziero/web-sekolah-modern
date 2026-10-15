import type { NewsBlock } from "./news-validation";
export type NewsView = { id: string; title: string; category: string; image: string; alt: string; excerpt: string; blocks: NewsBlock[]; example: boolean; publishedAt?: string };

export function articleParts(blocks: NewsBlock[]) {
  const intro: string[] = [];
  const sections: { heading: string; paragraphs: string[]; id: string }[] = [];
  for (const block of blocks) {
    if (block.type === "heading") sections.push({ heading: block.text, paragraphs: [], id: `bacaan-${sections.length + 1}` });
    else if (sections.length) sections[sections.length - 1].paragraphs.push(block.text);
    else intro.push(block.text);
  }
  return { intro, sections };
}
