const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const filterJumpLinks = [...document.querySelectorAll("[data-filter-jump]")];
const resourceCards = [...document.querySelectorAll(".resource-card")];
const searchInput = document.querySelector("[data-search]");
const emptyState = document.querySelector("[data-empty-state]");
const copyButton = document.querySelector("[data-copy-pix]");
const pixKey = document.querySelector("[data-pix-key]");
const copyStatus = document.querySelector("[data-copy-status]");
const articleGrid = document.querySelector("[data-article-grid]");
const articleFilters = document.querySelector("[data-article-filters]");
const articleSearch = document.querySelector("[data-article-search]");
const articleEmpty = document.querySelector("[data-article-empty]");
const articleReader = document.querySelector("[data-article-reader]");
const articleReaderContent = document.querySelector("[data-article-reader-content]");
const backArticlesButton = document.querySelector("[data-back-articles]");
const siteSections = [...document.querySelectorAll("main > section:not([data-article-reader])")];

let activeFilter = "Todos";
let activeArticleFilter = "Todos";
const defaultDocumentTitle = document.title;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value || "";
  return element.innerHTML;
}

function applyFilters() {
  const query = normalizeText(searchInput?.value || "");
  let visibleCount = 0;

  resourceCards.forEach((card) => {
    const category = card.dataset.category || "";
    const searchable = normalizeText(
      `${card.dataset.title || ""} ${card.dataset.keywords || ""} ${category}`
    );
    const matchesCategory = activeFilter === "Todos" || category === activeFilter;
    const matchesSearch = !query || searchable.includes(query);
    const shouldShow = matchesCategory && matchesSearch;

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount > 0;
  }
}

function setFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });
  applyFilters();
}

function articleSearchText(article) {
  return normalizeText(
    [
      article.title,
      article.theme,
      article.category,
      article.summary,
      article.subtitle,
      article.seoDescription,
      ...(article.body || []),
      ...(article.verses || []),
      ...((article.content || []).flatMap((block) => [block.text, ...(block.items || [])])),
      ...((article.sources || []).map((source) => `${source.label} ${source.text}`)),
    ].join(" ")
  );
}

function applyArticleFilters() {
  const query = normalizeText(articleSearch?.value || "");
  const articles = window.verbumArticles || [];
  const cards = [...document.querySelectorAll("[data-article-card]")];
  let visibleCount = 0;

  cards.forEach((card) => {
    const article = articles.find((item) => item.id === card.dataset.articleId);
    const matchesTheme =
      activeArticleFilter === "Todos" || card.dataset.theme === activeArticleFilter;
    const matchesSearch = !query || (article && articleSearchText(article).includes(query));
    const shouldShow = matchesTheme && matchesSearch;

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  if (articleEmpty) {
    articleEmpty.hidden = visibleCount > 0;
  }
}

function setArticleFilter(filter) {
  activeArticleFilter = filter;
  document.querySelectorAll("[data-article-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.articleFilter === filter);
  });
  applyArticleFilters();
}

function renderArticleContent(article) {
  if (article.content?.length) {
    return article.content
      .map((block) => {
        if (block.type === "heading") {
          return `<h2>${escapeHtml(block.text)}</h2>`;
        }

        if (block.type === "list") {
          return `<ul>${(block.items || [])
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`;
        }

        return `<p>${escapeHtml(block.text)}</p>`;
      })
      .join("");
  }

  return (article.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderArticleVerses(article) {
  if (!article.verses?.length) return "";

  return `
    <div class="verse-box">
      <h2>Versículos para meditar</h2>
      <ul>
        ${article.verses.map((verse) => `<li>${escapeHtml(verse)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderArticleSources(article) {
  if (!article.sources?.length) return "";

  return `
    <section class="article-sources" aria-labelledby="article-sources-title">
      <h2 id="article-sources-title">Fontes oficiais correspondentes às notas</h2>
      <ol>
        ${article.sources
          .map(
            (source) =>
              `<li value="${escapeHtml(source.value || source.label)}"><strong>[${escapeHtml(
                source.label
              )}]</strong> ${escapeHtml(source.text)}</li>`
          )
          .join("")}
      </ol>
    </section>
  `;
}

function showSiteSections() {
  siteSections.forEach((section) => {
    section.hidden = false;
  });

  if (articleReader) {
    articleReader.hidden = true;
  }
}

function closeArticleView(updateHash = true) {
  showSiteSections();
  document.title = defaultDocumentTitle;

  if (updateHash && window.location.hash.startsWith("#artigo/")) {
    history.pushState(null, "", "#artigos");
  }
}

function openArticle(articleId, updateHash = true) {
  const article = (window.verbumArticles || []).find((item) => item.id === articleId);
  if (!article || !articleReader || !articleReaderContent) return;

  siteSections.forEach((section) => {
    section.hidden = true;
  });

  articleReader.hidden = false;
  articleReaderContent.innerHTML = `
    <p class="eyebrow">${escapeHtml(article.theme)} • ${escapeHtml(article.category || "Artigo")}</p>
    <h1 id="article-reader-title">${escapeHtml(article.title)}</h1>
    ${article.subtitle ? `<p class="reader-subtitle">${escapeHtml(article.subtitle)}</p>` : ""}
    <div class="reader-meta">
      ${article.updated ? `<span>${escapeHtml(article.updated)}</span>` : ""}
      ${article.readTime ? `<span>${escapeHtml(article.readTime)}</span>` : ""}
      <span>Biblioteca Verbum</span>
    </div>
    ${article.summary ? `<p class="reader-summary">${escapeHtml(article.summary)}</p>` : ""}
    ${
      article.image
        ? `
      <figure class="reader-figure">
        <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" loading="lazy">
        ${article.caption ? `<figcaption>${escapeHtml(article.caption)}</figcaption>` : ""}
      </figure>
    `
        : ""
    }
    <div class="article-full-body">
      ${renderArticleContent(article)}
    </div>
    ${renderArticleVerses(article)}
    ${renderArticleSources(article)}
  `;

  document.title = `${article.title} | Biblioteca Verbum`;

  if (updateHash) {
    history.pushState(null, "", `#artigo/${encodeURIComponent(article.id)}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleArticleRoute() {
  const match = window.location.hash.match(/^#artigo\/(.+)$/);

  if (match) {
    openArticle(decodeURIComponent(match[1]), false);
  } else if (articleReader && !articleReader.hidden) {
    closeArticleView(false);
  }
}

function renderArticles() {
  const articles = window.verbumArticles || [];
  if (!articleGrid || !articleFilters || !articles.length) return;

  const themes = ["Todos", ...new Set(articles.map((article) => article.theme))];
  articleFilters.innerHTML = themes
    .map(
      (theme) =>
        `<button class="article-tab${theme === "Todos" ? " is-active" : ""}" type="button" data-article-filter="${escapeHtml(theme)}">${escapeHtml(theme)}</button>`
    )
    .join("");

  articleGrid.innerHTML = articles
    .map(
      (article) => `
        <article class="article-card reveal" data-article-card data-article-id="${escapeHtml(article.id)}" data-theme="${escapeHtml(article.theme)}">
          <div class="article-media">
            <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" loading="lazy">
            <span class="article-number">${article.number}</span>
          </div>
          <div class="article-body">
            <p class="article-theme">${escapeHtml(article.theme)}</p>
            <h3>${escapeHtml(article.title)}</h3>
            <p>${escapeHtml(article.summary)}</p>
            <button class="article-open" type="button" data-open-article="${escapeHtml(article.id)}">Ler artigo</button>
          </div>
        </article>
      `
    )
    .join("");

  articleFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-article-filter]");
    if (button) setArticleFilter(button.dataset.articleFilter);
  });

  articleGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-article]");
    if (button) openArticle(button.dataset.openArticle);
  });

  articleSearch?.addEventListener("input", applyArticleFilters);
  applyArticleFilters();
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  navToggle.classList.toggle("is-open", !isOpen);
  nav?.classList.toggle("is-open", !isOpen);
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => {
    if (!link.getAttribute("href")?.startsWith("#artigo/")) {
      closeArticleView(false);
    }

    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Abrir menu");
    navToggle?.classList.remove("is-open");
    nav?.classList.remove("is-open");
  });
});

backArticlesButton?.addEventListener("click", () => {
  closeArticleView();
  document.querySelector("#artigos")?.scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("hashchange", handleArticleRoute);
window.addEventListener("popstate", handleArticleRoute);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

filterJumpLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    setFilter(link.dataset.filterJump);
  });
});

searchInput?.addEventListener("input", applyFilters);

copyButton?.addEventListener("click", async () => {
  const value = pixKey?.value || "";

  try {
    await navigator.clipboard.writeText(value);
    copyStatus.textContent = "Chave Pix copiada.";
  } catch {
    pixKey?.select();
    document.execCommand("copy");
    copyStatus.textContent = "Chave Pix copiada.";
  }

  window.setTimeout(() => {
    copyStatus.textContent = "";
  }, 2600);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

renderArticles();
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
handleArticleRoute();
applyFilters();
