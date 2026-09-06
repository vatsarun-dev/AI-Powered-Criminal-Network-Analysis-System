export type CasePropertyValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

export type CaseProperties = Record<string, CasePropertyValue>;

export type CaseResponse = CaseProperties & {
  id: string;
};
