import { ContentNode } from "../types/content";

const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
const htmlTagRegex = /<[^>]+>/g;
const brTagRegex = /<br\s*\/?>/gi;

export const parseHtmlContent = (html: string): ContentNode[] => {
  const content: ContentNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const processAndPushText = (rawText: string) => {
    const textContent = rawText
      .replace(/[\r\n\t]+/g, " ")
      .replace(brTagRegex, "\n")
      .replace(htmlTagRegex, " ")
      .replace(/&nbsp;/g, "\u00A0")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/ +/g, " ")
      .replace(/ \n/g, "\n")
      .replace(/\n /g, "\n")
      .trim();

    if (textContent) {
      content.push({ type: "text", text: textContent });
    }
  };

  while ((match = imgTagRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    const imgStartIndex = match.index;
    const imgEndIndex = imgTagRegex.lastIndex;

    if (imgStartIndex > lastIndex) {
      processAndPushText(html.substring(lastIndex, imgStartIndex));
    }

    content.push({ type: "image", imgUrl });

    lastIndex = imgEndIndex;
  }

  if (lastIndex < html.length) {
    processAndPushText(html.substring(lastIndex));
  }

  return content;
};
