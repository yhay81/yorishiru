export const themes = ["apricot", "lake", "leaf", "lilac"] as const;
export const sectionKinds = ["about", "likes", "activity", "trade", "note"] as const;

export type Theme = (typeof themes)[number];
export type SectionKind = (typeof sectionKinds)[number];

export type ProfileSection = {
  body: string;
  id: string;
  kind: SectionKind;
  title: string;
};

export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type ProfileContent = {
  bio: string;
  discoverable: boolean;
  handle: string;
  headline: string;
  links: ProfileLink[];
  readMark: string;
  sections: ProfileSection[];
  symbol: string;
};

export type ProfileRecord = {
  content_json: string;
  created_at: number;
  display_name: string;
  edit_token_hash: string;
  expires_at: number;
  id: string;
  revision: number;
  theme: Theme;
  updated_at: number;
};

export type PublicProfile = Omit<ProfileRecord, "content_json" | "edit_token_hash">;

export type ProfileBundle = {
  content: ProfileContent;
  profile: PublicProfile;
};

export function emptyContent(): ProfileContent {
  return {
    bio: "",
    discoverable: false,
    handle: "",
    headline: "",
    links: [],
    readMark: "",
    sections: [],
    symbol: "◎",
  };
}

export function toPublicProfile(profile: ProfileRecord): PublicProfile {
  const { content_json: _content, edit_token_hash: _token, ...publicProfile } = profile;
  return publicProfile;
}
