import { describe, expect, it } from "vitest";

import type { ProfileContent, ProfileRecord } from "../src/domain";
import { hashValue } from "../src/security/tokens";
import { validateContent, validateProfileInput } from "../src/validation";
import { app, type Bindings } from "../src/worker";

const sessionId = "313c096a-2ab6-4bda-a6bc-21361e522e99";

type RecordedStatement = {
  bindings: unknown[];
  sql: string;
};

function database(options: { changes?: number; profile?: ProfileRecord } = {}) {
  const recorded: RecordedStatement[] = [];
  const db = {
    batch: () => Promise.resolve([]),
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          bindings = values;
          return statement;
        },
        first: async () => (sql.includes("FROM profiles") ? (options.profile ?? null) : null),
        run: async () => {
          recorded.push({ bindings, sql });
          return { meta: { changes: options.changes ?? 1 }, success: true };
        },
      };
      return statement;
    },
  };
  return { db: db as unknown as D1Database, recorded };
}

function bindings(db: D1Database): Bindings {
  return {
    ASSETS: {
      fetch: () => Promise.resolve(new Response("not used")),
    } as unknown as Fetcher,
    DB: db,
    WRITE_LIMITER: {
      limit: () => Promise.resolve({ success: true }),
    },
  };
}

function content(discoverable = false): ProfileContent {
  return {
    bio: "創作と旅の記録をまとめています。",
    discoverable,
    handle: "@ao",
    headline: "青いものと短編小説が好きです",
    links: [
      {
        id: "link0001",
        label: "作品一覧",
        url: "https://example.com/works",
      },
    ],
    readMark: "文末に 🍋 を添えてください",
    sections: [
      {
        body: "美術館、喫茶店、短編小説",
        id: "section1",
        kind: "likes",
        title: "好きなもの",
      },
    ],
    symbol: "◎",
  };
}

function profile(editTokenHash = "hash", discoverable = false): ProfileRecord {
  return {
    content_json: JSON.stringify(content(discoverable)),
    created_at: 1,
    display_name: "あお",
    edit_token_hash: editTokenHash,
    expires_at: Math.floor(Date.now() / 1000) + 365 * 86_400,
    id: "AbCdEfGhIjK",
    revision: 1,
    theme: "lake",
    updated_at: 1,
  };
}

function createPayload() {
  return {
    content: content(),
    displayName: "あお",
    sessionId,
    theme: "lake",
    website: "",
  };
}

describe("worker", () => {
  it("renders the visual builder without a text-led hero or experiment copy", async () => {
    const { db } = database();
    const response = await app.request("/", undefined, bindings(db));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(html).toContain('lang="ja"');
    expect(html).toContain('id="create-profile-form"');
    expect(html).toContain('class="card-preview"');
    expect(html).toContain("見出しつき本文を貼る");
    expect(html).not.toContain('class="hero"');
    expect(html).not.toContain("仮説");
    expect(html).not.toContain("成功条件");
  });

  it("renders an unlisted profile with escaped content and noindex", async () => {
    const unsafe = content();
    unsafe.bio = "<script>alert(1)</script>";
    const { db } = database({
      profile: { ...profile(), content_json: JSON.stringify(unsafe) },
    });
    const response = await app.request("/p/AbCdEfGhIjK", undefined, bindings(db));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("noindex, nofollow");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("好きなもの");
    expect(html).toContain("作品一覧");
  });

  it("allows an explicit discoverable profile to be indexed", async () => {
    const { db } = database({ profile: profile("hash", true) });
    const response = await app.request("/p/AbCdEfGhIjK", undefined, bindings(db));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).not.toContain("noindex, nofollow");
    expect(html).toContain("<title>あお | よりしる</title>");
  });

  it("creates a profile while storing only a hash of the edit token", async () => {
    const { db, recorded } = database();
    const response = await app.request(
      "/api/profiles",
      {
        body: JSON.stringify(createPayload()),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      bindings(db),
    );
    const body = await response.json<{ editPath: string; editToken: string; profileId: string }>();

    expect(response.status).toBe(201);
    expect(body.editPath).toContain(`#${body.editToken}`);
    expect(body.profileId).toMatch(/^[A-Za-z0-9_-]{10,12}$/);
    expect(recorded[0]?.bindings[1]).toBe(await hashValue(body.editToken));
    expect(recorded[0]?.bindings).not.toContain(body.editToken);
  });

  it("requires the secret edit token for management reads", async () => {
    const editToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO12";
    const { db } = database({ profile: profile(await hashValue(editToken)) });

    const denied = await app.request("/api/profiles/AbCdEfGhIjK/manage", undefined, bindings(db));
    const allowed = await app.request(
      "/api/profiles/AbCdEfGhIjK/manage",
      { headers: { Authorization: `Bearer ${editToken}` } },
      bindings(db),
    );

    expect(denied.status).toBe(401);
    expect(allowed.status).toBe(200);
  });

  it("returns a conflict when an optimistic update is stale", async () => {
    const editToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO12";
    const { db } = database({
      changes: 0,
      profile: profile(await hashValue(editToken)),
    });
    const response = await app.request(
      "/api/profiles/AbCdEfGhIjK",
      {
        body: JSON.stringify({ ...createPayload(), revision: 1 }),
        headers: {
          Authorization: `Bearer ${editToken}`,
          "Content-Type": "application/json",
        },
        method: "PUT",
      },
      bindings(db),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "stale_revision" });
  });

  it("rejects unsafe links and duplicate item ids", () => {
    const unsafe = content();
    unsafe.links[0]!.url = "http://example.com";
    expect(validateContent(unsafe)).toBeNull();

    const duplicate = content();
    duplicate.links[0]!.id = duplicate.sections[0]!.id;
    expect(validateContent(duplicate)).toBeNull();
  });

  it("enforces the honeypot and session id on profile writes", () => {
    expect(validateProfileInput({ ...createPayload(), website: "bot" })).toBeNull();
    expect(validateProfileInput({ ...createPayload(), sessionId: "wrong" })).toBeNull();
    expect(validateProfileInput(createPayload())).not.toBeNull();
  });

  it("discards automated QA telemetry and stores valid anonymous events", async () => {
    const automatedDb = database();
    const automated = await app.request(
      "/api/telemetry",
      {
        body: JSON.stringify({ automated: true, name: "created", sessionId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      bindings(automatedDb.db),
    );
    expect(automated.status).toBe(204);
    expect(automatedDb.recorded).toHaveLength(0);

    const validDb = database();
    const valid = await app.request(
      "/api/telemetry",
      {
        body: JSON.stringify({
          automated: false,
          name: "profile_viewed",
          profileId: "AbCdEfGhIjK",
          sessionId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      bindings(validDb.db),
    );
    expect(valid.status).toBe(204);
    expect(validDb.recorded[0]?.bindings[1]).toBe("AbCdEfGhIjK");
    expect(validDb.recorded[0]?.bindings[2]).toBe("profile_viewed");
  });

  it("explains the public data boundary and expiry", async () => {
    const { db } = database();
    const response = await app.request("/privacy", undefined, bindings(db));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("住所、電話番号");
    expect(html).toContain("365日間編集がない");
    expect(html).toContain("SHA-256ハッシュ");
  });

  it("exposes health and generic API not-found responses", async () => {
    const { db } = database();
    const health = await app.request("/healthz", undefined, bindings(db));
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ healthy: true, service: "yorishiru" });

    const missing = await app.request("/api/missing", undefined, bindings(db));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: "not_found" });
  });
});
