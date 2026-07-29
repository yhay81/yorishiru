(() => {
  const page = document.body.dataset.page;
  const storagePrefix = "yorishiru:";
  const automatedQa = (() => {
    const explicit =
      new URLSearchParams(window.location.search).get("qa") === "1" || navigator.webdriver === true;
    try {
      if (explicit) sessionStorage.setItem(`${storagePrefix}automated-qa`, "1");
      return explicit || sessionStorage.getItem(`${storagePrefix}automated-qa`) === "1";
    } catch {
      return explicit;
    }
  })();
  const profileIdPattern = /^[A-Za-z0-9_-]{10,12}$/;
  const sectionLabels = {
    about: "わたし",
    activity: "活動",
    likes: "好き",
    note: "メモ",
    trade: "確認",
  };
  const sectionMarks = { about: "○", activity: "↗", likes: "♡", note: "□", trade: "✓" };

  function sessionId() {
    const key = `${storagePrefix}session`;
    try {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const created = crypto.randomUUID();
      localStorage.setItem(key, created);
      return created;
    } catch {
      return crypto.randomUUID();
    }
  }

  function identifier() {
    return crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  }

  function telemetry(name, profileId = "") {
    fetch("/api/telemetry", {
      body: JSON.stringify({
        automated: automatedQa,
        name,
        profileId: profileIdPattern.test(profileId) ? profileId : "",
        sessionId: sessionId(),
      }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => {});
  }

  function trackVisit() {
    telemetry("visited");
    const today = new Date().toISOString().slice(0, 10);
    const key = `${storagePrefix}last-visit`;
    try {
      const previous = localStorage.getItem(key);
      if (previous && previous !== today) telemetry("returned");
      localStorage.setItem(key, today);
    } catch {
      // Usage remains available when storage is blocked.
    }
  }

  async function jsonRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "request_failed");
    return body;
  }

  function errorMessage(code) {
    return (
      {
        invalid_profile: "入力内容を確認してください。URLはhttps://から始めてください。",
        invalid_edit_token: "編集URLが違います。作成時の編集URLを開いてください。",
        rate_limited: "操作が続きました。1分ほど待ってからもう一度お試しください。",
        stale_revision: "別の画面で更新されています。ページを再読み込みしてください。",
      }[code] || "保存できませんでした。通信状態を確認してください。"
    );
  }

  function setError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
  }

  function formText(values, name) {
    const value = values.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const original = button?.textContent;
      if (button) {
        button.textContent = "コピー済み";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }
    } catch {
      window.prompt("コピーしてください", text);
    }
  }

  function downloadJson(filename, value) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function kindForTitle(title) {
    if (/取引|確認|連絡|必読|注意/.test(title)) return "trade";
    if (/好き|趣味|推し/.test(title)) return "likes";
    if (/活動|作品|仕事|制作/.test(title)) return "activity";
    if (/自己|わたし|紹介/.test(title)) return "about";
    return "note";
  }

  function parsePastedProfile(raw) {
    const sections = [];
    const links = [];
    let current = null;

    function finish() {
      if (!current) return;
      const body = current.lines.join("\n").trim();
      if (body) {
        sections.push({
          body,
          id: identifier(),
          kind: kindForTitle(current.title),
          title: current.title,
        });
      }
      current = null;
    }

    for (const untrimmed of raw.split(/\r?\n/)) {
      const line = untrimmed.trim();
      if (!line) {
        if (current?.lines.length && current.lines.at(-1) !== "") current.lines.push("");
        continue;
      }
      const heading = /^#{1,3}\s+(.+)$/.exec(line);
      if (heading) {
        finish();
        current = { lines: [], title: heading[1].slice(0, 40) };
        continue;
      }
      if (/^https:\/\//i.test(line)) {
        try {
          const url = new URL(line);
          links.push({
            id: identifier(),
            label: url.hostname.replace(/^www\./, ""),
            url: url.href,
          });
          continue;
        } catch {
          // Keep malformed text inside the current section.
        }
      }
      if (!current) current = { lines: [], title: "プロフィール" };
      current.lines.push(line);
    }
    finish();
    return { links: links.slice(0, 8), sections: sections.slice(0, 8) };
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function initHome() {
    const form = document.getElementById("create-profile-form");
    if (!form) return;
    const panel = document.querySelector(".builder-shell");
    const success = document.getElementById("create-success");
    const createError = document.getElementById("create-error");
    const themeButtons = [...document.querySelectorAll("[data-theme]")];
    let selectedTheme = "apricot";

    const fields = {
      bio: document.getElementById("profile-bio"),
      handle: document.getElementById("profile-handle"),
      headline: document.getElementById("profile-headline"),
      name: document.getElementById("display-name"),
      paste: document.getElementById("paste-profile"),
      symbol: document.getElementById("profile-symbol"),
    };

    function updatePreview() {
      document.getElementById("preview-name").textContent = fields.name.value || "表示名";
      document.getElementById("preview-symbol").textContent = fields.symbol.value || "◎";
      const handle = document.getElementById("preview-handle");
      handle.textContent = fields.handle.value;
      handle.hidden = !fields.handle.value;
      const headline = document.getElementById("preview-headline");
      headline.textContent = fields.headline.value;
      headline.hidden = !fields.headline.value;
      const bio = document.getElementById("preview-bio");
      bio.textContent = fields.bio.value;
      bio.hidden = !fields.bio.value;

      if (fields.paste.value.trim()) {
        const preview = document.getElementById("preview-sections");
        preview.replaceChildren();
        for (const section of parsePastedProfile(fields.paste.value).sections.slice(0, 3)) {
          const article = createElement("article");
          article.append(createElement("span", "", sectionMarks[section.kind]));
          const content = createElement("div");
          content.append(createElement("small", "", sectionLabels[section.kind]));
          content.append(createElement("strong", "", section.title));
          content.append(createElement("p", "", section.body));
          article.append(content);
          preview.append(article);
        }
      }
    }

    for (const input of Object.values(fields)) input.addEventListener("input", updatePreview);
    for (const button of themeButtons) {
      button.addEventListener("click", () => {
        selectedTheme = button.dataset.theme;
        themeButtons.forEach((candidate) =>
          candidate.setAttribute("aria-pressed", String(candidate === button)),
        );
        document.querySelector(".card-preview").dataset.theme = selectedTheme;
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setError(createError, "");
      const parsed = parsePastedProfile(fields.paste.value);
      const payload = {
        content: {
          bio: fields.bio.value.trim(),
          discoverable: document.getElementById("discoverable").checked,
          handle: fields.handle.value.trim(),
          headline: fields.headline.value.trim(),
          links: parsed.links,
          readMark: document.getElementById("read-mark").value.trim(),
          sections: parsed.sections,
          symbol: fields.symbol.value.trim() || "◎",
        },
        displayName: fields.name.value.trim(),
        sessionId: sessionId(),
        theme: selectedTheme,
        website: form.elements.website.value,
      };
      try {
        const result = await jsonRequest("/api/profiles", {
          body: JSON.stringify(payload),
          method: "POST",
        });
        const shareUrl = new URL(result.sharePath, window.location.origin).href;
        const editUrl = new URL(result.editPath, window.location.origin).href;
        document.getElementById("share-url").value = shareUrl;
        document.getElementById("edit-url").value = editUrl;
        document.getElementById("open-profile").href = editUrl;
        panel.hidden = true;
        success.hidden = false;
        telemetry("created", result.profileId);
        const sourceId = new URLSearchParams(window.location.search).get("from") || "";
        if (profileIdPattern.test(sourceId)) telemetry("viewer_created", sourceId);
        success.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (requestError) {
        setError(createError, errorMessage(requestError.message));
      }
    });

    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.copyTarget);
        void copyText(input.value, button);
      });
    });
  }

  function initProfile() {
    const root = document.querySelector(".profile-page");
    if (!root) return;
    const profileId = root.dataset.profileId;
    let profile = JSON.parse(decodeURIComponent(root.dataset.profile));
    let content = JSON.parse(decodeURIComponent(root.dataset.content));
    let selectedTheme = profile.theme;
    let saveQueue = Promise.resolve();
    const token = window.location.hash.slice(1);
    const editor = document.getElementById("editor-panel");
    const editError = document.getElementById("edit-error");
    const editHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    function attachOutboundTelemetry() {
      document.querySelectorAll("[data-outbound]").forEach((link) => {
        link.addEventListener("click", () => telemetry("link_opened", profileId), { once: true });
      });
    }

    function renderProfile() {
      root.dataset.theme = selectedTheme;
      document.getElementById("profile-symbol-label").textContent = content.symbol;
      document.getElementById("profile-name-label").textContent = profile.display_name;
      const handle = document.getElementById("profile-handle-label");
      if (handle) {
        handle.textContent = content.handle;
        handle.hidden = !content.handle;
      }
      const headline = document.getElementById("profile-headline-label");
      headline.textContent = content.headline;
      headline.hidden = !content.headline;
      const bio = document.getElementById("profile-bio-label");
      bio.textContent = content.bio;
      bio.hidden = !content.bio;

      const sectionContainer = document.getElementById("profile-sections");
      sectionContainer.replaceChildren();
      for (const section of content.sections) {
        const wrapper = createElement("div");
        wrapper.id = `section-${section.id}`;
        const block = createElement("section", "profile-section");
        block.dataset.kind = section.kind;
        const header = createElement("header");
        header.append(createElement("span", "", sectionMarks[section.kind]));
        const heading = createElement("div");
        heading.append(createElement("small", "", sectionLabels[section.kind]));
        heading.append(createElement("h2", "", section.title));
        header.append(heading);
        block.append(header, createElement("p", "", section.body));
        wrapper.append(block);
        sectionContainer.append(wrapper);
      }

      const index = document.getElementById("profile-index");
      index.replaceChildren(createElement("span", "", "INDEX"));
      const introLink = createElement("a", "", "01 はじめに");
      introLink.href = "#intro";
      index.append(introLink);
      content.sections.forEach((section, position) => {
        const link = createElement(
          "a",
          "",
          `${String(position + 2).padStart(2, "0")} ${section.title}`,
        );
        link.href = `#section-${section.id}`;
        index.append(link);
      });
      if (content.links.length) {
        const link = createElement("a", "", "LINKS 活動先");
        link.href = "#links";
        index.append(link);
      }

      const linksCard = document.getElementById("links");
      const links = document.getElementById("profile-links");
      links.replaceChildren();
      for (const item of content.links) {
        const link = createElement("a");
        link.href = item.url;
        link.rel = "noopener noreferrer";
        link.dataset.outbound = "";
        link.append(createElement("span", "", item.label), createElement("i", "", "→"));
        links.append(link);
      }
      linksCard.hidden = content.links.length === 0;
      attachOutboundTelemetry();

      const markCard = document.getElementById("read-mark-card");
      document.getElementById("profile-read-mark").textContent = content.readMark;
      markCard.hidden = !content.readMark;
    }

    function markSaving(state, message) {
      document.getElementById("save-state").textContent = message;
      document.getElementById("editor-save-state").textContent = message;
      document.getElementById("save-dot").dataset.state = state;
    }

    function persist() {
      saveQueue = saveQueue
        .catch(() => {})
        .then(async () => {
          setError(editError, "");
          markSaving("saving", "保存中…");
          try {
            const result = await jsonRequest(`/api/profiles/${profileId}`, {
              body: JSON.stringify({
                content,
                displayName: profile.display_name,
                revision: profile.revision,
                sessionId: sessionId(),
                theme: selectedTheme,
                website: "",
              }),
              headers: editHeaders,
              method: "PUT",
            });
            profile = result.profile;
            content = result.content;
            selectedTheme = profile.theme;
            markSaving("saved", "保存済み");
            renderProfile();
            renderEditors();
            telemetry("edited", profileId);
          } catch (requestError) {
            markSaving("error", "未保存");
            setError(editError, errorMessage(requestError.message));
            throw requestError;
          }
        });
      saveQueue.catch(() => {});
      return saveQueue;
    }

    function moveItem(list, index, direction) {
      const target = index + direction;
      if (target < 0 || target >= list.length) return;
      [list[index], list[target]] = [list[target], list[index]];
      void persist();
    }

    function editorActions(row, list, index) {
      const actions = createElement("div", "item-actions");
      const up = createElement("button", "", "↑");
      up.type = "button";
      up.ariaLabel = "上へ";
      up.disabled = index === 0;
      up.addEventListener("click", () => moveItem(list, index, -1));
      const down = createElement("button", "", "↓");
      down.type = "button";
      down.ariaLabel = "下へ";
      down.disabled = index === list.length - 1;
      down.addEventListener("click", () => moveItem(list, index, 1));
      const remove = createElement("button", "remove-button", "削除");
      remove.type = "button";
      remove.addEventListener("click", () => {
        list.splice(index, 1);
        void persist();
      });
      actions.append(up, down, remove);
      row.append(actions);
    }

    function sectionEditor(section, index) {
      const row = createElement("article", "editor-item");
      const kindLabel = createElement("label");
      kindLabel.append(createElement("span", "", "種類"));
      const kind = createElement("select");
      for (const [value, label] of Object.entries(sectionLabels)) {
        const option = createElement("option", "", label);
        option.value = value;
        option.selected = section.kind === value;
        kind.append(option);
      }
      kindLabel.append(kind);
      const titleLabel = createElement("label");
      titleLabel.append(createElement("span", "", "見出し"));
      const title = createElement("input");
      title.maxLength = 40;
      title.value = section.title;
      titleLabel.append(title);
      const bodyLabel = createElement("label", "wide");
      bodyLabel.append(createElement("span", "", "本文"));
      const body = createElement("textarea");
      body.maxLength = 800;
      body.rows = 4;
      body.value = section.body;
      bodyLabel.append(body);
      const save = createElement("button", "save-item", "この項目を保存");
      save.type = "button";
      save.addEventListener("click", () => {
        const cleanTitle = title.value.trim();
        const cleanBody = body.value.trim();
        if (!cleanTitle || !cleanBody) {
          setError(editError, "見出しと本文を入力してください。");
          return;
        }
        content.sections[index] = {
          ...section,
          body: cleanBody,
          kind: kind.value,
          title: cleanTitle,
        };
        void persist();
      });
      row.append(kindLabel, titleLabel, bodyLabel, save);
      editorActions(row, content.sections, index);
      return row;
    }

    function linkEditor(link, index, draft = false) {
      const row = createElement("article", "editor-item link-editor");
      const labelWrap = createElement("label");
      labelWrap.append(createElement("span", "", "名前"));
      const label = createElement("input");
      label.maxLength = 40;
      label.placeholder = "作品一覧";
      label.value = link?.label || "";
      labelWrap.append(label);
      const urlWrap = createElement("label", "wide");
      urlWrap.append(createElement("span", "", "URL"));
      const url = createElement("input");
      url.maxLength = 300;
      url.placeholder = "https://";
      url.type = "url";
      url.value = link?.url || "";
      urlWrap.append(url);
      const save = createElement(
        "button",
        "save-item",
        draft ? "リンクを追加" : "このリンクを保存",
      );
      save.type = "button";
      save.addEventListener("click", () => {
        const cleanLabel = label.value.trim();
        const cleanUrl = url.value.trim();
        try {
          const parsed = new URL(cleanUrl);
          if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error();
        } catch {
          setError(editError, "リンク名と https:// から始まるURLを入力してください。");
          return;
        }
        if (!cleanLabel) {
          setError(editError, "リンク名を入力してください。");
          return;
        }
        const item = { id: link?.id || identifier(), label: cleanLabel, url: cleanUrl };
        if (draft) content.links.push(item);
        else content.links[index] = item;
        void persist();
      });
      row.append(labelWrap, urlWrap, save);
      if (!draft) editorActions(row, content.links, index);
      return row;
    }

    function renderEditors() {
      const sectionList = document.getElementById("section-editor-list");
      sectionList.replaceChildren(...content.sections.map(sectionEditor));
      if (!content.sections.length) {
        sectionList.append(createElement("p", "empty-note", "本文カードはまだありません。"));
      }
      const linkList = document.getElementById("link-editor-list");
      linkList.replaceChildren(...content.links.map(linkEditor));
      if (!content.links.length) {
        linkList.append(createElement("p", "empty-note", "活動リンクはまだありません。"));
      }
    }

    async function authenticate() {
      if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return;
      try {
        const result = await jsonRequest(`/api/profiles/${profileId}/manage`, {
          headers: editHeaders,
        });
        profile = result.profile;
        content = result.content;
        editor.hidden = false;
        document.getElementById("save-state").textContent = "編集できます";
        document.getElementById("save-dot").dataset.state = "saved";
        renderEditors();
      } catch {
        setError(editError, "この編集URLでは編集できません。");
      }
    }

    document.getElementById("identity-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const displayName = formText(values, "displayName");
      const symbol = formText(values, "symbol");
      if (!displayName || !symbol) {
        setError(editError, "表示名としるしを入力してください。");
        return;
      }
      profile.display_name = displayName;
      content.symbol = symbol;
      content.handle = formText(values, "handle");
      content.headline = formText(values, "headline");
      content.bio = formText(values, "bio");
      content.readMark = formText(values, "readMark");
      content.discoverable = values.get("discoverable") === "on";
      void persist();
    });

    document.querySelectorAll("[data-edit-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedTheme = button.dataset.editTheme;
        document
          .querySelectorAll("[data-edit-theme]")
          .forEach((candidate) =>
            candidate.setAttribute("aria-pressed", String(candidate === button)),
          );
        root.dataset.theme = selectedTheme;
        void persist();
      });
    });

    document.querySelector("[data-add-section]").addEventListener("click", () => {
      if (content.sections.length >= 8) {
        setError(editError, "本文カードは8件までです。");
        return;
      }
      content.sections.push({
        body: "内容を入力",
        id: identifier(),
        kind: "note",
        title: "新しい項目",
      });
      void persist();
    });

    document.querySelector("[data-add-link]").addEventListener("click", () => {
      if (content.links.length >= 8) {
        setError(editError, "活動リンクは8件までです。");
        return;
      }
      const list = document.getElementById("link-editor-list");
      list.querySelector(".empty-note")?.remove();
      list.append(linkEditor(null, content.links.length, true));
    });

    document.getElementById("copy-profile-url").addEventListener("click", (event) => {
      void copyText(`${window.location.origin}/p/${profileId}`, event.currentTarget);
      telemetry("shared", profileId);
    });
    document.getElementById("copy-mark").addEventListener("click", (event) => {
      void copyText(content.readMark, event.currentTarget);
      telemetry("mark_copied", profileId);
    });
    document.getElementById("export-profile").addEventListener("click", () => {
      downloadJson(`yorishiru-${profileId}.json`, {
        exportedAt: new Date().toISOString(),
        profile: { ...profile, theme: selectedTheme },
        content,
      });
      telemetry("exported", profileId);
    });
    document.getElementById("delete-profile").addEventListener("click", async () => {
      if (!window.confirm("このカードを完全に削除します。元に戻せません。")) return;
      try {
        await jsonRequest(`/api/profiles/${profileId}`, {
          headers: editHeaders,
          method: "DELETE",
        });
        window.location.href = "/";
      } catch (requestError) {
        setError(editError, errorMessage(requestError.message));
      }
    });

    attachOutboundTelemetry();
    telemetry("profile_viewed", profileId);
    void authenticate();
  }

  trackVisit();
  if (page === "home") initHome();
  if (page === "profile") initProfile();
})();
