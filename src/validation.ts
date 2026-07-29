import {
  sectionKinds,
  themes,
  type ProfileContent,
  type ProfileLink,
  type ProfileSection,
  type SectionKind,
  type Theme,
} from "./domain";

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const itemIdPattern = /^[A-Za-z0-9_-]{6,24}$/;

type ObjectPayload = Record<string, unknown>;

const cleanText = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

export function validSessionId(value: unknown): value is string {
  return typeof value === "string" && sessionIdPattern.test(value);
}

function validHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && value.length <= 300;
  } catch {
    return false;
  }
}

function validSection(value: unknown): value is ProfileSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const section = value as ObjectPayload;
  const id = cleanText(section.id, 24);
  const kind = cleanText(section.kind, 12);
  const title = cleanText(section.title, 40);
  const body = cleanText(section.body, 800);
  return (
    itemIdPattern.test(id) &&
    sectionKinds.includes(kind as SectionKind) &&
    title.length > 0 &&
    title === section.title &&
    body.length > 0 &&
    body === section.body
  );
}

function validLink(value: unknown): value is ProfileLink {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const link = value as ObjectPayload;
  const id = cleanText(link.id, 24);
  const label = cleanText(link.label, 40);
  const url = cleanText(link.url, 300);
  return (
    itemIdPattern.test(id) &&
    label.length > 0 &&
    label === link.label &&
    url === link.url &&
    validHttpsUrl(url)
  );
}

export function validateContent(value: unknown): ProfileContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const content = value as ObjectPayload;
  const symbol = cleanText(content.symbol, 8);
  const handle = cleanText(content.handle, 40);
  const headline = cleanText(content.headline, 80);
  const bio = cleanText(content.bio, 600);
  const readMark = cleanText(content.readMark, 20);
  if (
    symbol.length < 1 ||
    symbol !== content.symbol ||
    handle !== content.handle ||
    headline !== content.headline ||
    bio !== content.bio ||
    readMark !== content.readMark ||
    typeof content.discoverable !== "boolean" ||
    !Array.isArray(content.sections) ||
    !Array.isArray(content.links) ||
    content.sections.length > 8 ||
    content.links.length > 8 ||
    !content.sections.every(validSection) ||
    !content.links.every(validLink)
  ) {
    return null;
  }
  const ids = [
    ...content.sections.map((section) => (section as ProfileSection).id),
    ...content.links.map((link) => (link as ProfileLink).id),
  ];
  if (new Set(ids).size !== ids.length) return null;
  return {
    bio,
    discoverable: content.discoverable,
    handle,
    headline,
    links: content.links as ProfileLink[],
    readMark,
    sections: content.sections as ProfileSection[],
    symbol,
  };
}

export type ValidProfileInput = {
  content: ProfileContent;
  displayName: string;
  sessionId: string;
  theme: Theme;
};

export function validateProfileInput(payload: ObjectPayload): ValidProfileInput | null {
  const displayName = cleanText(payload.displayName, 40);
  const theme = cleanText(payload.theme, 12);
  const content = validateContent(payload.content);
  if (
    displayName.length < 1 ||
    displayName !== payload.displayName ||
    !themes.includes(theme as Theme) ||
    !content ||
    !validSessionId(payload.sessionId) ||
    cleanText(payload.website, 200)
  ) {
    return null;
  }
  return { content, displayName, sessionId: payload.sessionId as string, theme: theme as Theme };
}

export function validateProfileUpdate(payload: ObjectPayload) {
  const input = validateProfileInput(payload);
  const revision = Number(payload.revision);
  return input && Number.isInteger(revision) && revision >= 1 && revision < 10_000
    ? { ...input, revision }
    : null;
}

export function profileExpiry() {
  return Math.floor(Date.now() / 1000) + 365 * 86_400;
}
