/**************************************************************
 * main.js
 * - MES-AI-A 詳細ビュー
 **************************************************************/

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const FX_RATE = 155;
const APP_VERSION = "v2025.02.22";

const fmtJPY = (n) => "￥" + Number(n || 0).toLocaleString("ja-JP");
const fmtUSD = (n) => "＄" + Number(n || 0).toFixed(2);
const num = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const fmtKg = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(x) || x === 0) return "－";
  return x.toFixed(2) + "kg";
};

/* =========================
   指標（候補）
========================= */
const METRICS_ALL = [
  { id: "過去3月FBA最安値", label: "過去3ヶ月FBA最安値", sourceKey: "過去3月FBA最安値" },
  { id: "FBA最安値", label: "FBA最安値", sourceKey: "FBA最安値" },

  { id: "粗利益率予測", label: "粗利益率予測", sourceKey: "粗利益率予測" },
  { id: "粗利益予測", label: "粗利益予測（1個）", sourceKey: "粗利益予測" },

  { id: "粗利益", label: "粗利益", sourceKey: "粗利益" },
  { id: "粗利益率", label: "粗利益率", sourceKey: "粗利益率" },

  { id: "販売額（ドル）", label: "販売額（USD）", sourceKey: "販売額（ドル）" },
  { id: "入金額（円）", label: "入金額（円）", sourceKey: "入金額（円）" },
  { id: "入金額計（円）", label: "入金額計（円）", sourceKey: "入金額計（円）" },

  { id: "30日販売数", label: "30日販売数（実績）", sourceKey: "30日販売数" },
  { id: "60日販売数", label: "60日販売数（実績）", sourceKey: "60日販売数" },
  { id: "90日販売数", label: "90日販売数（実績）", sourceKey: "90日販売数" },
  { id: "180日販売数", label: "180日販売数（実績）", sourceKey: "180日販売数" },
  { id: "予測30日販売数", label: "予測30日販売数", sourceKey: "予測30日販売数" },
  { id: "予測60日販売数", label: "予測60日販売数", sourceKey: "予測60日販売数" },
  { id: "予測90日販売数", label: "予測90日販売数", sourceKey: "予測90日販売数" },
  { id: "推奨仕入数(30日)", label: "推奨仕入数(30日)", sourceKey: "予測30日販売数" },
  { id: "推奨仕入数(60日)", label: "推奨仕入数(60日)", sourceKey: "予測60日販売数" },
  { id: "推奨仕入数(90日)", label: "推奨仕入数(90日)", sourceKey: "予測90日販売数" },

  { id: "複数在庫指数45日分", label: "複数在庫指数45日分", sourceKey: "複数在庫指数45日分" },
  { id: "複数在庫指数60日分", label: "複数在庫指数60日分", sourceKey: "複数在庫指数60日分" },

  { id: "ライバル偏差1", label: "ライバル偏差1", sourceKey: "ライバル偏差1" },
  { id: "ライバル偏差2", label: "ライバル偏差2", sourceKey: "ライバル偏差2" },
  { id: "ライバル増加率", label: "ライバル増加率", sourceKey: "ライバル増加率" },

  { id: "サイズ感", label: "サイズ感", sourceKey: "サイズ感" },
  { id: "セラー数", label: "セラー数", sourceKey: "セラー数" },
  { id: "在庫数", label: "在庫数", sourceKey: "在庫数" },
  { id: "返品率", label: "返品率", sourceKey: "返品率" },

  { id: "仕入れ目安単価", label: "仕入れ目安単価", sourceKey: "仕入れ目安単価" },
  { id: "送料", label: "送料", sourceKey: "送料" },
  { id: "関税", label: "関税", sourceKey: "関税" }
];
const METRIC_BY_ID = Object.fromEntries(METRICS_ALL.map((m) => [m.id, m]));

/* =========================
   商品情報（項目）候補
========================= */
const INFO_FIELDS_ALL = [
  { id: "評価", label: "評価", kind: "text", sourceKey: "レビュー評価" },
  { id: "注意事項", label: "注意事項", kind: "computedTags" },
  { id: "商品名", label: "商品名", kind: "computedTitle" },
  { id: "ブランド", label: "ブランド", kind: "text", sourceKey: "ブランド" },
  { id: "カテゴリ", label: "カテゴリ", kind: "computed" },
  { id: "日本ASIN", label: "日本ASIN", kind: "computedHtml" },
  { id: "米ASIN", label: "米ASIN", kind: "computedHtml" },
  { id: "JAN", label: "JAN", kind: "computedHtml", sourceKey: "JAN" },
  { id: "SKU", label: "SKU", kind: "text", sourceKey: "SKU" },
  { id: "サイズ", label: "サイズ", kind: "computed" },
  { id: "重量（容積重量）", label: "重量(容積)", kind: "computed" },
  { id: "材質", label: "材質", kind: "text", sourceKey: "材質" }
];
const INFO_BY_ID = Object.fromEntries(INFO_FIELDS_ALL.map((f) => [f.id, f]));

/* =========================
   token
========================= */
const tokM = (id) => `M:${id}`;
const tokI = (id) => `I:${id}`;

function parseToken(token) {
  const [t, ...rest] = String(token).split(":");
  const id = rest.join(":");
  return { type: t, id };
}
function labelOf(token) {
  const { type, id } = parseToken(token);
  if (type === "M") return METRIC_BY_ID[id]?.label || id;
  if (type === "I") return INFO_BY_ID[id]?.label || id;
  return id;
}

/* =========================
   初期配置
========================= */
const DEFAULT_ZONES = {
  pool: [
    tokM("ライバル偏差1"),
    tokM("ライバル偏差2"),
    tokM("90日販売数"),
    tokM("180日販売数")
  ],
  info: [
    tokI("評価"),
    tokI("注意事項"),
    tokI("商品名"),
    tokI("ブランド"),
    tokI("カテゴリ"),
    tokI("日本ASIN"),
    tokI("米ASIN"),
    tokI("JAN"),
    tokI("サイズ"),
    tokI("重量（容積重量）"),
    tokI("材質")
  ],
  center: [
    tokM("推奨仕入数(30日)"),
    tokM("推奨仕入数(60日)"),
    tokM("推奨仕入数(90日)"),
    tokM("セラー数"),
    tokM("サイズ感"),
    tokM("在庫数"),
    tokM("返品率"),
    tokM("予測90日販売数"),
    tokM("予測60日販売数"),
    tokM("予測30日販売数"),
    tokM("90日販売数"),
    tokM("60日販売数"),
    tokM("30日販売数")
  ],
  table: [],
  hidden: [
    tokI("SKU"),
    tokM("販売額（ドル）"),
    tokM("粗利益"),
    tokM("粗利益率"),
    tokM("複数在庫指数45日分"),
    tokM("複数在庫指数60日分"),
    tokM("ライバル増加率"),
    tokM("粗利益予測"),
    tokM("粗利益率予測")
  ]
};

function normalizeDefaultZones() {
  const used = new Set([...DEFAULT_ZONES.info, ...DEFAULT_ZONES.center, ...DEFAULT_ZONES.table, ...DEFAULT_ZONES.hidden]);
  DEFAULT_ZONES.pool = DEFAULT_ZONES.pool.filter((t) => !used.has(t));
}
normalizeDefaultZones();

const zoneState = {
  pool: [...DEFAULT_ZONES.pool],
  info: [...DEFAULT_ZONES.info],
  center: [...DEFAULT_ZONES.center],
  table: [...DEFAULT_ZONES.table],
  hidden: [...DEFAULT_ZONES.hidden]
};

const cardState = new Map();
const cart = new Map();

/* ===== DOM refs ===== */
const metricsBar = $("#metricsBar");

const zonePool = $("#metricsPoolZone");
const zoneInfo = $("#metricsInfoZone");
const zoneCenter = $("#metricsCenterZone");
const zoneTable = $("#metricsTableZone");
const zoneHidden = $("#metricsHiddenZone");

/* buttons */
const metricsCollapseBtn = $("#metricsCollapseBtn");
const resetBtn = $("#resetCurrentBtn");
const clearCardsBtn = $("#clearCardsBtn");
const clearCartBtn = $("#clearCartBtn");

/* catalog */
const searchKeyword = $("#searchKeyword");
const searchExcludeKeyword = $("#searchExcludeKeyword");
const searchCategoryFilters = $("#searchCategoryFilters");
const searchMaterialFilters = $("#searchMaterialFilters");
const searchProfitRateMin = $("#searchProfitRateMin");
const searchProfitMin = $("#searchProfitMin");
const searchSellMin = $("#searchSellMin");
const searchSellMax = $("#searchSellMax");
const searchFbaMax = $("#searchFbaMax");
const searchCostMin = $("#searchCostMin");
const searchCostMax = $("#searchCostMax");
const searchSalesMin = $("#searchSalesMin");
const searchSales60Min = $("#searchSales60Min");
const searchSales90Min = $("#searchSales90Min");
const searchForecast30Min = $("#searchForecast30Min");
const searchSellerMax = $("#searchSellerMax");
const searchReviewMin = $("#searchReviewMin");
const searchSizeMin = $("#searchSizeMin");
const searchSizeMax = $("#searchSizeMax");
const searchStockMax = $("#searchStockMax");
const searchReturnMax = $("#searchReturnMax");
const searchDetailBtn = $("#searchDetailBtn");
const searchAdvanced = $("#searchAdvanced");
const searchApplyBtn = $("#searchApplyBtn");
const searchResetBtn = $("#searchResetBtn");
const searchResultCount = $("#searchResultCount");
const itemsContainer = $("#itemsContainer");
const emptyState = $("#emptyState");
const headerStatus = $("#headerStatus");
const appVersion = $("#appVersion");

/* cart */
const cartTotalPayment = $("#cartTotalPayment");
const cartTotalSales = $("#cartTotalSales");
const cartTotalCost = $("#cartTotalCost");
const cartTotalProfit = $("#cartTotalProfit");
const cartProfitRate = $("#cartProfitRate");
const cartItemCount = $("#cartItemCount");

/* sort */
const sortBar = $("#sortBar");
const sortControls = $("#sortControls");
const addSortRuleBtn = $("#addSortRuleBtn");
const applySortBtn = $("#applySortBtn");
const clearSortBtn = $("#clearSortBtn");
let sortRules = [];

/* =========================
   init
========================= */
init();

function init() {
  initPoolUI();
  initCatalog();
  initSortUI();
  initActions();
  updateCartSummary();
  updateHeaderStatus();
  if (appVersion) appVersion.textContent = `Version ${APP_VERSION}`;
  renderTopZones();
}

function initPoolUI() {
  if (!zonePool || !zoneInfo || !zoneCenter || !zoneTable || !zoneHidden) return;
  attachZoneDnD(zonePool, { zoneKey: "pool" });
  attachZoneDnD(zoneInfo, { zoneKey: "info" });
  attachZoneDnD(zoneCenter, { zoneKey: "center" });
  attachZoneDnD(zoneTable, { zoneKey: "table" });
  attachZoneDnD(zoneHidden, { zoneKey: "hidden" });
}

function initActions() {
  metricsCollapseBtn?.addEventListener("click", () => {
    metricsBar.classList.toggle("collapsed");
    metricsCollapseBtn.textContent = metricsBar.classList.contains("collapsed") ? "展開する" : "折りたたむ";
  });

  resetBtn?.addEventListener("click", () => {
    zoneState.pool = [...DEFAULT_ZONES.pool];
    zoneState.info = [...DEFAULT_ZONES.info];
    zoneState.center = [...DEFAULT_ZONES.center];
    zoneState.table = [...DEFAULT_ZONES.table];
    zoneState.hidden = [...DEFAULT_ZONES.hidden];

    sortRules = [];
    renderSortControls();
    renderTopZones();
    rerenderAllCards();
  });

  clearCardsBtn?.addEventListener("click", () => {
    cardState.forEach((v) => {
      if (v.chart) v.chart.destroy();
      v.el.remove();
    });
    cardState.clear();
    itemsContainer.innerHTML = "";
    emptyState.style.display = "block";
    updateHeaderStatus();
  });

  clearCartBtn?.addEventListener("click", () => {
    cart.clear();
    updateCartSummary();
  });
}

function initCatalog() {
  if (!window.ASIN_DATA || Object.keys(window.ASIN_DATA).length === 0) {
    window.setTimeout(initCatalog, 200);
    return;
  }

  const allAsins = Object.keys(window.ASIN_DATA || {});
  const categorySet = new Set();
  const materialSet = new Set();

  allAsins.forEach((asin) => {
    const data = window.ASIN_DATA?.[asin] || {};
    const category = String(data["親カテゴリ"] || data["カテゴリ"] || "").trim();
    if (category) categorySet.add(category);
    const materials = String(data["材質"] || "")
      .split(/[,\s/]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    materials.forEach((material) => materialSet.add(material));
  });

  const buildCheckboxOptions = (items, container) => {
    if (!container) return;
    container.innerHTML = "";
    items.forEach((item) => {
      const label = document.createElement("label");
      label.className = "checkbox-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = item;
      input.checked = true;
      input.addEventListener("change", runSearch);
      const span = document.createElement("span");
      span.textContent = item;
      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  };

  const getCheckedValues = (container) => {
    if (!container) return new Set();
    return new Set(
      Array.from(container.querySelectorAll("input[type=checkbox]"))
        .filter((input) => input.checked)
        .map((input) => input.value)
    );
  };

  const renderCards = (asins) => {
    cardState.forEach((entry) => {
      if (entry.chart) entry.chart.destroy();
    });
    itemsContainer.innerHTML = "";
    cardState.clear();
    if (!asins.length) {
      emptyState.style.display = "block";
      updateHeaderStatus();
      return;
    }
    asins.forEach((asin) => {
      const data = window.ASIN_DATA?.[asin];
      if (!data) return;
      const card = createProductCard(asin, data);
      itemsContainer.appendChild(card);
      cardState.set(asin, { el: card, data, chart: card.__chart || null });
    });
    emptyState.style.display = "none";
    updateHeaderStatus();
  };

  const runSearch = () => {
    const keyword = String(searchKeyword?.value || "").trim().toLowerCase();
    const excludeKeyword = String(searchExcludeKeyword?.value || "").trim().toLowerCase();
    const minProfitRate = num(searchProfitRateMin?.value);
    const minProfit = num(searchProfitMin?.value);
    const sellMin = num(searchSellMin?.value);
    const sellMax = num(searchSellMax?.value);
    const maxFbaPrice = num(searchFbaMax?.value);
    const costMin = num(searchCostMin?.value);
    const costMax = num(searchCostMax?.value);
    const minSales = num(searchSalesMin?.value);
    const minSales60 = num(searchSales60Min?.value);
    const minSales90 = num(searchSales90Min?.value);
    const minForecast30 = num(searchForecast30Min?.value);
    const maxSellers = num(searchSellerMax?.value);
    const minReview = num(searchReviewMin?.value);
    const sizeMin = num(searchSizeMin?.value);
    const sizeMax = num(searchSizeMax?.value);
    const stockMax = num(searchStockMax?.value);
    const returnMax = num(searchReturnMax?.value);
    const selectedCategories = getCheckedValues(searchCategoryFilters);
    const selectedMaterials = getCheckedValues(searchMaterialFilters);
    const hasCategoryFilter =
      !!searchCategoryFilters &&
      Array.from(searchCategoryFilters.querySelectorAll("input[type=checkbox]")).some((input) => !input.checked);
    const hasMaterialFilter =
      !!searchMaterialFilters &&
      Array.from(searchMaterialFilters.querySelectorAll("input[type=checkbox]")).some((input) => !input.checked);
    const hasTextFilter = Boolean(keyword || excludeKeyword);
    const hasNumericFilter = [
      minProfitRate,
      minProfit,
      sellMin,
      sellMax,
      maxFbaPrice,
      costMin,
      costMax,
      minSales,
      minSales60,
      minSales90,
      minForecast30,
      maxSellers,
      minReview,
      sizeMin,
      sizeMax,
      stockMax,
      returnMax
    ].some((value) => value > 0);
    const hasFilters = hasTextFilter || hasNumericFilter || hasCategoryFilter || hasMaterialFilter;
    const filtered = hasFilters
      ? allAsins.filter((asin) => {
          const data = window.ASIN_DATA?.[asin] || {};
          const title = String(data["品名"] || data["商品名"] || data["商品タイトル"] || "").toLowerCase();
          const category = String(data["親カテゴリ"] || data["カテゴリ"] || "").trim();
          const materials = String(data["材質"] || "")
            .split(/[,\s/]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          const profitRate = num(data["粗利益率"]);
          const profit = num(data["粗利益"]);
          const sellUSD = num(data["販売額（ドル）"]);
          const fbaPrice = num(data["FBA最安値"]);
          const cost = num(data["仕入れ目安単価"]);
          const sales30 = num(data["30日販売数"]);
          const sales60 = num(data["60日販売数"]);
          const sales90 = num(data["90日販売数"]);
          const forecast30 = num(data["予測30日販売数"]);
          const sellers = num(data["セラー数"]);
          const review = num(data["レビュー評価"]);
          const size = num(data["サイズ感"]);
          const stock = num(data["在庫数"]);
          const returns = num(data["返品率"]);

          if (keyword && !(asin.toLowerCase().includes(keyword) || title.includes(keyword))) {
            return false;
          }
          if (excludeKeyword) {
            const terms = excludeKeyword.split(/[\s,]+/).filter(Boolean);
            if (terms.some((term) => asin.toLowerCase().includes(term) || title.includes(term))) {
              return false;
            }
          }
          if (minProfitRate && profitRate < minProfitRate) {
            return false;
          }
          if (minProfit && profit > 0 && profit < minProfit) {
            return false;
          }
          if (sellMin && sellUSD > 0 && sellUSD < sellMin) {
            return false;
          }
          if (sellMax && sellUSD > 0 && sellUSD > sellMax) {
            return false;
          }
          if (maxFbaPrice && fbaPrice > 0 && fbaPrice > maxFbaPrice) {
            return false;
          }
          if (costMin && cost > 0 && cost < costMin) {
            return false;
          }
          if (costMax && cost > 0 && cost > costMax) {
            return false;
          }
          if (minSales && sales30 > 0 && sales30 < minSales) {
            return false;
          }
          if (minSales60 && sales60 > 0 && sales60 < minSales60) {
            return false;
          }
          if (minSales90 && sales90 > 0 && sales90 < minSales90) {
            return false;
          }
          if (minForecast30 && forecast30 > 0 && forecast30 < minForecast30) {
            return false;
          }
          if (maxSellers && sellers > 0 && sellers > maxSellers) {
            return false;
          }
          if (minReview && review > 0 && review < minReview) {
            return false;
          }
          if (sizeMin && size > 0 && size < sizeMin) {
            return false;
          }
          if (sizeMax && size > 0 && size > sizeMax) {
            return false;
          }
          if (stockMax && stock > 0 && stock > stockMax) {
            return false;
          }
          if (returnMax && returns > 0 && returns > returnMax) {
            return false;
          }
          if (hasCategoryFilter && selectedCategories.size && category && !selectedCategories.has(category)) {
            return false;
          }
          if (
            hasMaterialFilter &&
            selectedMaterials.size &&
            materials.length &&
            !materials.some((m) => selectedMaterials.has(m))
          ) {
            return false;
          }
          return true;
        })
      : allAsins;
    if (searchResultCount) searchResultCount.textContent = String(filtered.length);
    renderCards(filtered);
  };

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b, "ja"));
  const materials = Array.from(materialSet).sort((a, b) => a.localeCompare(b, "ja"));
  buildCheckboxOptions(categories, searchCategoryFilters);
  buildCheckboxOptions(materials, searchMaterialFilters);

  searchDetailBtn?.addEventListener("click", () => {
    if (!searchAdvanced) return;
    searchAdvanced.classList.toggle("is-open");
    searchDetailBtn.textContent = searchAdvanced.classList.contains("is-open") ? "詳細を閉じる" : "詳細";
  });
  searchApplyBtn?.addEventListener("click", runSearch);
  searchResetBtn?.addEventListener("click", () => {
    if (searchKeyword) searchKeyword.value = "";
    if (searchExcludeKeyword) searchExcludeKeyword.value = "";
    if (searchProfitRateMin) searchProfitRateMin.value = "";
    if (searchProfitMin) searchProfitMin.value = "";
    if (searchSellMin) searchSellMin.value = "";
    if (searchSellMax) searchSellMax.value = "";
    if (searchFbaMax) searchFbaMax.value = "";
    if (searchCostMin) searchCostMin.value = "";
    if (searchCostMax) searchCostMax.value = "";
    if (searchSalesMin) searchSalesMin.value = "";
    if (searchSales60Min) searchSales60Min.value = "";
    if (searchSales90Min) searchSales90Min.value = "";
    if (searchForecast30Min) searchForecast30Min.value = "";
    if (searchSellerMax) searchSellerMax.value = "";
    if (searchReviewMin) searchReviewMin.value = "";
    if (searchSizeMin) searchSizeMin.value = "";
    if (searchSizeMax) searchSizeMax.value = "";
    if (searchStockMax) searchStockMax.value = "";
    if (searchReturnMax) searchReturnMax.value = "";
    searchCategoryFilters?.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.checked = true;
    });
    searchMaterialFilters?.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.checked = true;
    });
    runSearch();
  });
  [
    searchKeyword,
    searchExcludeKeyword,
    searchProfitRateMin,
    searchProfitMin,
    searchSellMin,
    searchSellMax,
    searchFbaMax,
    searchCostMin,
    searchCostMax,
    searchSalesMin,
    searchSales60Min,
    searchSales90Min,
    searchForecast30Min,
    searchSellerMax,
    searchReviewMin,
    searchSizeMin,
    searchSizeMax,
    searchStockMax,
    searchReturnMax
  ].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") runSearch();
    });
  });
  runSearch();
}

function addOrFocusCard(asin) {
  const data = (window.ASIN_DATA || {})[asin];
  if (!data) return alert("データがありません: " + asin);

  if (cardState.has(asin)) {
    cardState.get(asin).el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const card = createProductCard(asin, data);
  itemsContainer.appendChild(card);

  emptyState.style.display = "none";
  cardState.set(asin, { el: card, data, chart: card.__chart || null });

  updateHeaderStatus();
}

function updateHeaderStatus() {
  const count = cardState.size;
  if (headerStatus) headerStatus.textContent = count ? `表示中: ${count} ASIN` : "";
}

/* =========================
   上部5枠：レンダリング
========================= */
function renderTopZones() {
  if (!zonePool || !zoneInfo || !zoneCenter || !zoneTable || !zoneHidden) return;
  zonePool.innerHTML = "";
  zoneInfo.innerHTML = "";
  zoneCenter.innerHTML = "";
  zoneTable.innerHTML = "";
  zoneHidden.innerHTML = "";

  zoneState.pool.forEach((t) => zonePool.appendChild(makePill(t)));
  zoneState.info.forEach((t) => zoneInfo.appendChild(makePill(t)));
  zoneState.center.forEach((t) => zoneCenter.appendChild(makePill(t)));
  zoneState.table.forEach((t) => zoneTable.appendChild(makePill(t)));
  zoneState.hidden.forEach((t) => zoneHidden.appendChild(makePill(t)));

  refreshSortRuleOptions();
}

function makePill(token) {
  const pill = document.createElement("div");
  pill.className = "metric-pill";
  pill.draggable = true;
  pill.dataset.token = token;
  pill.textContent = labelOf(token);

  pill.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", `item:${token}`);
    e.dataTransfer.effectAllowed = "move";
  });

  return pill;
}

/* =========================
   DnD（共通5枠）重複不可
   ★修正：枠内の並び替え（挿入位置）に対応
========================= */

// ★ドロップ位置から「どのpillの前に入れるか」を決める
function getDropBeforeToken(zoneEl, clientX, clientY) {
  // マウス直下の要素から、pillを探す
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const pill = el.closest?.(".metric-pill");
  if (!pill || !zoneEl.contains(pill)) return null;

  // pillの左右/上下どちら側に落ちたかで、前/後ろを決める
  const rect = pill.getBoundingClientRect();
  const isRow = rect.width >= rect.height; // だいたい横長pill想定
  const before =
    isRow
      ? clientX < rect.left + rect.width / 2
      : clientY < rect.top + rect.height / 2;

  if (before) return pill.dataset.token;

  // 後ろに落ちた場合は「次のpillの前」扱いにする（=そのpillの直後）
  const next = pill.nextElementSibling?.classList?.contains("metric-pill") ? pill.nextElementSibling : null;
  return next ? next.dataset.token : null;
}

function attachZoneDnD(zoneEl, { zoneKey }) {
  if (!zoneEl) return;

  zoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  zoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain") || "";
    if (!payload.startsWith("item:")) return;

    const token = payload.slice(5);

    const fromKey = findZoneOf(token);
    if (!fromKey) return;

    // まず元の場所から外す
    zoneState[fromKey] = zoneState[fromKey].filter((t) => t !== token);

    // ★この枠内の「挿入位置」を取得（pillの前に入れる）
    const beforeToken = getDropBeforeToken(zoneEl, e.clientX, e.clientY);

    if (beforeToken) {
      const idx = zoneState[zoneKey].indexOf(beforeToken);
      if (idx >= 0) {
        zoneState[zoneKey].splice(idx, 0, token);
      } else {
        zoneState[zoneKey].push(token);
      }
    } else {
      // pillが見つからない/末尾に落ちた → 末尾
      zoneState[zoneKey].push(token);
    }

    renderTopZones();
    rerenderAllCards();
  });
}

function findZoneOf(token) {
  for (const k of Object.keys(zoneState)) {
    if (zoneState[k].includes(token)) return k;
  }
  return null;
}

/* =========================
   sort UI
========================= */
function initSortUI() {
  renderSortControls();

  addSortRuleBtn?.addEventListener("click", () => {
    sortRules.push({ token: tokM(METRICS_ALL[0].id), dir: "desc" });
    renderSortControls();
  });

  applySortBtn?.addEventListener("click", () => {
    applySortToCards();
  });

  clearSortBtn?.addEventListener("click", () => {
    sortRules = [];
    renderSortControls();
  });
}

function refreshSortRuleOptions() {
  renderSortControls();
}

function renderSortControls() {
  if (!sortControls || !sortBar) return;
  sortControls.innerHTML = "";

  if (!sortRules.length) {
    sortBar.style.display = "none";
    return;
  }
  sortBar.style.display = "flex";

  sortRules.forEach((r, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const sel = document.createElement("select");
    sel.className = "sort-sel";

    METRICS_ALL.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = tokM(m.id);
      opt.textContent = m.label;
      if (r.token === opt.value) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", () => {
      r.token = sel.value;
    });

    const dir = document.createElement("select");
    dir.className = "sort-dir";
    dir.innerHTML = `
      <option value="desc">降順</option>
      <option value="asc">昇順</option>
    `;
    dir.value = r.dir;
    dir.addEventListener("change", () => {
      r.dir = dir.value;
    });

    const del = document.createElement("button");
    del.className = "sort-del";
    del.type = "button";
    del.textContent = "×";
    del.addEventListener("click", () => {
      sortRules.splice(idx, 1);
      renderSortControls();
    });

    row.appendChild(sel);
    row.appendChild(dir);
    row.appendChild(del);
    sortControls.appendChild(row);
  });
}

function applySortToCards() {
  if (!sortRules.length) return;

  const cards = Array.from(itemsContainer.querySelectorAll(".product-card"));

  const getMetricVal = (data, metricToken) => {
    const { type, id } = parseToken(metricToken);
    if (type !== "M") return 0;
    const m = METRIC_BY_ID[id];
    if (!m) return 0;
    return num(data[m.sourceKey]);
  };

  cards.sort((a, b) => {
    const aData = (window.ASIN_DATA || {})[a.dataset.asin] || {};
    const bData = (window.ASIN_DATA || {})[b.dataset.asin] || {};

    for (const r of sortRules) {
      const va = getMetricVal(aData, r.token);
      const vb = getMetricVal(bData, r.token);
      if (va === vb) continue;
      return r.dir === "asc" ? va - vb : vb - va;
    }
    return 0;
  });

  cards.forEach((c) => itemsContainer.appendChild(c));
}

/* =========================
   token value resolve
========================= */
function resolveTokenValue(token, ctx, data) {
  const { type, id } = parseToken(token);

  if (type === "M") {
    const m = METRIC_BY_ID[id];
    return { kind: "text", label: m?.label || id, text: data?.[m?.sourceKey] ?? "－" };
  }

  if (type === "I") {
    const rv = resolveInfoValueById(id, ctx);
    if (rv.type === "tags") return { kind: "tags", label: INFO_BY_ID[id]?.label || id, html: rv.html };
    if (rv.type === "html") return { kind: "html", label: INFO_BY_ID[id]?.label || id, html: rv.html };
    return { kind: "text", label: INFO_BY_ID[id]?.label || id, text: rv.text };
  }

  return { kind: "text", label: id, text: "－" };
}

const NOTICE_DEFS = [
  {
    id: "intellectual",
    label: "知財",
    className: "info",
    match: /知財|IP|権利/,
    fields: ["注意事項（知財）"]
  },
  {
    id: "oversize",
    label: "大型",
    className: "warn",
    match: /大型|危険|要承認|承認要/,
    fields: ["注意事項（大型）"]
  },
  {
    id: "shipping",
    label: "出荷制限",
    className: "danger",
    match: /輸出不可|出荷禁止|禁止/,
    fields: ["注意事項（出荷制限）"]
  }
];

function resolveNoticeFlag(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^(?:なし|無し|無|対象外|0|no|off|false)$/i.test(raw)) return false;
  if (/^(?:あり|有|対象|1|yes|on|true)$/i.test(raw)) return true;
  return true;
}

function hasNoticeFlag(data, def, warningText) {
  let hasExplicitOff = false;
  for (const field of def.fields ?? []) {
    const resolved = resolveNoticeFlag(data[field]);
    if (resolved === true) return true;
    if (resolved === false) hasExplicitOff = true;
  }
  if (hasExplicitOff) return false;
  return def.match.test(warningText);
}

function renderNoticeTags(data) {
  const warningText = String(data?.["注意事項（警告系）"] ?? data?.["注意事項"] ?? "");
  const tags = NOTICE_DEFS.map((def) => {
    const isActive = hasNoticeFlag(data, def, warningText);
    const cls = isActive ? `tag ${def.className}` : "tag muted";
    return `<span class="${cls}" data-state="${isActive ? "on" : "off"}">${def.label}</span>`;
  });
  return tags.join("");
}

function buildAsinLink(asin, baseUrl) {
  const value = String(asin ?? "").trim();
  if (!value || value === "－") return "－";
  const href = `${baseUrl}${encodeURIComponent(value)}`;
  return `<a class="asin-link" href="${href}" target="_blank" rel="noopener">${value}</a>`;
}

function buildImageSearchLink(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "－") return "－";
  const href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(raw)}`;
  return `<a class="asin-link" href="${href}" target="_blank" rel="noopener">${raw}</a>`;
}

function resolveInfoValueById(id, ctx) {
  const f = INFO_BY_ID[id];
  if (!f) return { type: "text", text: "－" };

  const { jpAsin, usAsin, size, weight, data } = ctx;

  const computed = {
    商品名: data["品名"] || data["商品名"] || data["商品タイトル"] || "－",
    日本ASIN: buildAsinLink(jpAsin, "https://www.amazon.co.jp/s?k="),
    米ASIN: buildAsinLink(usAsin, "https://www.amazon.com/s?k="),
    JAN: buildImageSearchLink(data["JAN"]),
    サイズ: size,
    "重量（容積重量）": weight,
    カテゴリ: `${data["親カテゴリ"] || "－"} / ${data["サブカテゴリ"] || "－"}`,
    注意事項: renderNoticeTags(data)
  };

  if (f.kind === "computedTags") return { type: "tags", html: computed[id] || "－" };
  if (f.kind === "computedHtml") return { type: "html", html: computed[id] || "－" };
  if (f.kind === "computed" || f.kind === "computedTitle") return { type: "text", text: computed[id] || "－" };

  const sourceKey = f.sourceKey || f.id;
  return { type: "text", text: data[sourceKey] ?? "－" };
}

/* =========================
   Info / Center / Table build
========================= */
function buildInfoGrid(container, ctx, data, tokens, options = {}) {
  if (!container) return;

  container.scrollTop = 0;
  container.scrollLeft = 0;

  container.innerHTML = "";

  const list = tokens ?? zoneState.info;
  if (!list || list.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "grid";
  container.style.overflowX = "hidden";

  list.forEach((tok) => {
    const v = resolveTokenValue(tok, ctx, data);

    const val = document.createElement("div");
    val.className = "v";

    val.style.fontSize = "13px";
    val.style.fontWeight = "800";
    val.style.opacity = "0.95";
    val.style.whiteSpace = "normal";
    val.style.wordBreak = "break-word";

    if (v.kind === "tags") {
      val.classList.add("v-tags");
      val.innerHTML = v.html;
    } else if (v.kind === "html") {
      val.classList.add("v-html");
      val.innerHTML = v.html;
    } else {
      val.textContent = v.text;
    }

    if (!options.hideLabels) {
      const k = document.createElement("div");
      k.className = "k";
      k.textContent = v.label;

      k.style.fontSize = "12px";
      k.style.fontWeight = "700";
      k.style.opacity = "0.60";
      container.appendChild(k);
    }
    container.appendChild(val);
  });

  container.scrollTop = 0;
  container.scrollLeft = 0;
}

function buildInfoGridSplit(containerA, containerB, ctx, data) {
  const tokens = [...zoneState.info];
  const mid = Math.ceil(tokens.length / 2);
  const first = tokens.slice(0, mid);
  const second = tokens.slice(mid);

  buildInfoGrid(containerA, ctx, data, first);
  buildInfoGrid(containerB, ctx, data, second);
}

function buildCenterList(listEl, ctx, data) {
  if (!listEl) return;
  listEl.innerHTML = "";

  const formatMetricValue = (metricId, rawValue) => {
    if (rawValue == null || rawValue === "") return "－";
    if (metricId === "サイズ感") {
      const value = num(rawValue);
      return Number.isFinite(value) ? String(value) : "－";
    }
    return String(rawValue);
  };

  zoneState.center.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "M") return;

    const m = METRIC_BY_ID[id];
    if (!m) return;

    const row = document.createElement("div");
    row.className = "center-row";

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = m.label;

    const v = document.createElement("div");
    v.className = "v";
    const raw = data[m.sourceKey];
    v.textContent = formatMetricValue(id, raw);

    row.appendChild(k);
    row.appendChild(v);
    listEl.appendChild(row);
  });
}

function buildCenterCards(container, ctx, data) {
  if (!container) return;
  container.innerHTML = "";

  const formatMetricValue = (metricId, rawValue) => {
    if (rawValue == null || rawValue === "") return "－";
    if (metricId === "サイズ感") {
      const value = num(rawValue);
      return Number.isFinite(value) ? String(value) : "－";
    }
    return String(rawValue);
  };

  const recommendIds = [
    "推奨仕入数(90日)",
    "推奨仕入数(60日)",
    "推奨仕入数(30日)"
  ];
  const compactIds = new Set([]);
  const salesSummaryIds = new Set([
    "予測90日販売数",
    "予測60日販売数",
    "予測30日販売数",
    "90日販売数",
    "60日販売数",
    "30日販売数",
    "180日販売数"
  ]);
  const inlineGroupIds = ["セラー数", "サイズ感", "在庫数", "返品率"];
  let inlineGroupWrap = null;
  let salesSummaryInserted = false;
  let recommendInserted = false;

  zoneState.center.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "M") return;
    const m = METRIC_BY_ID[id];
    if (!m) return;

    if (recommendIds.includes(id)) {
      if (!recommendInserted) {
        container.appendChild(buildRecommendBlock(data));
        recommendInserted = true;
      }
      return;
    }

    if (inlineGroupIds.includes(id)) {
      if (!inlineGroupWrap) {
        inlineGroupWrap = document.createElement("div");
        inlineGroupWrap.className = "center-inline-group";
        container.appendChild(inlineGroupWrap);
      }
      const row = document.createElement("div");
      row.className = "center-inline";

      const k = document.createElement("span");
      k.className = "k";
      k.textContent = m.label;

      const v = document.createElement("span");
      v.className = "v";
      const raw = data[m.sourceKey];
      v.textContent = formatMetricValue(id, raw);

      row.appendChild(k);
      row.appendChild(v);
      inlineGroupWrap.appendChild(row);
      return;
    }

    if (salesSummaryIds.has(id)) {
      if (!salesSummaryInserted) {
        container.appendChild(buildSalesSummaryBlock(data));
        salesSummaryInserted = true;
      }
      return;
    }

    if (compactIds.has(id)) {
      const row = document.createElement("div");
      row.className = "center-inline";

      const k = document.createElement("span");
      k.className = "k";
      k.textContent = m.label;

      const v = document.createElement("span");
      v.className = "v";
      const raw = data[m.sourceKey];
      v.textContent = formatMetricValue(id, raw);

      row.appendChild(k);
      row.appendChild(v);
      container.appendChild(row);
      return;
    }

    const card = document.createElement("div");
    card.className = "center-card";

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = m.label;

    const v = document.createElement("div");
    v.className = "v";
    const raw = data[m.sourceKey];
    v.textContent = formatMetricValue(id, raw);

    k.style.fontSize = "11px";
    k.style.opacity = "0.55";
    v.style.fontSize = "16px";
    v.style.fontWeight = "900";

    card.appendChild(k);
    card.appendChild(v);
    container.appendChild(card);
  });
}

function buildRecommendBlock(data) {
  const wrap = document.createElement("div");
  wrap.className = "recommend-wrap";

  const table = document.createElement("div");
  table.className = "recommend-table";

  const recommendDefs = [
    { id: "推奨仕入数(180日)", label: "180日間" },
    { id: "推奨仕入数(120日)", label: "120日間" },
    { id: "推奨仕入数(90日)", label: "90日間" },
    { id: "推奨仕入数(60日)", label: "60日間" },
    { id: "推奨仕入数(30日)", label: "30日間" }
  ];

  const columnsWrap = document.createElement("div");
  columnsWrap.className = "recommend-columns";

  const columnsViewport = document.createElement("div");
  columnsViewport.className = "recommend-columns-viewport";

  const columnsInner = document.createElement("div");
  columnsInner.className = "recommend-columns-inner";

  const labelsCol = document.createElement("div");
  labelsCol.className = "recommend-labels";

  const titleCell = document.createElement("div");
  titleCell.className = "recommend-cell recommend-cell-head";
  titleCell.textContent = "推奨仕入数";
  labelsCol.appendChild(titleCell);

  const rowDefs = [
    { id: "minimum", label: "ミニマム", factor: 0.85 },
    { id: "balance", label: "バランス", factor: 1 },
    { id: "stepup", label: "ステップアップ", factor: 1.2 }
  ];

  rowDefs.forEach((rowDef) => {
    const labelCell = document.createElement("div");
    labelCell.className = "recommend-cell recommend-cell-label";
    labelCell.dataset.mode = rowDef.id;
    labelCell.textContent = rowDef.label;
    labelsCol.appendChild(labelCell);
  });

  recommendDefs.forEach((rec) => {
    const col = document.createElement("div");
    col.className = "recommend-col";
    col.dataset.card = rec.id;

    const headerCell = document.createElement("div");
    headerCell.className = "recommend-cell recommend-cell-head";
    headerCell.dataset.card = rec.id;
    headerCell.textContent = rec.label;
    col.appendChild(headerCell);

    rowDefs.forEach((rowDef) => {
      const raw = data[rec.id];
      const hasValue = raw != null && raw !== "";
      const base = num(raw);
      const value = hasValue
        ? Math.round(base * rowDef.factor).toLocaleString("ja-JP")
        : "－";

      const valueCell = document.createElement("div");
      valueCell.className = "recommend-cell recommend-cell-value";
      valueCell.dataset.card = rec.id;
      valueCell.dataset.mode = rowDef.id;
      valueCell.textContent = value;
      valueCell.dataset.baseValue = value;
      col.appendChild(valueCell);
    });

    columnsInner.appendChild(col);
  });

  columnsViewport.appendChild(columnsInner);
  columnsWrap.appendChild(columnsViewport);

  const head = document.createElement("div");
  head.className = "recommend-head";

  const title = document.createElement("div");
  title.className = "recommend-title";
  title.textContent = "推奨仕入数";
  head.appendChild(title);

  const actionGroup = document.createElement("div");
  actionGroup.className = "recommend-action-group";

  const minimumBtn = document.createElement("button");
  minimumBtn.type = "button";
  minimumBtn.className = "recommend-btn js-recommendMinimum";
  minimumBtn.textContent = "ミニマム";
  actionGroup.appendChild(minimumBtn);

  const stepUpBtn = document.createElement("button");
  stepUpBtn.type = "button";
  stepUpBtn.className = "recommend-btn js-recommendStepup";
  stepUpBtn.textContent = "ステップアップ";
  actionGroup.appendChild(stepUpBtn);

  head.appendChild(actionGroup);

  table.appendChild(labelsCol);
  table.appendChild(columnsWrap);

  wrap.appendChild(head);
  wrap.appendChild(table);

  const cardOrder = [
    "推奨仕入数(180日)",
    "推奨仕入数(120日)",
    "推奨仕入数(90日)",
    "推奨仕入数(60日)",
    "推奨仕入数(30日)"
  ];
  const windowSize = cardOrder.length;
  const rowOrder = ["minimum", "balance", "stepup"];
  const defaultCardId = "推奨仕入数(60日)";
  const defaultRowId = "balance";
  let currentCardIndex = cardOrder.indexOf(defaultCardId);
  let currentRowIndex = rowOrder.indexOf(defaultRowId);
  let windowStart = 0;

  const updateRecommendVisibility = () => {
    wrap.style.setProperty("--recommend-cols", String(windowSize));
    wrap.style.setProperty("--recommend-offset", String(windowStart));
  };

  const applySelection = () => {
    updateRecommendSelection(
      wrap,
      cardOrder[currentCardIndex],
      rowOrder[currentRowIndex],
      defaultCardId,
      defaultRowId
    );
    updateRecommendVisibility();
  };

  const moveMinimum = () => {
    if (currentRowIndex > 0) {
      currentRowIndex -= 1;
    } else {
      currentRowIndex = rowOrder.length - 1;
      currentCardIndex = (currentCardIndex + 1) % windowSize;
    }
    applySelection();
  };

  const moveStepUp = () => {
    if (currentRowIndex < rowOrder.length - 1) {
      currentRowIndex += 1;
    } else {
      currentRowIndex = 0;
      currentCardIndex = (currentCardIndex - 1 + windowSize) % windowSize;
    }
    applySelection();
  };

  wrap.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest(".js-recommendMinimum")) {
      moveMinimum();
      return;
    }
    if (target.closest(".js-recommendStepup")) {
      moveStepUp();
      return;
    }
    const cell = target.closest(".recommend-cell-value");
    if (!cell) return;
    const cardId = cell.dataset.card;
    const modeId = cell.dataset.mode;
    if (!cardId || !modeId) return;
    const cardIndex = cardOrder.indexOf(cardId);
    const rowIndex = rowOrder.indexOf(modeId);
    if (cardIndex === -1 || rowIndex === -1) return;
    currentCardIndex = cardIndex;
    currentRowIndex = rowIndex;
    applySelection();
  });

  applySelection();

  return wrap;
}

function buildSalesSummaryBlock(data) {
  const wrap = document.createElement("div");
  wrap.className = "sales-summary";

  const days = [180, 120, 90, 60, 30];
  const list = document.createElement("div");
  list.className = "sales-summary-list";

  days.forEach((day) => {
    const card = document.createElement("div");
    card.className = "sales-summary-card";

    const head = document.createElement("div");
    head.className = "sales-summary-day";
    head.textContent = `${day}日間`;
    card.appendChild(head);

    const actual = document.createElement("div");
    actual.className = "sales-summary-value";
    const actualRaw = data[`${day}日販売数`];
    actual.textContent = actualRaw == null || actualRaw === "" ? "－" : Number(actualRaw).toLocaleString("ja-JP");
    card.appendChild(actual);

    const forecast = document.createElement("div");
    forecast.className = "sales-summary-subvalue";
    const forecastRaw = data[`予測${day}日販売数`];
    forecast.textContent =
      forecastRaw == null || forecastRaw === "" ? "－" : Number(forecastRaw).toLocaleString("ja-JP");
    card.appendChild(forecast);

    list.appendChild(card);
  });

  const labelsWrap = document.createElement("div");
  labelsWrap.className = "sales-summary-labels";

  const actualLabel = document.createElement("div");
  actualLabel.className = "sales-summary-row-label sales-summary-label-actual";
  actualLabel.textContent = "販売数(実績)";
  labelsWrap.appendChild(actualLabel);

  const forecastLabel = document.createElement("div");
  forecastLabel.className = "sales-summary-row-label sales-summary-label-forecast";
  forecastLabel.textContent = "販売数(予測)";
  labelsWrap.appendChild(forecastLabel);

  wrap.appendChild(labelsWrap);
  wrap.appendChild(list);

  return wrap;
}

function updateRecommendSelection(wrap, cardId, mode, defaultCardId, defaultMode) {
  wrap.querySelectorAll(".recommend-cell-value").forEach((cell) => {
    const isActive = cell.dataset.mode === mode && cell.dataset.card === cardId;
    cell.classList.toggle("is-active", isActive);
    cell.classList.toggle("is-muted", !isActive);
    const baseValue = cell.dataset.baseValue || cell.textContent || "";
    const isDefault = cell.dataset.card === defaultCardId && cell.dataset.mode === defaultMode;
    const hasFire = cell.dataset.hasFire === "true" || String(cell.textContent || "").startsWith("🔥");
    if (isActive && isDefault) {
      cell.dataset.hasFire = "true";
      cell.textContent = `🔥${baseValue}`;
    } else if (hasFire) {
      cell.textContent = `🔥${baseValue}`;
    } else {
      cell.textContent = baseValue;
    }
  });
}

function rerenderAllCards() {
  const isThird = document.body.classList.contains("third-layout");
  const isFourth =
    document.body.classList.contains("fourth-layout") ||
    document.body.classList.contains("fifth-layout");

  cardState.forEach((v) => {
    const asin = v.el.dataset.asin;

    const jpAsin = v.data["日本ASIN"] || "－";
    const usAsin = v.data["アメリカASIN"] || asin || "－";

    const realW = v.data["重量kg"] ?? v.data["重量（kg）"] ?? v.data["重量"] ?? "";
    const volW = v.data["容積重量"] ?? "";
    const size = v.data["サイズ"] || "－";
    const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;

    const ctx = { asin, jpAsin, usAsin, size, weight, data: v.data };

    if (isThird) {
      buildInfoGridSplit(
        v.el.querySelector(".js-infoGridA"),
        v.el.querySelector(".js-infoGridB"),
        ctx,
        v.data
      );
    } else if (isFourth) {
      const infoTop = v.el.querySelector(".js-infoTop");
      const infoGrid = v.el.querySelector(".js-infoGrid");
      const topTokens = [tokI("評価"), tokI("注意事項")];
      const restTokens = zoneState.info.filter((token) => !topTokens.includes(token));
      buildInfoGrid(infoTop, ctx, v.data, topTokens);
      buildInfoGrid(infoGrid, ctx, v.data, restTokens);
    } else {
      buildInfoGrid(v.el.querySelector(".js-infoGrid"), ctx, v.data);
    }

    if (isFourth) {
      buildCenterCards(v.el.querySelector(".js-centerCards"), ctx, v.data);
    } else {
      buildCenterList(v.el.querySelector(".js-center"), ctx, v.data);
    }
  });
}

/* =========================
   チャート（既存）
========================= */
function getDeviationTier(pct) {
  if (pct < 5) return "light";
  if (pct < 10) return "medium";
  return "strong";
}

function resolveBackgroundColor(minValue, lineValue) {
  if (!Number.isFinite(lineValue) || lineValue <= 0 || !Number.isFinite(minValue)) return "rgba(0,0,0,0)";
  const diffPct = Math.abs(lineValue - minValue) / lineValue * 100;
  const tier = getDeviationTier(diffPct);
  const isBlue = minValue >= lineValue;
  const backgroundColorMap = {
    blue: {
      light: "rgba(59,130,246,0.12)",
      medium: "rgba(59,130,246,0.2)",
      strong: "rgba(59,130,246,0.28)"
    },
    red: {
      light: "rgba(239,68,68,0.12)",
      medium: "rgba(239,68,68,0.2)",
      strong: "rgba(239,68,68,0.28)"
    }
  };
  return isBlue ? backgroundColorMap.blue[tier] : backgroundColorMap.red[tier];
}
function renderChart(canvas, { redLineUSD, priceUSD } = {}) {
  const labels = Array.from({ length: 180 }, (_, i) => `${180 - i}日`);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const rank = [];
  const sellers = [];
  const price = [];

  let r = 58000 + (Math.random() - 0.5) * 12000;
  let s = Math.max(1, Math.round(3 + Math.random() * 4));
  const basePrice = Number.isFinite(priceUSD) && priceUSD > 0 ? priceUSD : 30 + (Math.random() - 0.5) * 6;
  let p = basePrice;
  const defaultRedLine = Number((basePrice * 0.95).toFixed(2));
  const resolvedRedLine = Number.isFinite(redLineUSD) && redLineUSD > 0 ? redLineUSD : defaultRedLine;
  let nextPriceChangeIn = 1 + Math.floor(Math.random() * 4);

  for (let i = 0; i < labels.length; i++) {
    const prevR = r;

    const meanR = 60000;
    r += (meanR - r) * 0.06 + (Math.random() - 0.5) * 3500;

    if (Math.random() < 0.04) {
      r += (Math.random() < 0.5 ? -1 : 1) * (2500 + Math.random() * 3500);
    }

    r = clamp(r, 3000, 180000);

    const improved = r < prevR;
    const diff = Math.abs(r - prevR);

    let ds = 0;
    const incProb = clamp(0.08 + diff / 30000, 0.05, 0.35);
    const decProb = clamp(0.06 + diff / 40000, 0.04, 0.30);

    if (improved) {
      if (Math.random() < incProb) ds += 1;
      if (Math.random() < incProb * 0.25) ds += 1;
    } else {
      if (Math.random() < decProb) ds -= 1;
    }

    s = Math.round(clamp(s + ds, 1, 18));

    rank.push(Math.round(r));
    sellers.push(s);
    price.push(Number(p.toFixed(2)));
  }

  const minPrice = Math.min(...price);
  const backgroundColor = resolveBackgroundColor(minPrice, resolvedRedLine);

  const backgroundFillPlugin = {
    id: "backgroundFill",
    beforeDraw(chartInstance, args, options) {
      const { ctx, chartArea, scales } = chartInstance;
      if (!chartArea) return;
      if (!chartInstance.__redLineActive || !chartInstance.__showPrice) return;
      const yScale = scales?.y2;
      if (!yScale) return;
      const lineValue = chartInstance.__redLineValue ?? resolvedRedLine;
      const lineY = yScale.getPixelForValue(lineValue);
      if (!Number.isFinite(lineY)) return;
      if (lineY >= chartArea.bottom) return;
      const clampedY = Math.min(chartArea.bottom, Math.max(lineY, chartArea.top));
      ctx.save();
      ctx.fillStyle = options.color;
      ctx.fillRect(
        chartArea.left,
        clampedY,
        chartArea.right - chartArea.left,
        chartArea.bottom - clampedY
      );
      ctx.restore();
    }
  };

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "ランキング", data: rank, yAxisID: "y", borderColor: "#0ea5e9", backgroundColor: "rgba(14,165,233,0.24)", tension: 0.25 },
        { label: "セラー数", data: sellers, yAxisID: "y1", borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.24)", tension: 0.25 },
        { label: "価格(USD)", data: price, yAxisID: "y2", borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.24)", tension: 0.25 },
        {
          label: "赤字ライン",
          data: Array.from({ length: labels.length }, () => resolvedRedLine),
          yAxisID: "y2",
          borderColor: "#ef4444",
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true },
        backgroundFill: { color: backgroundColor }
      },
      scales: {
        y: { position: "left" },
        y1: { position: "right", grid: { drawOnChartArea: false } },
        y2: { position: "right", grid: { drawOnChartArea: false } }
      }
    },
    plugins: [backgroundFillPlugin]
  });

  chart.__redLineActive = Number.isFinite(resolvedRedLine) && resolvedRedLine > 0;
  chart.__redLineValue = resolvedRedLine;
  chart.__priceMin = minPrice;
  chart.__showPrice = false;
  return chart;
}

function updateChartVisibility(chart, showDS, showSP) {
  chart.data.datasets.forEach((ds) => {
    if (ds.label === "ランキング") ds.hidden = !showDS;
    if (ds.label === "セラー数") ds.hidden = !(showDS || showSP);
    if (ds.label === "価格(USD)") ds.hidden = !showSP;
    if (ds.label === "赤字ライン") ds.hidden = !(showSP && chart.__redLineActive);
  });
  chart.__showPrice = showSP;
  chart.update();
}

function calcBreakEvenUSD(costJPY) {
  if (!Number.isFinite(costJPY) || costJPY <= 0) return null;
  return Number((costJPY / FX_RATE).toFixed(2));
}

function updateRedLine(chart, costJPY) {
  if (!chart) return;
  const redLineUSD = calcBreakEvenUSD(costJPY);
  const ds = chart.data.datasets.find((dataset) => dataset.label === "赤字ライン");
  if (!ds) return;
  const hasLine = Number.isFinite(redLineUSD) && redLineUSD > 0;
  chart.__redLineActive = hasLine;
  chart.__redLineValue = hasLine ? redLineUSD : null;
  ds.data = Array.from({ length: chart.data.labels.length }, () => (hasLine ? redLineUSD : null));
  const priceDataset = chart.data.datasets.find((d) => d.label === "価格(USD)");
  const priceMin = Number.isFinite(chart.__priceMin)
    ? chart.__priceMin
    : Math.min(...(priceDataset?.data ?? []));
  chart.__priceMin = priceMin;
  if (chart.options?.plugins?.backgroundFill) {
    chart.options.plugins.backgroundFill.color = resolveBackgroundColor(priceMin, hasLine ? redLineUSD : null);
  }
  chart.update();
}

/* =========================
   カート
========================= */
function updateCartSummary() {
  let totalCost = 0;
  let totalRevenueJPY = 0;
  let totalSalesUSD = 0;
  let totalShipping = 0;
  let totalTariff = 0;
  let itemCount = 0;

  cart.forEach((v) => {
    const qty = Math.max(1, Number(v.qty || 1));
    const sellUSD = Number(v.sellUSD || 0);
    const costJPY = Number(v.costJPY || 0);
    const shippingJPY = Number(v.shipping || 0);
    const tariffJPY = Number(v.tariff || 0);

    itemCount += qty;
    totalCost += costJPY * qty;
    totalRevenueJPY += sellUSD * FX_RATE * qty;
    totalSalesUSD += sellUSD * qty;
    totalShipping += shippingJPY * qty;
    totalTariff += tariffJPY * qty;
  });

  const profit = totalRevenueJPY - totalCost;
  const avgDenom = itemCount > 0 ? itemCount : 1;
  const avgPayment = totalRevenueJPY / avgDenom;
  const avgSalesUSD = totalSalesUSD / avgDenom;
  const avgCost = totalCost / avgDenom;
  const avgProfit = profit / avgDenom;
  const profitRate = totalRevenueJPY > 0 ? (profit / totalRevenueJPY) * 100 : 0;
  if (cartTotalPayment) {
    cartTotalPayment.textContent = `${fmtJPY(totalRevenueJPY)}(${fmtJPY(avgPayment)})`;
  }
  if (cartTotalSales) {
    cartTotalSales.textContent = `${fmtUSD(totalSalesUSD)}(${fmtUSD(avgSalesUSD)})`;
  }
  if (cartTotalCost) {
    cartTotalCost.textContent = `${fmtJPY(totalCost)}(${fmtJPY(avgCost)})`;
  }
  if (cartTotalProfit) {
    cartTotalProfit.textContent = `${fmtJPY(profit)}(${fmtJPY(avgProfit)})`;
  }
  if (cartProfitRate) {
    cartProfitRate.textContent = `${profitRate.toFixed(1)}%`;
  }
  if (cartItemCount) {
    cartItemCount.textContent = `${itemCount}個`;
  }
}

/* =========================
   カード生成（既存）
========================= */
function createProductCard(asin, data) {
  const card = document.createElement("section");
  card.className = "product-card card";
  card.dataset.asin = asin;

  const isAltLayout = document.body.classList.contains("alt-layout");
  const isThirdLayout = document.body.classList.contains("third-layout");
  const isFourthLayout =
    document.body.classList.contains("fourth-layout") ||
    document.body.classList.contains("fifth-layout");

  if (isThirdLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <input class="asin-memo" type="text" placeholder="メモ" />
        <button class="memo-save" type="button">保存</button>
      </div>

      <div class="layout3-grid">
        <div class="l3-image l3-block">
          <div class="head">商品画像</div>
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <div class="l3-infoA l3-block">
          <div class="head">商品情報①</div>
          <div class="info-grid js-infoGridA"></div>
        </div>

        <div class="l3-infoB l3-block">
          <div class="head">商品情報②</div>
          <div class="info-grid js-infoGridB"></div>
        </div>

        <div class="l3-center l3-block">
          <div class="center-list js-center"></div>
        </div>

        <div class="l3-buy">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button">カートに入れる</button>
        </div>

        <div class="l3-graph l3-block">
          <div class="head">グラフ（180日）</div>

          <div class="graph-options js-graphOptions">
            <label><input type="radio" name="graph-${asin}" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="radio" name="graph-${asin}" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>
      </div>

    `;
  } else if (isFourthLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <input class="asin-memo" type="text" placeholder="メモ" />
        <button class="memo-save" type="button">保存</button>
      </div>

      <div class="layout4-grid">
        <div class="l4-info l4-block">
          <div class="head">商品情報</div>
          <div class="info-top js-infoTop"></div>
          <div class="l4-info-media">
            <div class="image-box">
              <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
            </div>
          </div>
          <div class="info-grid js-infoGrid"></div>
        </div>

          <div class="l4-center l4-block">
          <div class="center-cards js-centerCards"></div>

          <div class="l4-variable">
            <div class="var-cards">
              <div class="center-card var-fba">
                <div class="k">FBA最安値（過去3ヶ月FBA最安値）</div>
                <div class="v js-fbaLowest">－</div>
              </div>
              <div class="center-card var-sell">
                <div class="k">販売価格（$）</div>
                <input class="v js-sell js-sellInput" type="number" step="0.01" placeholder="例: 39.99" />
              </div>
              <div class="center-card var-profit">
                <div class="k">粗利益</div>
                <div class="v js-varProfitCombined">－</div>
              </div>
            </div>
          </div>
        </div>

        <div class="l4-buy l4-block">
          <div class="head">カート</div>
          <div class="buy-inner">
            <div class="shop-panel">
              <div class="shop-panel-head">
                <div class="shop-panel-title">上位3ショップ（価格の安い順）</div>
                <button class="ghost-btn js-viewAll" type="button">全ショップを見る</button>
              </div>

              <div class="shop-list js-shopList">
                <div class="shop-card is-primary">
                  <div class="shop-rank">1</div>
                  <div class="shop-info">
                    <div class="shop-name">Amazon</div>
                    <div class="shop-meta">
                      <label class="shop-field">
                        <div class="shop-input-wrap">
                          <input class="shop-input js-cost" type="number" step="1" placeholder="金額" />
                          <span class="shop-unit">円</span>
                        </div>
                      </label>
                      <span class="shop-margin"><span class="shop-margin-label">粗利益率</span><span class="js-shopMargin">0%</span></span>
                    </div>
                  </div>
                  <div class="shop-qty">
                    <span>数量</span>
                    <input class="shop-qty-input js-qty" type="number" min="0" step="1" value="0" />
                  </div>
                </div>

                <div class="shop-card">
                  <div class="shop-rank">2</div>
                  <div class="shop-info">
                    <div class="shop-name">Yahoo</div>
                    <div class="shop-meta">
                      <label class="shop-field">
                        <div class="shop-input-wrap">
                          <input class="shop-input js-shopAmount" type="number" step="1" placeholder="金額" />
                          <span class="shop-unit">円</span>
                        </div>
                      </label>
                      <span class="shop-margin"><span class="shop-margin-label">粗利益率</span><span class="js-shopMargin">0%</span></span>
                    </div>
                  </div>
                  <div class="shop-qty">
                    <span>数量</span>
                    <input class="shop-qty-input js-shopQty" type="number" min="0" step="1" value="0" />
                  </div>
                </div>

                <div class="shop-card">
                  <div class="shop-rank">3</div>
                  <div class="shop-info">
                    <div class="shop-name">楽天</div>
                    <div class="shop-meta">
                      <label class="shop-field">
                        <div class="shop-input-wrap">
                          <input class="shop-input js-shopAmount" type="number" step="1" placeholder="金額" />
                          <span class="shop-unit">円</span>
                        </div>
                      </label>
                      <span class="shop-margin"><span class="shop-margin-label">粗利益率</span><span class="js-shopMargin">0%</span></span>
                    </div>
                  </div>
                  <div class="shop-qty">
                    <span>数量</span>
                    <input class="shop-qty-input js-shopQty" type="number" min="0" step="1" value="0" />
                  </div>
                </div>
              </div>

              
            </div>

            <div class="shop-panel">
            <div class="shop-panel-head">
              <div>
                <div class="shop-panel-title">その他のショップ</div>
              </div>
            </div>
              <div class="shop-list js-extraShopList">
                <div class="shop-card is-secondary js-customShop">
                  <div class="shop-info">
                    <input class="shop-name-input js-shopName" type="text" placeholder="ショップ名" />
                    <div class="shop-meta">
                      <div class="shop-input-wrap">
                        <input class="shop-input js-shopAmount" type="number" step="1" placeholder="金額" />
                        <span class="shop-unit">円</span>
                      </div>
                      <span class="shop-margin"><span class="shop-margin-label">粗利益率</span><span class="js-shopMargin">0%</span></span>
                    </div>
                  </div>
                  <div class="shop-qty">
                    <span>数量</span>
                    <input class="shop-qty-input js-shopQty" type="number" min="0" step="1" value="0" />
                  </div>
                  <div class="shop-row-actions">
                    <button class="shop-add js-addShop" type="button">＋</button>
                    <button class="shop-remove" type="button">－</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="cart-breakdown">
              <div class="breakdown-row">
                <div class="breakdown-sign is-placeholder" aria-hidden="true">－</div>
                <div class="breakdown-group income">
                  <div class="breakdown-title">収入</div>
                  <div class="breakdown-items">
                    <div class="breakdown-item">
                      <span>入金額</span>
                      <b class="js-cartBreakdownIncome">￥0</b>
                    </div>
                  </div>
                </div>
              </div>
              <div class="breakdown-row">
                <div class="breakdown-sign" aria-hidden="true">－</div>
                <div class="breakdown-group expense">
                  <div class="breakdown-title">支出</div>
                  <div class="breakdown-items">
                    <div class="breakdown-item">
                      <span>仕入れ価格</span>
                      <b class="js-cartBreakdownExpense">￥0</b>
                    </div>
                    <div class="breakdown-item-row">
                      <div class="breakdown-item is-half">
                        <span>送料</span>
                        <b class="js-cartBreakdownShipping">￥0</b>
                      </div>
                      <div class="breakdown-item is-half">
                        <span>関税</span>
                        <b class="js-cartBreakdownTariff">￥0</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="breakdown-operator divider" aria-hidden="true">—</div>
              <div class="breakdown-row">
                <div class="breakdown-sign is-placeholder" aria-hidden="true">－</div>
                <div class="breakdown-group profit">
                  <div class="breakdown-title">粗利</div>
                  <div class="breakdown-items">
                    <div class="breakdown-item highlight">
                      <span>粗利益額(率)</span>
                      <b class="js-cartBreakdownProfit">￥0</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="shop-actions">
              <button class="ghost-btn js-later" type="button">後で仕入れる</button>
              <button class="cart-btn js-addCart" type="button">仕入れリスト</button>
            </div>

            <input class="js-sell" type="hidden" />
          </div>
        </div>

        <div class="l4-keepa l4-block">
          <div class="head">keepaグラフ</div>
          <div class="keepa-mini">
            <img class="keepa-image" src="keepa2graph.png" alt="keepaグラフ" />
          </div>
        </div>

        <div class="l4-mes l4-block">
          <div class="head head-with-score">
            <span>需要供給グラフ（180日）</span>
            <div class="asin-score-meter" style="--asin-score: 62;">
              <span class="asin-score-label">ASINスコア</span>
              <div class="asin-score-track">
                <div class="asin-score-fill"></div>
              </div>
              <span class="asin-score-value">62</span>
            </div>
          </div>

          <div class="graph-options js-graphOptions" style="margin-bottom:10px;">
            <label><input type="radio" name="graph-${asin}" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="radio" name="graph-${asin}" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="mes-big">
            <canvas class="js-chart"></canvas>
          </div>
        </div>
      </div>

    `;
  } else {
    card.innerHTML = isAltLayout
      ? `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <input class="asin-memo" type="text" placeholder="メモ" />
        <button class="memo-save" type="button">保存</button>
      </div>

      <div class="alt-grid">
        <div class="alt-left">
          <div class="alt-image image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>

          <div class="alt-info info-box">
            <div class="info-grid js-infoGrid"></div>
          </div>
        </div>

        <div class="alt-center center-box">
          <div class="center-list js-center"></div>
        </div>

        <div class="alt-graph graph-box">
          <div class="graph-head">
            <div class="graph-title">グラフ（180日）</div>
          </div>

          <div class="graph-options js-graphOptions">
            <label><input type="radio" name="graph-${asin}" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="radio" name="graph-${asin}" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="keepa-wrap js-keepaWrap">
              <img class="keepa-image" src="keepa2graph.png" alt="keepaグラフ" />
            </div>

            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="alt-buy buy-box">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button">カートに入れる</button>
        </div>
      </div>

    `
      : `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <input class="asin-memo" type="text" placeholder="メモ" />
        <button class="memo-save" type="button">保存</button>
      </div>

      <div class="summary-row">
        <div class="left-wrap">
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />

            <div class="field">
              <label>数量</label>
              <select class="js-qty">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>

              <label>販売価格（$）</label>
              <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

              <label>仕入れ額（￥）</label>
              <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

              <button class="cart-btn js-addCart" type="button">カートに入れる</button>
            </div>
          </div>

          <div class="info-box">
            <div class="info-grid js-infoGrid"></div>
          </div>
        </div>

        <div class="center-box">
          <div class="center-list js-center"></div>
        </div>

        <div class="graph-box">
          <div class="graph-head">
            <div class="graph-title">グラフ（180日）</div>
            <div class="switch">
              <button type="button" class="js-btnMes active">MES-AI-A</button>
              <button type="button" class="js-btnKeepa">Keepa</button>
            </div>
          </div>

          <div class="graph-options js-graphOptions">
            <label><input type="radio" name="graph-${asin}" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="radio" name="graph-${asin}" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
            <div class="keepa-wrap js-keepaWrap" style="display:none;">
              <img class="keepa-image" src="keepa2graph.png" alt="keepaグラフ" />
            </div>
          </div>
        </div>
      </div>

    `;
  }

  // inputs
  const sellInput = card.querySelector(".js-sell");
  const costInput = card.querySelector(".js-cost");
  const qtyInput = card.querySelector(".js-qty");
  const shopList = card.querySelector(".js-shopList");
  const extraShopList = card.querySelector(".js-extraShopList");
  const fbaLowestEl = card.querySelector(".js-fbaLowest");

  if (data["販売額（ドル）"]) {
    const s = String(data["販売額（ドル）"]).replace(/[^\d.]/g, "");
    if (s) sellInput.value = s;
  }
  if (fbaLowestEl) {
    const current = data["FBA最安値"];
    const past = data["過去3月FBA最安値"];
    const currentLabel = current == null || current === "" ? "－" : String(current);
    const pastLabel = past == null || past === "" ? "－" : String(past);
    if (currentLabel === "－" && pastLabel === "－") {
      fbaLowestEl.textContent = "－";
    } else {
      fbaLowestEl.textContent = `${currentLabel} (${pastLabel})`;
    }
  }
  if (data["FBA最安値"]) {
    const c = String(data["FBA最安値"]).replace(/[^\d]/g, "");
    if (c) costInput.value = c;
  } else if (data["仕入れ目安単価"]) {
    const c = String(data["仕入れ目安単価"]).replace(/[^\d]/g, "");
    if (c) costInput.value = c;
  }
  if (qtyInput && !qtyInput.value) qtyInput.value = "1";

  if (shopList) {
    const shopCards = shopList.querySelectorAll(".shop-card");
    const yahooAmount = shopCards[1]?.querySelector(".js-shopAmount");
    const rakutenAmount = shopCards[2]?.querySelector(".js-shopAmount");
    if (rakutenAmount && data["日本最安値"]) {
      rakutenAmount.value = String(data["日本最安値"]).replace(/[^\d]/g, "");
    }
    if (yahooAmount && data["日本自己発送最安値"]) {
      yahooAmount.value = String(data["日本自己発送最安値"]).replace(/[^\d]/g, "");
    }
  }

  
  // 変動項目（販売価格 / 粗利益（額+率））
  const varSellEl = card.querySelector(".js-varSell");
  const varProfitCombinedEl = card.querySelector(".js-varProfitCombined");

  const updateVariableMetrics = () => {
    const sellUSD = num(sellInput.value);
    const costJPY = num(costInput.value);
    const shipping = num(data["送料"]);
    const tariff = num(data["関税"]);
    const revenueJPY = sellUSD * FX_RATE;

    if (varSellEl) {
      varSellEl.textContent = sellUSD > 0 ? "$" + sellUSD.toFixed(2) : "－";
    }

    if (sellUSD > 0 && costJPY > 0 && revenueJPY > 0) {
      const profitJPY = revenueJPY - costJPY;
      const marginPct = (profitJPY / revenueJPY) * 100;

      if (varProfitCombinedEl) {
        const p = fmtJPY(Math.round(profitJPY));
        const m = Number.isFinite(marginPct) ? marginPct.toFixed(1) + "%" : "－";
        varProfitCombinedEl.textContent = `${p}（${m}）`;
        const profitCard = varProfitCombinedEl.closest('.center-card');
        if (profitCard) {
          if (profitJPY < 0) profitCard.classList.add('is-negative');
          else profitCard.classList.remove('is-negative');
        }
      }
    } else {
      if (varProfitCombinedEl) varProfitCombinedEl.textContent = "－";
      const profitCard = varProfitCombinedEl ? varProfitCombinedEl.closest('.center-card') : null;
      if (profitCard) profitCard.classList.remove('is-negative');
    }

    updateRedLine(card.__chart, costJPY);
  };

  const updateShopMargins = () => {
    const sellUSD = num(sellInput.value);
    const revenueJPY = sellUSD * FX_RATE;
    const marginEls = card.querySelectorAll(".js-shopMargin");
    marginEls.forEach((el) => {
      const row = el.closest(".shop-card");
      const amountInput = row?.querySelector(".js-cost, .js-shopAmount");
      const costVal = num(amountInput?.value);
      if (revenueJPY > 0 && costVal > 0) {
        const marginPct = ((revenueJPY - costVal) / revenueJPY) * 100;
        el.textContent = `${marginPct.toFixed(1)}%`;
      } else {
        el.textContent = "0%";
      }
    });
  };

  const summaryEl = card.querySelector(".js-asinSummary");
  const summaryQtyEl = summaryEl?.querySelector(".js-summaryQty");
  const summaryAvgEl = summaryEl?.querySelector(".js-summaryAvg");
  const summaryCostEl = summaryEl?.querySelector(".js-summaryCost");
  const summarySalesEl = summaryEl?.querySelector(".js-summarySales");
  const summaryPaymentEl = summaryEl?.querySelector(".js-summaryPayment");
  const summaryProfitEl = summaryEl?.querySelector(".js-summaryProfit");
  const breakdownIncomeEl = card.querySelector(".js-cartBreakdownIncome");
  const breakdownExpenseEl = card.querySelector(".js-cartBreakdownExpense");
  const breakdownShippingEl = card.querySelector(".js-cartBreakdownShipping");
  const breakdownTariffEl = card.querySelector(".js-cartBreakdownTariff");
  const breakdownProfitEl = card.querySelector(".js-cartBreakdownProfit");
  const calcPanel = card.querySelector(".js-calcPanel");
  const unitCostEl = calcPanel?.querySelector(".js-unitCost");
  const totalCostEl = calcPanel?.querySelector(".js-totalCost");
  const unitSalesEl = calcPanel?.querySelector(".js-unitSales");
  const totalSalesEl = calcPanel?.querySelector(".js-totalSales");
  const unitPaymentEl = calcPanel?.querySelector(".js-unitPayment");
  const totalPaymentEl = calcPanel?.querySelector(".js-totalPayment");
  const unitProfitEl = calcPanel?.querySelector(".js-unitProfit");
  const totalProfitEl = calcPanel?.querySelector(".js-totalProfit");
  const shippingEl = calcPanel?.querySelector(".js-shipping");
  const tariffEl = calcPanel?.querySelector(".js-tariff");
  const totalQtyEls = calcPanel?.querySelectorAll(".js-totalQty");
  const formulaPaymentEl = calcPanel?.querySelector(".js-formulaPayment");
  const formulaCostEl = calcPanel?.querySelector(".js-formulaCost");
  const formulaQtyEl = calcPanel?.querySelector(".js-formulaQty");
  const formulaUnitQtyEl = calcPanel?.querySelector(".js-formulaUnitQty");
  const formulaShippingEl = calcPanel?.querySelector(".js-formulaShipping");
  const formulaTariffEl = calcPanel?.querySelector(".js-formulaTariff");
  const formulaProfitEl = calcPanel?.querySelector(".js-formulaProfit");
  const formulaPaymentTotalEl = calcPanel?.querySelector(".js-formulaPaymentTotal");
  const formulaCostTotalEl = calcPanel?.querySelector(".js-formulaCostTotal");
  const formulaShippingTotalEl = calcPanel?.querySelector(".js-formulaShippingTotal");
  const formulaTariffTotalEl = calcPanel?.querySelector(".js-formulaTariffTotal");
  const formulaProfitTotalEl = calcPanel?.querySelector(".js-formulaProfitTotal");
  const calcAvgEl = calcPanel?.querySelector(".js-calcAvg");
  const calcQtyEl = calcPanel?.querySelector(".js-calcQty");
  const calcRateEl = calcPanel?.querySelector(".js-calcRate");

  const updateAsinSummary = () => {
    let totalQty = 0;
    let totalCost = 0;
    const shopCards = card.querySelectorAll(".l4-buy .shop-card");

    shopCards.forEach((shopCard) => {
      const amountInput = shopCard.querySelector(".js-cost, .js-shopAmount");
      const qtyInputEl = shopCard.querySelector(".js-qty, .js-shopQty");
      const amount = num(amountInput?.value);
      const qty = num(qtyInputEl?.value);
      if (qty > 0) {
        totalQty += qty;
        totalCost += amount * qty;
      }
    });

    const sellUSD = num(sellInput.value);
    const totalSalesUSD = sellUSD * totalQty;
    const totalPaymentJPY = totalSalesUSD * FX_RATE;
    const totalProfitJPY = totalPaymentJPY - totalCost;
    const profitRate = totalPaymentJPY > 0 ? (totalProfitJPY / totalPaymentJPY) * 100 : 0;
    const shipping = num(data["送料"]);
    const tariff = num(data["関税"]);
    const totalShipping = shipping * totalQty;
    const totalTariff = tariff * totalQty;
    const totalProfitCalc = totalPaymentJPY - totalCost - totalShipping - totalTariff;
    const profitRateCalc = totalPaymentJPY > 0 ? (totalProfitCalc / totalPaymentJPY) * 100 : 0;

    const avgCost = totalQty > 0 ? Math.round(totalCost / totalQty) : 0;
    if (summaryEl) {
      summaryQtyEl.textContent = totalQty > 0 ? `${totalQty}` : "—";
      summaryAvgEl.textContent = totalQty > 0 ? fmtJPY(avgCost) : "—";
      summaryCostEl.textContent = totalQty > 0 ? fmtJPY(Math.round(totalCost)) : "—";
      summarySalesEl.textContent = totalQty > 0 && sellUSD > 0 ? fmtUSD(totalSalesUSD) : "—";
      summaryPaymentEl.textContent = totalQty > 0 && sellUSD > 0 ? fmtJPY(Math.round(totalPaymentJPY)) : "—";
      summaryProfitEl.textContent =
        totalQty > 0 && sellUSD > 0
          ? `${fmtJPY(Math.round(totalProfitJPY))}（${profitRate.toFixed(1)}%）`
          : "—";
    }

    if (breakdownIncomeEl) {
      breakdownIncomeEl.textContent = fmtJPY(Math.round(totalPaymentJPY));
    }
    if (breakdownExpenseEl) {
      breakdownExpenseEl.textContent = fmtJPY(Math.round(totalCost));
    }
    if (breakdownShippingEl) {
      breakdownShippingEl.textContent = fmtJPY(Math.round(totalShipping));
    }
    if (breakdownTariffEl) {
      breakdownTariffEl.textContent = fmtJPY(Math.round(totalTariff));
    }
    if (breakdownProfitEl) {
      breakdownProfitEl.textContent = `${fmtJPY(Math.round(totalProfitCalc))}(${profitRateCalc.toFixed(1)}%)`;
    }

    if (!calcPanel) return;
    const unitCost = num(costInput.value) || num(data["仕入れ目安単価"]);
    const unitSalesUSD = sellUSD > 0 ? sellUSD : 0;
    const unitPaymentJPY = unitSalesUSD * FX_RATE;
    const unitProfitJPY = unitPaymentJPY - unitCost - shipping - tariff;
    if (totalQtyEls) {
      totalQtyEls.forEach((el) => {
        el.textContent = totalQty > 0 ? `${totalQty}` : "—";
      });
    }
    const qtyLabel = totalQty > 0 ? `${totalQty}個` : "—";
    if (formulaPaymentEl) {
      const paymentLabel = unitPaymentJPY > 0 ? fmtJPY(Math.round(unitPaymentJPY)) : "—";
      formulaPaymentEl.textContent = `入金額${paymentLabel}`;
    }
    if (formulaCostEl) {
      const costLabel = unitCost > 0 ? fmtJPY(Math.round(unitCost)) : "—";
      formulaCostEl.textContent = `仕入れ目安${costLabel}`;
    }
    if (formulaQtyEl) {
      formulaQtyEl.textContent = `合計個数${qtyLabel}`;
    }
    if (formulaUnitQtyEl) {
      formulaUnitQtyEl.textContent = "1";
    }
    if (formulaShippingEl) {
      const shippingLabel = shipping > 0 ? fmtJPY(Math.round(shipping)) : "—";
      formulaShippingEl.textContent = `送料${shippingLabel}`;
    }
    if (formulaTariffEl) {
      const tariffLabel = tariff > 0 ? fmtJPY(Math.round(tariff)) : "—";
      formulaTariffEl.textContent = `関税${tariffLabel}`;
    }
    if (formulaProfitEl) {
      const profitLabel = unitPaymentJPY > 0 ? fmtJPY(Math.round(unitProfitJPY)) : "—";
      formulaProfitEl.textContent = `粗利益額${profitLabel}`;
    }
    if (formulaPaymentTotalEl) {
      const paymentTotalLabel = totalQty > 0 && unitPaymentJPY > 0 ? fmtJPY(Math.round(totalPaymentJPY)) : "—";
      formulaPaymentTotalEl.textContent = `入金額${paymentTotalLabel}`;
    }
    if (formulaCostTotalEl) {
      const costTotalLabel = unitCost > 0 ? fmtJPY(Math.round(unitCost)) : "—";
      formulaCostTotalEl.textContent = `仕入れ目安${costTotalLabel}`;
    }
    if (formulaShippingTotalEl) {
      const shippingTotalLabel = totalShipping > 0 ? fmtJPY(Math.round(totalShipping)) : "—";
      formulaShippingTotalEl.textContent = `送料${shippingTotalLabel}`;
    }
    if (formulaTariffTotalEl) {
      const tariffTotalLabel = totalTariff > 0 ? fmtJPY(Math.round(totalTariff)) : "—";
      formulaTariffTotalEl.textContent = `関税${tariffTotalLabel}`;
    }
    if (formulaProfitTotalEl) {
      const profitTotalLabel = totalQty > 0 && unitPaymentJPY > 0 ? fmtJPY(Math.round(totalProfitCalc)) : "—";
      formulaProfitTotalEl.textContent = `粗利益額${profitTotalLabel}`;
    }
    calcAvgEl.textContent = totalQty > 0 ? fmtJPY(avgCost) : "—";
    calcQtyEl.textContent = totalQty > 0 ? `${totalQty}` : "—";
    calcRateEl.textContent = totalQty > 0 && sellUSD > 0 ? `${profitRateCalc.toFixed(1)}%` : "—";

    if (breakdownProfitEl) {
      breakdownProfitEl.textContent = `${fmtJPY(Math.round(totalProfitCalc))}(${profitRateCalc.toFixed(1)}%)`;
    }
  };

  sellInput.addEventListener("input", () => {
    updateVariableMetrics();
    updateShopMargins();
    updateAsinSummary();
  });
  costInput.addEventListener("input", () => {
    updateVariableMetrics();
    updateShopMargins();
    updateAsinSummary();
  });
  card.querySelectorAll(".js-shopAmount").forEach((input) => {
    input.addEventListener("input", () => {
      updateShopMargins();
      updateAsinSummary();
    });
  });
  card.querySelectorAll(".shop-qty-input, .js-qty").forEach((input) => {
    input.addEventListener("input", updateAsinSummary);
  });
  updateVariableMetrics();
  updateShopMargins();
  updateAsinSummary();

card.querySelector(".js-addCart").addEventListener("click", () => {
    const qty = Math.max(1, Number(qtyInput?.value || 0));
    const sellUSD = num(sellInput.value);
    const costJPY = num(costInput.value);

    if (sellUSD <= 0) return alert("販売価格（$）を入力してください");
    if (costJPY <= 0) return alert("仕入れ額（￥）を入力してください");
    if (qty <= 0) return alert("個数を入力してください");

    cart.set(asin, { qty, sellUSD, costJPY, shipping, tariff });
    updateCartSummary();
  });

  const buildExtraShopRow = () => {
    const row = document.createElement("div");
    row.className = "shop-card is-secondary js-customShop";
    row.innerHTML = `
      <div class="shop-info">
        <input class="shop-name-input js-shopName" type="text" placeholder="ショップ名" />
        <div class="shop-meta">
          <div class="shop-input-wrap">
            <input class="shop-input js-shopAmount" type="number" step="1" placeholder="金額" />
            <span class="shop-unit">円</span>
          </div>
          <span class="shop-margin"><span class="shop-margin-label">粗利益率</span><span class="js-shopMargin">0%</span></span>
        </div>
      </div>
      <div class="shop-qty">
        <span>数量</span>
        <input class="shop-qty-input js-shopQty" type="number" min="0" step="1" value="0" />
      </div>
      <div class="shop-row-actions">
        <button class="shop-add js-addShop" type="button">＋</button>
        <button class="shop-remove" type="button">－</button>
      </div>
    `;

    const amountInput = row.querySelector(".js-shopAmount");
    const qtyInputEl = row.querySelector(".js-shopQty");
    if (amountInput) {
      amountInput.addEventListener("input", () => {
        updateShopMargins();
        updateAsinSummary();
      });
    }
    if (qtyInputEl) qtyInputEl.addEventListener("input", updateAsinSummary);
    return row;
  };

  if (extraShopList) {
    extraShopList.querySelectorAll(".js-shopAmount").forEach((input) => {
      input.addEventListener("input", () => {
        updateShopMargins();
        updateAsinSummary();
      });
    });
    extraShopList.querySelectorAll(".js-shopQty").forEach((input) => {
      input.addEventListener("input", updateAsinSummary);
    });

    extraShopList.addEventListener("click", (event) => {
      const addBtn = event.target.closest(".js-addShop");
      if (addBtn) {
        const row = buildExtraShopRow();
        extraShopList.appendChild(row);
        updateShopMargins();
        updateAsinSummary();
        return;
      }

      const removeBtn = event.target.closest(".shop-remove");
      if (removeBtn) {
        const row = removeBtn.closest(".shop-card");
        if (row?.classList.contains("js-customShop")) row.remove();
        updateAsinSummary();
      }
    });
  }

  // ctx
  const jpAsin = data["日本ASIN"] || "－";
  const usAsin = data["アメリカASIN"] || asin;
  const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
  const volW = data["容積重量"] ?? "";
  const size = data["サイズ"] || "－";
  const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
  const ctx = { asin, jpAsin, usAsin, size, weight, data };

  // info
  if (isThirdLayout) {
    buildInfoGridSplit(card.querySelector(".js-infoGridA"), card.querySelector(".js-infoGridB"), ctx, data);
  } else if (isFourthLayout) {
    const infoTop = card.querySelector(".js-infoTop");
    const infoGrid = card.querySelector(".js-infoGrid");
    const topTokens = [tokI("評価"), tokI("注意事項")];
    const restTokens = zoneState.info.filter((token) => !topTokens.includes(token));
    buildInfoGrid(infoTop, ctx, data, topTokens);
    buildInfoGrid(infoGrid, ctx, data, restTokens);
  } else {
    buildInfoGrid(card.querySelector(".js-infoGrid"), ctx, data);
  }

  // center / table
  if (isFourthLayout) {
    buildCenterCards(card.querySelector(".js-centerCards"), ctx, data);
  } else {
    buildCenterList(card.querySelector(".js-center"), ctx, data);
  }

  // chart
  const canvas = card.querySelector(".js-chart");
  const initialCostJPY = num(costInput.value);
  const priceUSD = num(data["販売額（ドル）"]);
  const chart = renderChart(canvas, {
    redLineUSD: calcBreakEvenUSD(initialCostJPY),
    priceUSD
  });
  card.__chart = chart;

  const chkDS = card.querySelector(".js-chkDS");
  const chkSP = card.querySelector(".js-chkSP");
  const refreshVis = () => updateChartVisibility(chart, chkDS.checked, chkSP.checked);
  chkDS?.addEventListener("change", refreshVis);
  chkSP?.addEventListener("change", refreshVis);
  updateChartVisibility(chart, true, false);
  updateRedLine(chart, initialCostJPY);

  // 通常レイアウトのみ：トグル維持
  if (!isAltLayout && !isThirdLayout && !isFourthLayout) {
    const keepaWrap = card.querySelector(".js-keepaWrap");
    const mesWrap = card.querySelector(".js-mesWrap");
    const graphOptions = card.querySelector(".js-graphOptions");
    const btnMes = card.querySelector(".js-btnMes");
    const btnKeepa = card.querySelector(".js-btnKeepa");

    function setMode(mode) {
      if (mode === "MES") {
        btnMes.classList.add("active");
        btnKeepa.classList.remove("active");
        graphOptions.style.display = "flex";
        mesWrap.style.display = "block";
        keepaWrap.style.display = "none";
      } else {
        btnKeepa.classList.add("active");
        btnMes.classList.remove("active");
        graphOptions.style.display = "none";
        mesWrap.style.display = "none";
        keepaWrap.style.display = "block";
      }
    }
    btnMes.addEventListener("click", () => setMode("MES"));
    btnKeepa.addEventListener("click", () => setMode("KEEPA"));
    setMode("MES");
  }

  return card;
}
