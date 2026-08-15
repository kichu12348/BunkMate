export type ContentNode =
  | { type: "text"; text: string }
  | { type: "image"; imgUrl: string };
