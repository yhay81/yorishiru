import type { ProfileBundle, ProfileSection, SectionKind } from "../domain";
import { product } from "../config/product";
import { Layout } from "./layout";

const sectionLabels: Record<SectionKind, string> = {
  about: "わたし",
  activity: "活動",
  likes: "好き",
  note: "メモ",
  trade: "確認",
};

const sectionMarks: Record<SectionKind, string> = {
  about: "○",
  activity: "↗",
  likes: "♡",
  note: "□",
  trade: "✓",
};

function encoded(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

function updatedLabel(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("ja-JP", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SectionBlock({ section }: { section: ProfileSection }) {
  return (
    <section class="profile-section" data-kind={section.kind}>
      <header>
        <span aria-hidden="true">{sectionMarks[section.kind]}</span>
        <div>
          <small>{sectionLabels[section.kind]}</small>
          <h2>{section.title}</h2>
        </div>
      </header>
      <p>{section.body}</p>
    </section>
  );
}

export function HomePage() {
  return (
    <Layout>
      <section class="builder-shell">
        <form class="builder-panel" id="create-profile-form">
          <header class="panel-heading">
            <div>
              <span>NEW CARD</span>
              <h1>プロフィールカード</h1>
            </div>
            <span class="privacy-chip">登録なし</span>
          </header>

          <div class="identity-fields">
            <label class="symbol-field">
              <span>しるし</span>
              <input autocomplete="off" id="profile-symbol" maxlength={8} name="symbol" value="◎" />
            </label>
            <label class="field">
              <span>表示名</span>
              <input
                autocomplete="name"
                id="display-name"
                maxlength={40}
                name="displayName"
                required
                value="ゆう"
              />
            </label>
          </div>

          <label class="field">
            <span>
              アカウント名 <small>任意</small>
            </span>
            <input
              autocomplete="off"
              id="profile-handle"
              maxlength={40}
              name="handle"
              placeholder="@name"
              value="@yu_sora"
            />
          </label>
          <label class="field">
            <span>ひとこと</span>
            <input
              autocomplete="off"
              id="profile-headline"
              maxlength={80}
              name="headline"
              value="絵と旅と、青いものが好きです"
            />
          </label>
          <label class="field">
            <span>紹介文</span>
            <textarea id="profile-bio" maxlength={600} name="bio" rows={3}>
              創作の記録と日々の写真を投稿しています。ゆっくり返信します。
            </textarea>
          </label>

          <label class="field">
            <span>
              見出しつき本文を貼る <small>任意</small>
            </span>
            <textarea
              id="paste-profile"
              maxlength={5000}
              name="pasteProfile"
              placeholder={
                "# 好きなもの\n美術館、喫茶店、短編小説\n\n# 連絡前に\n返信は夜になることが多いです"
              }
              rows={5}
            ></textarea>
            <small>「# 見出し」で区切るとカードに分かれます。URLはリンクになります。</small>
          </label>

          <fieldset class="theme-field">
            <legend>カードの色</legend>
            <div class="theme-choices">
              <button aria-label="あんず" aria-pressed="true" data-theme="apricot" type="button">
                <i></i>
              </button>
              <button aria-label="湖" aria-pressed="false" data-theme="lake" type="button">
                <i></i>
              </button>
              <button aria-label="葉" aria-pressed="false" data-theme="leaf" type="button">
                <i></i>
              </button>
              <button aria-label="ライラック" aria-pressed="false" data-theme="lilac" type="button">
                <i></i>
              </button>
            </div>
          </fieldset>

          <label class="field read-mark-field">
            <span>
              読んだ印 <small>任意</small>
            </span>
            <input
              autocomplete="off"
              id="read-mark"
              maxlength={20}
              name="readMark"
              placeholder="文末に 🍋 を添えてください"
            />
          </label>
          <label class="check-row">
            <input id="discoverable" name="discoverable" type="checkbox" />
            <span>
              検索エンジンへの表示を許可する
              <small>初期設定では検索に出ません</small>
            </span>
          </label>

          <input autocomplete="off" class="honey" name="website" tabindex={-1} />
          <p class="form-error" hidden id="create-error" role="alert"></p>
          <button class="primary-button" type="submit">
            <span>カードを作る</span>
            <i aria-hidden="true">→</i>
          </button>
          <p class="form-note">
            氏名、住所、電話番号、決済情報など公開したくない情報は書かないでください。
          </p>
        </form>

        <section class="card-preview" data-theme="apricot" aria-label="公開カードの見本">
          <div class="preview-paper">
            <header class="preview-identity">
              <span class="profile-symbol" id="preview-symbol">
                ◎
              </span>
              <div>
                <small>PROFILE NOTE</small>
                <h2 id="preview-name">ゆう</h2>
                <p id="preview-handle">@yu_sora</p>
              </div>
              <span class="availability-dot">公開前</span>
            </header>
            <div class="preview-intro">
              <strong id="preview-headline">絵と旅と、青いものが好きです</strong>
              <p id="preview-bio">創作の記録と日々の写真を投稿しています。ゆっくり返信します。</p>
            </div>
            <div class="preview-sections" id="preview-sections">
              <article>
                <span>♡</span>
                <div>
                  <small>好き</small>
                  <strong>よく話すこと</strong>
                  <p>美術館、喫茶店、短編小説</p>
                </div>
              </article>
              <article>
                <span>✓</span>
                <div>
                  <small>確認</small>
                  <strong>連絡前に</strong>
                  <p>返信は夜になることが多いです</p>
                </div>
              </article>
            </div>
            <footer class="preview-footer">
              <span>ABOUT</span>
              <span>LINKS</span>
              <span>SHARE</span>
            </footer>
          </div>
        </section>
      </section>

      <section class="create-success" hidden id="create-success">
        <span class="success-mark" aria-hidden="true">
          ✓
        </span>
        <div>
          <p class="section-kicker">READY</p>
          <h1>公開カードを作りました</h1>
          <p>閲覧URLと編集URLは別です。編集URLは自分だけで保管してください。</p>
        </div>
        <div class="url-stack">
          <label>
            <span>見せるURL</span>
            <div>
              <input id="share-url" readonly />
              <button data-copy-target="share-url" type="button">
                コピー
              </button>
            </div>
          </label>
          <label>
            <span>編集するURL</span>
            <div>
              <input id="edit-url" readonly />
              <button data-copy-target="edit-url" type="button">
                コピー
              </button>
            </div>
          </label>
          <a class="primary-button" href="/" id="open-profile">
            カードを開く <i>→</i>
          </a>
        </div>
      </section>
    </Layout>
  );
}

export function ProfilePage({ bundle }: { bundle: ProfileBundle }) {
  const { content, profile } = bundle;
  const description = content.headline || content.bio || `${profile.display_name}のプロフィール`;
  return (
    <Layout
      canonicalPath={`/p/${profile.id}`}
      description={description}
      noIndex={!content.discoverable}
      page="profile"
      title={`${profile.display_name} | ${product.name}`}
    >
      <article
        class="profile-page"
        data-content={encoded(content)}
        data-profile={encoded(profile)}
        data-profile-id={profile.id}
        data-theme={profile.theme}
      >
        <header class="profile-header">
          <span class="profile-symbol" id="profile-symbol-label">
            {content.symbol}
          </span>
          <div class="profile-identity">
            <span class="card-kicker">PROFILE NOTE</span>
            <h1 id="profile-name-label">{profile.display_name}</h1>
            <p hidden={!content.handle} id="profile-handle-label">
              {content.handle}
            </p>
          </div>
          <div class="profile-state">
            <span id="save-dot"></span>
            <strong id="save-state">閲覧モード</strong>
            <small>更新 {updatedLabel(profile.updated_at)}</small>
          </div>
        </header>

        <div class="profile-layout">
          <aside class="profile-index" id="profile-index">
            <span>INDEX</span>
            <a href="#intro">01 はじめに</a>
            {content.sections.map((section, index) => (
              <a href={`#section-${section.id}`}>
                {String(index + 2).padStart(2, "0")} {section.title}
              </a>
            ))}
            {content.links.length ? <a href="#links">LINKS 活動先</a> : null}
          </aside>

          <div class="profile-main">
            <section class="profile-intro" id="intro">
              <strong hidden={!content.headline} id="profile-headline-label">
                {content.headline}
              </strong>
              <p hidden={!content.bio} id="profile-bio-label">
                {content.bio}
              </p>
            </section>
            <div class="profile-sections" id="profile-sections">
              {content.sections.map((section) => (
                <div id={`section-${section.id}`}>
                  <SectionBlock section={section} />
                </div>
              ))}
            </div>
          </div>

          <aside class="profile-rail">
            <section class="link-card" hidden={!content.links.length} id="links">
              <header>
                <span aria-hidden="true">↗</span>
                <h2>活動先</h2>
              </header>
              <div id="profile-links">
                {content.links.map((link) => (
                  <a data-outbound href={link.url} rel="noopener noreferrer">
                    <span>{link.label}</span>
                    <i aria-hidden="true">→</i>
                  </a>
                ))}
              </div>
            </section>
            <section class="read-mark-card" hidden={!content.readMark} id="read-mark-card">
              <small>READ MARK</small>
              <p id="profile-read-mark">{content.readMark}</p>
              <button id="copy-mark" type="button">
                読んだ印をコピー
              </button>
            </section>
            <section class="share-card">
              <button id="copy-profile-url" type="button">
                カードURLをコピー
              </button>
              <button id="export-profile" type="button">
                JSONで保存
              </button>
              <a href={`/?from=${profile.id}`}>自分のカードを作る</a>
            </section>
          </aside>
        </div>

        <section class="editor-panel editor-only" hidden id="editor-panel">
          <header class="editor-heading">
            <div>
              <span>EDIT CARD</span>
              <h2>カードを編集</h2>
            </div>
            <strong id="editor-save-state">保存済み</strong>
          </header>

          <form id="identity-form">
            <div class="editor-grid identity-editor">
              <label>
                <span>表示名</span>
                <input maxlength={40} name="displayName" required value={profile.display_name} />
              </label>
              <label>
                <span>しるし</span>
                <input maxlength={8} name="symbol" required value={content.symbol} />
              </label>
              <label>
                <span>アカウント名</span>
                <input maxlength={40} name="handle" value={content.handle} />
              </label>
              <label class="wide">
                <span>ひとこと</span>
                <input maxlength={80} name="headline" value={content.headline} />
              </label>
              <label class="wide">
                <span>紹介文</span>
                <textarea maxlength={600} name="bio" rows={3}>
                  {content.bio}
                </textarea>
              </label>
              <label class="wide">
                <span>読んだ印</span>
                <input maxlength={20} name="readMark" value={content.readMark} />
              </label>
              <label class="check-row wide">
                <input checked={content.discoverable} name="discoverable" type="checkbox" />
                <span>検索エンジンへの表示を許可する</span>
              </label>
            </div>
            <fieldset class="theme-field compact">
              <legend>カードの色</legend>
              <div class="theme-choices">
                {(["apricot", "lake", "leaf", "lilac"] as const).map((theme) => (
                  <button
                    aria-label={theme}
                    aria-pressed={profile.theme === theme}
                    data-edit-theme={theme}
                    type="button"
                  >
                    <i></i>
                  </button>
                ))}
              </div>
            </fieldset>
            <button class="secondary-button" type="submit">
              基本情報を保存
            </button>
          </form>

          <div class="editor-columns">
            <section>
              <header>
                <div>
                  <small>SECTIONS</small>
                  <h3>本文カード</h3>
                </div>
                <button data-add-section type="button">
                  ＋ 追加
                </button>
              </header>
              <div class="editor-list" id="section-editor-list"></div>
            </section>
            <section>
              <header>
                <div>
                  <small>LINKS</small>
                  <h3>活動リンク</h3>
                </div>
                <button data-add-link type="button">
                  ＋ 追加
                </button>
              </header>
              <div class="editor-list" id="link-editor-list"></div>
            </section>
          </div>
          <p class="form-error" hidden id="edit-error" role="alert"></p>
          <div class="danger-row">
            <span>365日間編集がないカードは自動削除します。</span>
            <button id="delete-profile" type="button">
              カードを削除
            </button>
          </div>
        </section>
      </article>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout canonicalPath="/privacy" page="privacy" title={`プライバシー | ${product.name}`}>
      <article class="text-page">
        <p class="section-kicker">PRIVACY</p>
        <h1>公開する内容を、自分で選ぶ</h1>
        <section>
          <h2>保存するもの</h2>
          <p>
            表示名、しるし、紹介文、本文カード、外部リンク、色、検索表示の設定をCloudflare
            D1へ保存します。編集URLの秘密鍵は保存せず、SHA-256ハッシュだけを保持します。
          </p>
        </section>
        <section>
          <h2>書かないでほしいもの</h2>
          <p>
            本名、住所、電話番号、メールアドレス、口座・決済情報、本人確認書類、秘密の合言葉など、
            公開したくない情報は入力しないでください。画像アップロードや位置情報は扱いません。
          </p>
        </section>
        <section>
          <h2>公開範囲と削除</h2>
          <p>
            URLを知る人はカードを閲覧できます。検索表示は初期設定で無効です。編集URLからいつでも完全削除できます。
            365日間編集がないカードは自動削除します。
          </p>
        </section>
        <section>
          <h2>利用状況</h2>
          <p>
            匿名セッション単位の訪問、作成、編集、共有、リンク利用、出力、再訪を35日間集計します。
            入力本文、URL、検索語、IPアドレスは計測イベントへ保存しません。自動QAは集計から除外します。
          </p>
        </section>
      </article>
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <Layout noIndex page="not-found" title={`見つかりません | ${product.name}`}>
      <section class="empty-page">
        <span aria-hidden="true">?</span>
        <h1>カードが見つかりません</h1>
        <p>URLが違うか、作成者が削除した、または保存期限を過ぎた可能性があります。</p>
        <a class="primary-button" href="/">
          新しいカードを作る
        </a>
      </section>
    </Layout>
  );
}
