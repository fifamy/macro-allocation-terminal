const state = {
  data: null,
  activeTab: "overview",
  activeFrameworkId: null,
  activeScenarioId: null,
  activeAssetFocus: null,
  reportReviewMode: "all",
  allocationWorkbench: null,
};

const FRAMEWORK_READING_ORDER = [
  "investment-clock",
  "money-credit",
  "money-credit-entity",
  "four-dimensional-macro",
  "leading-indicators",
  "inventory-cycle",
  "pring-six-stage",
  "financial-cycle",
  "juglar-kondratieff",
  "macro-factor-risk-budget",
  "risk-parity",
  "black-litterman",
];

const CHINA_MACRO_ALLOCATION_MODULE = {
  asOf: "2026年4月17日",
  title: "中国宏观配置工作流建议",
  summary:
    "当前更接近“弱复苏向早期扩张过渡”，配置上偏向金融高股息、制造升级和政策受益成长，不建议押注纯顺周期全面反转。",
  facts:
    "LPR维持低位，3月制造业PMI回到50上方，CPI温和回升、PPI由负转正，M2和社融仍高于名义增长，但消费、民间投资和地产链修复偏弱。",
  judgment:
    "更适合配“有政策、有盈利、有估值保护”的行业，少碰“只靠总量刺激才成立”的板块。",
  evidence: [
    { label: "LPR", value: "1Y 3.0%，5Y 3.5%", note: "2026-03-20 持平，货币环境偏宽松但不是继续猛放水。" },
    { label: "PMI", value: "制造业 50.4，非制造业 50.1", note: "2026年3月回到扩张区，景气边际改善。" },
    { label: "CPI / PPI", value: "1.0% / 0.5%", note: "通缩压力缓和，工业价格链条改善。" },
    { label: "M2 / 社融", value: "8.5% / 存量同比 7.9%", note: "流动性仍偏充裕，但不是大水漫灌。" },
    { label: "增长", value: "一季度GDP 5.0%", note: "工业偏强，消费和民间投资恢复相对滞后。" },
  ],
  phases: [
    {
      name: "基准情景",
      probability: "约60%",
      note: "弱复苏向早期扩张过渡。信用仍宽，制造业回暖，PPI转正，高技术制造和基建支撑增长。",
    },
    {
      name: "备选情景",
      probability: "约30%",
      note: "如果消费、地产、民间投资继续拖累，修复会重新回到“生产强、需求弱”的短脉冲。",
    },
  ],
  phaseSwitches: [
    "PMI连续2个月低于50。",
    "PPI再次转负。",
    "社会消费品零售总额持续低于2%附近。",
    "民间投资继续恶化。",
  ],
  sectors: {
    overweight: [
      "银行：低估值、高股息、信用环境不差，兼顾进攻和防守。",
      "券商/保险：如果风险偏好继续修复，最受益于“弱复苏+资本市场活跃”。",
      "电子/半导体：高技术制造业景气更强，政策支持明确。",
      "机械设备/电网设备：制造业升级、设备更新和基建共振。",
      "通信/算力链：政策主题和资本开支方向仍在。",
      "有色金属/黄金：PPI转正、全球商品偏强，同时保留对冲属性。",
    ],
    neutral: [
      "食品饮料：需求恢复偏慢，但龙头有防御性。",
      "医药生物：防御属性仍在，但缺总量弹性。",
      "家电/汽车：有政策支持，更像结构性机会。",
      "公用事业/煤炭/石油石化：防守价值在，但当前不是最强主线。",
    ],
    underweight: [
      "房地产：低利率尚未换来基本面确认，暂不逆势重配。",
      "建筑材料：地产链拖累大于基建拉动。",
      "商贸零售/社会服务/美容护理：居民消费恢复仍弱。",
      "农林牧渔：当前通胀主线不在这里。",
    ],
  },
  portfolio: {
    summary: "默认按30万元、稳健风格、5年期限落地，核心用宽基、债券和现金控波动，卫星用行业表达当前宏观判断。",
    structure: [
      { label: "A股核心宽基/红利", weight: "15%", amount: "4.5万" },
      { label: "A股中盘/制造宽基", weight: "10%", amount: "3.0万" },
      { label: "港股通红利/科技", weight: "5%", amount: "1.5万" },
      { label: "银行", weight: "5%", amount: "1.5万" },
      { label: "电子/半导体", weight: "5%", amount: "1.5万" },
      { label: "机械设备/高端制造", weight: "4%", amount: "1.2万" },
      { label: "券商/保险", weight: "3%", amount: "0.9万" },
      { label: "有色/黄金股", weight: "3%", amount: "0.9万" },
      { label: "国债/政金债", weight: "18%", amount: "5.4万" },
      { label: "中高等级信用债", weight: "8%", amount: "2.4万" },
      { label: "可转债", weight: "6%", amount: "1.8万" },
      { label: "黄金", weight: "5%", amount: "1.5万" },
      { label: "公募REITs", weight: "3%", amount: "0.9万" },
      { label: "现金/货基", weight: "10%", amount: "3.0万" },
    ],
    rules: [
      "单只个股上限5%，单只ETF上限20%，单一行业不超过权益仓位的25%。",
      "再平衡采用“季度检查 + 偏离5%触发”。",
      "如果PMI连续2个月跌回50以下，先减券商、电子、机械，加债和现金。",
    ],
  },
  risks: [
    "最大风险不是通胀，而是内需修复不持续。",
    "如果地产继续弱、民间投资继续负增长，这轮修复更像上游和制造的局部行情，而非全面牛市。",
    "如果PPI重新转负，需要下调有色和制造权重。",
    "如果政策再加码且消费修复更快，当前组合会略偏保守。",
  ],
  tracking: [
    "2026年4月和5月PMI。",
    "2026年4月社融、M2和新增人民币贷款。",
    "核心CPI能否继续维持在1%上方。",
    "PPI能否继续保持正值。",
    "社零、民间投资、房地产销售和新开工是否真正改善。",
  ],
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodePathForHref(value) {
  const raw = String(value ?? "");
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
    return encodeURI(raw);
  }
  return encodeURI(`./${raw}`);
}

function formatInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function renderMarkdownFragment(text) {
  const blocks = String(text || "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) return "";
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines.map((line) => `<li>${formatInlineMarkdown(line.slice(2))}</li>`).join("")}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return `<ol>${lines
          .map((line) => `<li>${formatInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }
      if (lines.some((line) => line.includes("|"))) {
        return `<pre class="framework-pre-block">${escapeHtml(lines.join("\n"))}</pre>`;
      }
      return `<p>${lines.map((line) => formatInlineMarkdown(line)).join("<br />")}</p>`;
    })
    .join("");
}

function tagClassFromView(view) {
  if (view === "超配") return "view-overweight";
  if (view === "低配") return "view-underweight";
  return "view-neutral";
}

function formatSeconds(value) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(2)}s`;
}

function toneClassFromSignal(tone) {
  if (tone === "supportive") return "is-supportive";
  if (tone === "pressured") return "is-pressured";
  if (tone === "watch") return "is-watch";
  return "is-neutral";
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace(/\.0$/, "")}%`;
}

function formatCurrencyCny(value) {
  return `¥${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(Math.round(value || 0))}`;
}

function blackLittermanConfidenceLabel(value) {
  const numeric = clampNumber(Number(value || 0), 2, 10);
  if (numeric >= 8) return "高置信";
  if (numeric >= 6) return "中高置信";
  if (numeric >= 4) return "中性置信";
  return "低置信";
}

function buildAllocationPieChartMarkup(result) {
  const palette = ["#1a3358", "#0f7d6e", "#b5832a", "#cb6a46", "#6e7ff2", "#4c8b9f", "#8d5e8c", "#6b8e23", "#b94a6a"];
  const sleevePalette = {
    equity: "#1a3358",
    bonds: "#0f7d6e",
    alternatives: "#b5832a",
    cash: "#cb6a46",
  };
  const items = (result?.results || []).filter((item) => Number(item.finalWeight || 0) > 0.01);
  if (!items.length) return "";
  const segments = items.map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
    value: clampNumber(Number(item.finalWeight || 0), 0, 100),
  }));
  const sleeveSegments = Object.entries(result?.sleeveMix || {})
    .map(([key, value]) => ({
      key,
      label: result?.sleeveLabels?.[key] || key,
      value: clampNumber(Number(value || 0), 0, 100),
      color: sleevePalette[key] || "#4c8b9f",
      amount: (Number(result?.capital || 0) * Number(value || 0)) / 100,
    }))
    .filter((item) => item.value > 0.01);
  const renderScale = () => `
    <div class="allocation-chart-scale">
      <span>0%</span>
      <span>25%</span>
      <span>50%</span>
      <span>75%</span>
      <span>100%</span>
    </div>
  `;
  return `
    <section class="detail-section allocation-chart-card">
      <div class="allocation-chart-head">
        <div>
          <h4>配置比例图</h4>
          <p>左边看具体资产，右边看权益、债券、另类和现金四大类汇总，更适合汇报和快速比较。</p>
        </div>
      </div>
      <div class="allocation-chart-grid">
        <section class="allocation-chart-panel">
          <div class="allocation-chart-panel-head">
            <h5>具体资产</h5>
            <span>${escapeHtml(`${segments.length} 项`)}</span>
          </div>
          ${renderScale()}
          <div class="allocation-chart-bars">
            ${segments
              .map(
                (item) => `
                  <article class="allocation-chart-bar-row">
                    <div class="allocation-chart-bar-top">
                      <div class="allocation-chart-bar-label">
                        <span class="allocation-chart-swatch" style="background:${item.color};"></span>
                        <strong>${escapeHtml(item.asset_name)}</strong>
                      </div>
                      <div class="allocation-chart-bar-meta">
                        <strong>${escapeHtml(formatPercent(item.finalWeight))}</strong>
                        <span>${escapeHtml(formatCurrencyCny(item.amount))}</span>
                      </div>
                    </div>
                    <div class="allocation-chart-track">
                      <div class="allocation-chart-fill" style="width:${item.value.toFixed(2)}%; background:${item.color};"></div>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
        <section class="allocation-chart-panel">
          <div class="allocation-chart-panel-head">
            <h5>大类汇总</h5>
            <span>${escapeHtml(`${sleeveSegments.length} 层`)}</span>
          </div>
          ${renderScale()}
          <div class="allocation-chart-bars">
            ${sleeveSegments
              .map(
                (item) => `
                  <article class="allocation-chart-bar-row">
                    <div class="allocation-chart-bar-top">
                      <div class="allocation-chart-bar-label">
                        <span class="allocation-chart-swatch" style="background:${item.color};"></span>
                        <strong>${escapeHtml(item.label)}</strong>
                      </div>
                      <div class="allocation-chart-bar-meta">
                        <strong>${escapeHtml(formatPercent(item.value))}</strong>
                        <span>${escapeHtml(formatCurrencyCny(item.amount))}</span>
                      </div>
                    </div>
                    <div class="allocation-chart-track">
                      <div class="allocation-chart-fill" style="width:${item.value.toFixed(2)}%; background:${item.color};"></div>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      </div>
    </section>
  `;
}

function parseWeightBand(text) {
  const match = String(text || "").match(/(\d+(?:\.\d+)?)%\s*-\s*(\d+(?:\.\d+)?)%/);
  if (!match) return { low: 0, high: 0, mid: 0 };
  const low = Number(match[1]);
  const high = Number(match[2]);
  return {
    low,
    high,
    mid: (low + high) / 2,
  };
}

function getAllocationWorkbenchConfig() {
  return state.data?.config?.allocation_workbench || null;
}

function getWorkbenchOption(options, value) {
  return (options || []).find((item) => item.value === value) || (options || [])[0] || null;
}

function initializeAllocationWorkbenchState() {
  if (state.allocationWorkbench) return;
  const config = getAllocationWorkbenchConfig();
  if (!config) return;
  state.allocationWorkbench = JSON.parse(JSON.stringify(config.defaults || {}));
}

function getAllocationWorkbenchRecommendations() {
  const config = getAllocationWorkbenchConfig();
  const current = state.data?.current_view || {};
  const assetMap = new Map((config?.asset_map || []).map((item) => [item.name, item]));
  const calibrationMap = new Map((current.allocation_calibration?.ranking || []).map((item) => [item.asset, item]));
  return (current.allocation_recommendations || [])
    .filter((item) => assetMap.has(item.asset_name))
    .map((item) => ({
      ...item,
      meta: assetMap.get(item.asset_name),
      calibration: item.data_calibration || calibrationMap.get(item.asset_name) || null,
      band: parseWeightBand(item.weight_band),
    }));
}

function buildSleeveTargets(profile, years, macroStance) {
  const sleeves = { ...(profile?.sleeves || {}) };
  const horizonAdjustments =
    years <= 2
      ? { equity: -10, bonds: 6, alternatives: 0, cash: 4 }
      : years <= 4
        ? { equity: -4, bonds: 2, alternatives: 0, cash: 2 }
        : years >= 10
          ? { equity: 8, bonds: -5, alternatives: 0, cash: -3 }
          : years >= 7
            ? { equity: 4, bonds: -2, alternatives: 0, cash: -2 }
            : { equity: 0, bonds: 0, alternatives: 0, cash: 0 };
  const macroAdjustments = macroStance?.adjustments || {};
  const keys = ["equity", "bonds", "alternatives", "cash"];
  keys.forEach((key) => {
    sleeves[key] = Math.max(0, Number(sleeves[key] || 0) + Number(horizonAdjustments[key] || 0) + Number(macroAdjustments[key] || 0));
  });
  const total = keys.reduce((sum, key) => sum + Number(sleeves[key] || 0), 0) || 1;
  return Object.fromEntries(keys.map((key) => [key, (Number(sleeves[key] || 0) / total) * 100]));
}

function buildRecommendationScore(item, homeBias) {
  const viewMultiplier = item.view === "超配" ? 1.16 : item.view === "低配" ? 0.82 : 1;
  const toneMultiplier =
    item.calibration?.tone === "supportive"
      ? 1.08
      : item.calibration?.tone === "watch"
        ? 0.96
        : item.calibration?.tone === "pressured"
          ? 0.88
          : 1;
  const priorityMultiplier = item.calibration?.priority ? 1 + Math.max(0, 5 - Number(item.calibration.priority)) * 0.035 : 1;
  const biasMultiplier = Number(homeBias?.score_overrides?.[item.asset_name] || 1);
  return Math.max(0.1, item.band.mid * viewMultiplier * toneMultiplier * priorityMultiplier * biasMultiplier);
}

function buildReturnAdjustment(item, homeBias, macroStance) {
  const viewAdjustment = item.view === "超配" ? 1 : item.view === "低配" ? -0.9 : 0.2;
  const toneAdjustment =
    item.calibration?.tone === "supportive"
      ? 0.55
      : item.calibration?.tone === "watch"
        ? -0.15
        : item.calibration?.tone === "pressured"
          ? -0.55
          : 0;
  const priorityAdjustment = item.calibration?.priority ? Math.max(0, 5 - Number(item.calibration.priority)) * 0.12 : 0;
  const sleeveAdjustment = Number(macroStance?.adjustments?.[item.meta?.sleeve] || 0) * 0.08;
  const biasAdjustment = Number(homeBias?.score_overrides?.[item.asset_name] || 1) - 1;
  return viewAdjustment + toneAdjustment + priorityAdjustment + sleeveAdjustment + biasAdjustment;
}

function estimateCorrelation(left, right) {
  if (left.asset_name === right.asset_name) return 1;
  const leftSleeve = left.meta?.sleeve;
  const rightSleeve = right.meta?.sleeve;
  if (leftSleeve === rightSleeve) {
    if (leftSleeve === "equity") return 0.7;
    if (leftSleeve === "bonds") return 0.58;
    if (leftSleeve === "alternatives") return 0.46;
    return 0.15;
  }
  const sleeveKey = [leftSleeve, rightSleeve].sort().join("-");
  if (sleeveKey === "bonds-equity") return 0.18;
  if (sleeveKey === "alternatives-equity") return 0.34;
  if (sleeveKey === "alternatives-bonds") return 0.14;
  if (sleeveKey === "cash-equity") return 0.04;
  if (sleeveKey === "bonds-cash") return 0.08;
  if (sleeveKey === "alternatives-cash") return 0.05;
  return 0.12;
}

function projectWeightsToBoundedSimplex(values, lowerBounds, upperBounds, total = 1) {
  const minTotal = lowerBounds.reduce((sum, value) => sum + value, 0);
  const target = Math.max(0, total - minTotal);
  const capacity = upperBounds.map((value, index) => Math.max(0, value - lowerBounds[index]));
  const v = values.map((value, index) => value - lowerBounds[index]);
  let low = Math.min(...v.map((value, index) => value - capacity[index])) - 1;
  let high = Math.max(...v) + 1;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const sum = v.reduce((acc, value, index) => acc + clampNumber(value - mid, 0, capacity[index]), 0);
    if (sum > target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return v.map((value, index) => lowerBounds[index] + clampNumber(value - high, 0, capacity[index]));
}

function computePortfolioStats(items, weights, config) {
  const assumptions = config.asset_assumptions || {};
  const meanVarianceSettings = config.mean_variance_settings || {};
  const expectedReturn = items.reduce((sum, item, index) => {
    const assetAssumption = assumptions[item.asset_name] || {};
    return sum + weights[index] * Number(item.expectedReturn || assetAssumption.expected_return || 0);
  }, 0);
  let variance = 0;
  items.forEach((left, i) => {
    items.forEach((right, j) => {
      const sigmaLeft = Number((assumptions[left.asset_name] || {}).volatility || 0) / 100;
      const sigmaRight = Number((assumptions[right.asset_name] || {}).volatility || 0) / 100;
      variance += weights[i] * weights[j] * sigmaLeft * sigmaRight * estimateCorrelation(left, right);
    });
  });
  const volatility = Math.sqrt(Math.max(variance, 0)) * 100;
  const riskFreeRate = Number(meanVarianceSettings.risk_free_rate || 0);
  return {
    expectedReturn,
    volatility,
    sharpe: volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0,
  };
}

function buildCovarianceMatrix(items, assumptions) {
  return items.map((left) =>
    items.map((right) => {
      const sigmaLeft = Number((assumptions[left.asset_name] || {}).volatility || left.volatility || 0) / 100;
      const sigmaRight = Number((assumptions[right.asset_name] || {}).volatility || right.volatility || 0) / 100;
      return sigmaLeft * sigmaRight * estimateCorrelation(left, right);
    })
  );
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function transposeMatrix(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

function multiplyMatrices(left, right) {
  return left.map((row) =>
    right[0].map((_, colIndex) => row.reduce((sum, value, index) => sum + value * right[index][colIndex], 0))
  );
}

function invertMatrix(matrix) {
  const size = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row.map((value) => Number(value)),
    ...Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < size; col += 1) {
    let pivotRow = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][col]) < 1e-12) {
      return null;
    }
    if (pivotRow !== col) {
      [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];
    }
    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * size; j += 1) {
      augmented[col][j] /= pivot;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * size; j += 1) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }
  return augmented.map((row) => row.slice(size));
}

function getBlackLittermanViews(settings, recommendations, config) {
  const maxViews = Number(config.black_litterman_settings?.max_views || 6);
  const assetNames = new Set(recommendations.map((item) => item.asset_name));
  return (settings.bl_views || [])
    .slice(0, maxViews)
    .map((view) => ({
      type: view.type || "relative",
      asset: view.asset,
      relative_asset: view.relative_asset,
      return_delta: Number(view.return_delta || 0),
      confidence: clampNumber(Number(view.confidence || settings.view_confidence || 6), 2, 10),
    }))
    .filter((view) => assetNames.has(view.asset) && (view.type === "absolute" || assetNames.has(view.relative_asset)));
}

function buildBlackLittermanPosterior(items, priorWeights, settings, riskProfile, config) {
  const assumptions = config.asset_assumptions || {};
  const blSettings = config.black_litterman_settings || {};
  const tau = Number(blSettings.tau || 0.08);
  const covariance = buildCovarianceMatrix(items, assumptions);
  const riskAversion =
    riskProfile?.value === "conservative" ? 3.2 : riskProfile?.value === "growth" ? 2.3 : 2.7;
  const pi = multiplyMatrixVector(covariance, priorWeights).map((value) => value * riskAversion);
  const views = getBlackLittermanViews(settings, items, config);
  if (!views.length) {
    return { posteriorReturns: pi.map((value) => value * 100), viewsApplied: [] };
  }

  const assetIndex = new Map(items.map((item, index) => [item.asset_name, index]));
  const P = views.map((view) => {
    const row = Array.from({ length: items.length }, () => 0);
    row[assetIndex.get(view.asset)] = 1;
    if (view.type === "relative" && view.relative_asset) {
      row[assetIndex.get(view.relative_asset)] = -1;
    }
    return row;
  });
  const Q = views.map((view) => view.return_delta / 100);

  const tauSigma = covariance.map((row) => row.map((value) => value * tau));
  const tauSigmaInv = invertMatrix(tauSigma);
  if (!tauSigmaInv) {
    return { posteriorReturns: pi.map((value) => value * 100), viewsApplied: views };
  }
  const PtauSigma = multiplyMatrices(P, tauSigma);
  const PtauSigmaPt = multiplyMatrices(PtauSigma, transposeMatrix(P));
  const omega = views.map((view, index) => {
    const confidenceScale = (clampNumber(Number(settings.view_confidence || 6), 2, 10) / 10) * (view.confidence / 10);
    const baseVariance = Math.max(PtauSigmaPt[index][index], 1e-6);
    return baseVariance / Math.max(confidenceScale, 0.2);
  });

  const omegaInv = omega.map((value, i) =>
    Array.from({ length: views.length }, (_, j) => (i === j ? 1 / value : 0))
  );
  const Pt = transposeMatrix(P);
  const precision = multiplyMatrices(Pt, multiplyMatrices(omegaInv, P));
  const posteriorPrecision = tauSigmaInv.map((row, i) => row.map((value, j) => value + precision[i][j]));
  const posteriorPrecisionInv = invertMatrix(posteriorPrecision);
  if (!posteriorPrecisionInv) {
    return { posteriorReturns: pi.map((value) => value * 100), viewsApplied: views };
  }
  const leftTerm = multiplyMatrixVector(tauSigmaInv, pi);
  const rightTerm = multiplyMatrixVector(multiplyMatrices(Pt, omegaInv), Q);
  const posteriorMean = multiplyMatrixVector(
    posteriorPrecisionInv,
    leftTerm.map((value, index) => value + rightTerm[index])
  );
  return {
    posteriorReturns: posteriorMean.map((value) => value * 100),
    viewsApplied: views,
  };
}

function computeRegimeBudgetWeights(recommendations, sleeveTargets) {
  const sleeveOrder = ["equity", "bonds", "alternatives", "cash"];
  const rawResults = [];
  sleeveOrder.forEach((sleeve) => {
    const sleeveItems = recommendations.filter((item) => item.meta?.sleeve === sleeve);
    if (!sleeveItems.length) return;
    const target = Number(sleeveTargets[sleeve] || 0);
    const totalScore = sleeveItems.reduce((sum, item) => sum + item.score, 0) || 1;
    sleeveItems.forEach((item) => {
      rawResults.push({
        ...item,
        sleeve,
        rawWeight: (target * item.score) / totalScore,
      });
    });
  });
  return rawResults;
}

function computeStrategicAnchorWeights(recommendations, sleeveTargets) {
  const sleeveOrder = ["equity", "bonds", "alternatives", "cash"];
  const rawResults = [];
  sleeveOrder.forEach((sleeve) => {
    const sleeveItems = recommendations.filter((item) => item.meta?.sleeve === sleeve);
    if (!sleeveItems.length) return;
    const target = Number(sleeveTargets[sleeve] || 0);
    const totalMid = sleeveItems.reduce((sum, item) => sum + item.band.mid, 0) || 1;
    sleeveItems.forEach((item) => {
      rawResults.push({
        ...item,
        sleeve,
        rawWeight: (target * item.band.mid) / totalMid,
      });
    });
  });
  return rawResults;
}

function buildTiltedWeights(baseWeights, lowerBounds, upperBounds, scores, strength, total = 1) {
  const average = scores.reduce((sum, value) => sum + value, 0) / (scores.length || 1);
  const centered = scores.map((value) => value - average);
  const maxAbs = Math.max(...centered.map((value) => Math.abs(value)), 1);
  const tiltScale = (Number(strength || 5) / 10) * 0.12;
  const candidate = baseWeights.map((weight, index) => weight + (centered[index] / maxAbs) * tiltScale * Math.max(weight, 0.04));
  return projectWeightsToBoundedSimplex(candidate, lowerBounds, upperBounds, total);
}

function computeRiskParityWeights(recommendations, sleeveTargets, homeBias, config) {
  const assumptions = config.asset_assumptions || {};
  const settings = config.risk_parity_settings || {};
  const sleeveOrder = ["equity", "bonds", "alternatives"];
  const cashTarget = Math.max(Number(settings.cash_floor || 0), Number(sleeveTargets.cash || 0));
  const investableTarget = Math.max(0, 100 - cashTarget);

  const sleeveWeights = {};
  let sleeveNormalizer = 0;
  sleeveOrder.forEach((sleeve) => {
    const sleeveItems = recommendations.filter((item) => item.meta?.sleeve === sleeve);
    if (!sleeveItems.length) return;
    const averageVol =
      sleeveItems.reduce((sum, item) => sum + Number((assumptions[item.asset_name] || {}).volatility || 12), 0) / sleeveItems.length;
    const riskBudget = Math.max(4, Number(sleeveTargets[sleeve] || 0));
    sleeveWeights[sleeve] = {
      invVolBudget: riskBudget / Math.max(averageVol, 1),
      averageVol,
    };
    sleeveNormalizer += sleeveWeights[sleeve].invVolBudget;
  });

  const rawResults = [];
  sleeveOrder.forEach((sleeve) => {
    const sleeveItems = recommendations.filter((item) => item.meta?.sleeve === sleeve);
    if (!sleeveItems.length) return;
    const sleeveCapital = sleeveNormalizer
      ? (investableTarget * sleeveWeights[sleeve].invVolBudget) / sleeveNormalizer
      : Number(sleeveTargets[sleeve] || 0);
    const cappedSleeveCapital = Math.min(Number(settings.max_sleeve_weight || 60), sleeveCapital);
    const sleeveScores = sleeveItems.map((item) => {
      const vol = Number((assumptions[item.asset_name] || {}).volatility || 12);
      const biasMultiplier = Number(homeBias?.score_overrides?.[item.asset_name] || 1);
      return Math.max(0.1, (item.score * biasMultiplier) / Math.max(vol, 1));
    });
    const totalScore = sleeveScores.reduce((sum, value) => sum + value, 0) || 1;
    sleeveItems.forEach((item, index) => {
      rawResults.push({
        ...item,
        sleeve,
        rawWeight: (cappedSleeveCapital * sleeveScores[index]) / totalScore,
      });
    });
  });

  const cashItems = recommendations.filter((item) => item.meta?.sleeve === "cash");
  if (cashItems.length) {
    const totalScore = cashItems.reduce((sum, item) => sum + item.score, 0) || 1;
    cashItems.forEach((item) => {
      rawResults.push({
        ...item,
        sleeve: "cash",
        rawWeight: (cashTarget * item.score) / totalScore,
      });
    });
  }

  return rawResults;
}

function computeGTAAWeights(recommendations, sleeveTargets, settings, homeBias) {
  const anchorItems = computeStrategicAnchorWeights(recommendations, sleeveTargets);
  const items = recommendations.map((item) => {
    const anchor = anchorItems.find((entry) => entry.asset_name === item.asset_name);
    return {
      ...item,
      sleeve: item.meta?.sleeve,
      anchorWeight: (anchor?.rawWeight || item.band.mid) / 100,
    };
  });
  const weights = buildTiltedWeights(
    items.map((item) => item.anchorWeight),
    items.map((item) => item.band.low / 100),
    items.map((item) => item.band.high / 100),
    items.map((item) => item.score * Number(homeBias?.score_overrides?.[item.asset_name] || 1)),
    settings.tactical_strength,
    1
  );
  return items.map((item, index) => ({
    ...item,
    rawWeight: weights[index] * 100,
    anchorWeight: item.anchorWeight * 100,
  }));
}

function buildFactorBudgets(recommendations, macroStance, config) {
  const exposures = config.asset_factor_exposures || {};
  const factorNames = ["growth", "rate", "credit", "inflation", "safety"];
  const budgets = Object.fromEntries(factorNames.map((name) => [name, 0]));
  recommendations.forEach((item) => {
    const assetExposure = exposures[item.asset_name] || {};
    factorNames.forEach((name) => {
      budgets[name] += item.score * Number(assetExposure[name] || 0);
    });
  });
  const macroMultiplier =
    macroStance?.value === "offensive"
      ? { growth: 1.12, credit: 1.12, rate: 0.92, inflation: 1.04, safety: 0.9 }
      : macroStance?.value === "defensive"
        ? { growth: 0.9, credit: 0.92, rate: 1.1, inflation: 0.96, safety: 1.14 }
        : { growth: 1, credit: 1, rate: 1, inflation: 1, safety: 1 };
  factorNames.forEach((name) => {
    budgets[name] *= Number(macroMultiplier[name] || 1);
  });
  return budgets;
}

function computeMacroFactorBudgetWeights(recommendations, sleeveTargets, settings, macroStance, homeBias, config) {
  const exposures = config.asset_factor_exposures || {};
  const factorBudgets = buildFactorBudgets(recommendations, macroStance, config);
  const anchorItems = computeStrategicAnchorWeights(recommendations, sleeveTargets);
  const items = recommendations.map((item) => {
    const assetExposure = exposures[item.asset_name] || {};
    const factorScore =
      Number(assetExposure.growth || 0) * factorBudgets.growth +
      Number(assetExposure.rate || 0) * factorBudgets.rate +
      Number(assetExposure.credit || 0) * factorBudgets.credit +
      Number(assetExposure.inflation || 0) * factorBudgets.inflation +
      Number(assetExposure.safety || 0) * factorBudgets.safety;
    const anchor = anchorItems.find((entry) => entry.asset_name === item.asset_name);
    return {
      ...item,
      sleeve: item.meta?.sleeve,
      factorScore: factorScore * Number(homeBias?.score_overrides?.[item.asset_name] || 1),
      anchorWeight: (anchor?.rawWeight || item.band.mid) / 100,
    };
  });
  const weights = buildTiltedWeights(
    items.map((item) => item.anchorWeight),
    items.map((item) => item.band.low / 100),
    items.map((item) => item.band.high / 100),
    items.map((item) => item.factorScore),
    settings.factor_tilt_strength,
    1
  );
  return items.map((item, index) => ({
    ...item,
    rawWeight: weights[index] * 100,
    anchorWeight: item.anchorWeight * 100,
    factorBudgets,
  }));
}

function computeBlackLittermanWeights(recommendations, sleeveTargets, settings, homeBias, config) {
  const priorItems = computeStrategicAnchorWeights(recommendations, sleeveTargets);
  const priorMap = new Map(priorItems.map((item) => [item.asset_name, item.rawWeight / 100]));
  const items = recommendations.map((item) => ({
    ...item,
    sleeve: item.meta?.sleeve,
    anchorWeight: priorMap.get(item.asset_name) || item.band.mid / 100,
    expectedReturn: Number((config.asset_assumptions?.[item.asset_name] || {}).expected_return || 0) + buildReturnAdjustment(item, homeBias, null),
  }));
  const posterior = buildBlackLittermanPosterior(items, items.map((item) => item.anchorWeight), settings, null, config);
  const profilePenalty = 1;
  const lambda = 2.8 * profilePenalty;
  const anchorStrength = Number(config.mean_variance_settings?.anchor_strength || 4.2);
  let weights = projectWeightsToBoundedSimplex(
    items.map((item) => item.anchorWeight),
    items.map((item) => item.band.low / 100),
    items.map((item) => item.band.high / 100),
    1
  );
  const posteriorItems = items.map((item, index) => ({
    ...item,
    expectedReturn: posterior.posteriorReturns[index],
  }));
  const covariance = buildCovarianceMatrix(posteriorItems, config.asset_assumptions || {});
  const stepSize = 0.04;
  for (let iter = 0; iter < 120; iter += 1) {
    const gradients = posteriorItems.map((item, index) => {
      let covarianceTerm = 0;
      posteriorItems.forEach((_, j) => {
        covarianceTerm += covariance[index][j] * weights[j];
      });
      return item.expectedReturn / 100 - lambda * covarianceTerm - anchorStrength * (weights[index] - item.anchorWeight);
    });
    const candidate = weights.map((weight, index) => weight + stepSize * gradients[index]);
    weights = projectWeightsToBoundedSimplex(
      candidate,
      posteriorItems.map((item) => item.band.low / 100),
      posteriorItems.map((item) => item.band.high / 100),
      1
    );
  }
  return items.map((item, index) => ({
    ...item,
    rawWeight: weights[index] * 100,
    anchorWeight: item.anchorWeight * 100,
    posteriorReturn: posterior.posteriorReturns[index],
    viewsApplied: posterior.viewsApplied,
  }));
}

function computeGoalsBasedWeights(recommendations, sleeveTargets, settings, macroStance) {
  const safetyFloor = clampNumber(Number(settings.safety_floor_ratio || 35), 10, 70);
  const safetyAssets = new Map([
    ["中国货币/现金", 0.34],
    ["中国利率债", 0.34],
    ["中国信用债", 0.16],
    ["海外债券", 0.1],
    ["美元/外汇", 0.06],
  ]);
  const growthTarget = Math.max(0, 100 - safetyFloor);
  const growthSleeves = {
    equity: Math.max(0, Number(sleeveTargets.equity || 0)) * (growthTarget / 100),
    bonds: Math.max(0, Number(sleeveTargets.bonds || 0) - safetyFloor * 0.7) * (growthTarget / 100),
    alternatives: Math.max(0, Number(sleeveTargets.alternatives || 0)) * (growthTarget / 100),
    cash: 0,
  };
  const growthItems = computeRegimeBudgetWeights(recommendations, growthSleeves);
  const growthMap = new Map(growthItems.map((item) => [item.asset_name, item.rawWeight]));
  return recommendations.map((item) => {
    const safetyWeight = safetyFloor * Number(safetyAssets.get(item.asset_name) || 0);
    return {
      ...item,
      sleeve: item.meta?.sleeve,
      rawWeight: safetyWeight + Number(growthMap.get(item.asset_name) || 0),
      safetyBucketWeight: safetyWeight,
      goalStyle: macroStance?.label || "基准执行",
    };
  });
}

function buildScenarioBandPreference(item, macroStance) {
  const base =
    item.view === "超配"
      ? 0.72
      : item.view === "低配"
        ? 0.28
        : 0.5;
  const toneAdjustment =
    item.calibration?.tone === "supportive"
      ? 0.08
      : item.calibration?.tone === "watch"
        ? -0.02
        : item.calibration?.tone === "pressured"
          ? -0.08
          : 0;
  const priorityAdjustment = item.calibration?.priority ? Math.max(0, 5 - Number(item.calibration.priority)) * 0.025 : 0;
  const sleeve = item.meta?.sleeve;
  const stanceAdjustment =
    macroStance?.value === "offensive"
      ? sleeve === "equity"
        ? 0.06
        : sleeve === "alternatives"
          ? 0.03
          : sleeve === "bonds"
            ? -0.04
            : -0.06
      : macroStance?.value === "defensive"
        ? sleeve === "equity"
          ? -0.06
          : sleeve === "alternatives"
            ? -0.02
            : sleeve === "bonds"
              ? 0.05
              : 0.06
        : 0;
  return clampNumber(base + toneAdjustment + priorityAdjustment + stanceAdjustment, 0.08, 0.92);
}

function computeScenarioBandWeights(recommendations, sleeveTargets, macroStance, homeBias) {
  const anchorItems = computeStrategicAnchorWeights(recommendations, sleeveTargets);
  const anchorMap = new Map(anchorItems.map((item) => [item.asset_name, item.rawWeight / 100]));
  const scenarioShare = macroStance?.value === "offensive" ? 0.72 : macroStance?.value === "defensive" ? 0.58 : 0.65;
  const items = recommendations.map((item) => {
    const scenarioPreference = buildScenarioBandPreference(item, macroStance);
    const bandTarget = item.band.low + (item.band.high - item.band.low) * scenarioPreference;
    return {
      ...item,
      sleeve: item.meta?.sleeve,
      anchorWeight: anchorMap.get(item.asset_name) || item.band.mid / 100,
      scenarioPreference,
      bandTarget,
      desiredWeight: (bandTarget / 100) * Number(homeBias?.score_overrides?.[item.asset_name] || 1),
    };
  });
  const weights = projectWeightsToBoundedSimplex(
    items.map((item) => item.anchorWeight * (1 - scenarioShare) + item.desiredWeight * scenarioShare),
    items.map((item) => item.band.low / 100),
    items.map((item) => item.band.high / 100),
    1
  );
  return items.map((item, index) => ({
    ...item,
    rawWeight: weights[index] * 100,
    anchorWeight: item.anchorWeight * 100,
  }));
}

function computeCoreSatelliteWeights(recommendations, sleeveTargets, settings, riskProfile, macroStance, homeBias) {
  const overlayItems = computeScenarioBandWeights(recommendations, sleeveTargets, macroStance, homeBias);
  const years = clampNumber(Number(settings.horizon_years || 5), 1, 15);
  const baseCoreShare =
    riskProfile?.value === "conservative" ? 0.82 : riskProfile?.value === "growth" ? 0.64 : 0.74;
  const horizonAdjustment =
    years <= 2
      ? 0.06
      : years <= 4
        ? 0.03
        : years >= 10
          ? -0.05
          : years >= 7
            ? -0.03
            : 0;
  const stanceAdjustment = macroStance?.value === "defensive" ? 0.04 : macroStance?.value === "offensive" ? -0.04 : 0;
  const coreShare = clampNumber(baseCoreShare + horizonAdjustment + stanceAdjustment, 0.55, 0.9);
  const satelliteShare = 1 - coreShare;
  const weights = projectWeightsToBoundedSimplex(
    overlayItems.map((item) => (item.anchorWeight / 100) * coreShare + (item.rawWeight / 100) * satelliteShare),
    overlayItems.map((item) => item.band.low / 100),
    overlayItems.map((item) => item.band.high / 100),
    1
  );
  return overlayItems.map((item, index) => ({
    ...item,
    rawWeight: weights[index] * 100,
    coreShare: coreShare * 100,
    satelliteShare: satelliteShare * 100,
    satelliteWeight: (item.rawWeight / 100) * satelliteShare * 100,
  }));
}

function computeMeanVarianceWeights(recommendations, sleeveTargets, settings, riskProfile, macroStance, homeBias, config) {
  const assumptions = config.asset_assumptions || {};
  const meanVarianceSettings = config.mean_variance_settings || {};
  const total = recommendations.length;
  if (!total) return [];
  const anchorItems = computeRegimeBudgetWeights(recommendations, sleeveTargets);
  const anchorMap = new Map(anchorItems.map((item) => [item.asset_name, item.rawWeight / 100]));
  const items = recommendations.map((item) => {
    const assumption = assumptions[item.asset_name] || {};
    return {
      ...item,
      expectedReturn: Number(assumption.expected_return || 0) + buildReturnAdjustment(item, homeBias, macroStance),
      volatility: Number(assumption.volatility || 12),
      anchorWeight: anchorMap.get(item.asset_name) || item.band.mid / 100,
    };
  });
  let weights = projectWeightsToBoundedSimplex(
    items.map((item) => item.anchorWeight),
    items.map((item) => item.band.low / 100),
    items.map((item) => item.band.high / 100),
    1
  );
  const profilePenalty =
    riskProfile?.value === "conservative" ? 1.35 : riskProfile?.value === "growth" ? 0.82 : 1;
  const lambda = clampNumber(Number(settings.risk_aversion || config.defaults?.risk_aversion || 6), 2, 10) * profilePenalty;
  const anchorStrength = Number(meanVarianceSettings.anchor_strength || 4.2);
  const stepSize = 0.045;
  for (let iter = 0; iter < 120; iter += 1) {
    const gradients = items.map((item, index) => {
      let covarianceTerm = 0;
      items.forEach((other, j) => {
        const sigmaLeft = item.volatility / 100;
        const sigmaRight = other.volatility / 100;
        covarianceTerm += estimateCorrelation(item, other) * sigmaLeft * sigmaRight * weights[j];
      });
      return item.expectedReturn / 100 - lambda * covarianceTerm - anchorStrength * (weights[index] - item.anchorWeight);
    });
    const candidate = weights.map((weight, index) => weight + stepSize * gradients[index]);
    weights = projectWeightsToBoundedSimplex(
      candidate,
      items.map((item) => item.band.low / 100),
      items.map((item) => item.band.high / 100),
      1
    );
  }
  const stats = computePortfolioStats(items, weights, config);
  return items.map((item, index) => ({
    ...item,
    sleeve: item.meta?.sleeve,
    rawWeight: weights[index] * 100,
    anchorWeight: item.anchorWeight * 100,
    portfolioStats: stats,
  }));
}

function computeAllocationWorkbenchResult() {
  initializeAllocationWorkbenchState();
  const config = getAllocationWorkbenchConfig();
  const current = state.data?.current_view || {};
  if (!config || !state.allocationWorkbench) return null;
  const settings = state.allocationWorkbench;
  const riskProfile = getWorkbenchOption(config.risk_profiles, settings.risk_profile);
  const macroStance = getWorkbenchOption(config.macro_stances, settings.macro_stance);
  const homeBias = getWorkbenchOption(config.home_biases, settings.home_bias);
  const allocationModel = getWorkbenchOption(config.allocation_models, settings.allocation_model);
  const years = clampNumber(Number(settings.horizon_years || config.defaults.horizon_years || 5), 1, 15);
  const capital = clampNumber(Number(settings.capital || config.defaults.capital || 300000), 50000, 50000000);
  const rebalanceThreshold = clampNumber(Number(settings.rebalance_threshold || config.defaults.rebalance_threshold || 5), 3, 10);
  const sleeveTargets = buildSleeveTargets(riskProfile, years, macroStance);
  const recommendations = getAllocationWorkbenchRecommendations().map((item) => ({
    ...item,
    score: buildRecommendationScore(item, homeBias),
  }));
  const sleeveOrder = ["equity", "bonds", "alternatives", "cash"];
  const rawResults =
    allocationModel?.value === "mean_variance"
      ? computeMeanVarianceWeights(recommendations, sleeveTargets, settings, riskProfile, macroStance, homeBias, config)
      : allocationModel?.value === "risk_parity"
        ? computeRiskParityWeights(recommendations, sleeveTargets, homeBias, config)
        : allocationModel?.value === "gtaa"
          ? computeGTAAWeights(recommendations, sleeveTargets, settings, homeBias)
          : allocationModel?.value === "macro_factor_budget"
            ? computeMacroFactorBudgetWeights(recommendations, sleeveTargets, settings, macroStance, homeBias, config)
            : allocationModel?.value === "black_litterman"
              ? computeBlackLittermanWeights(recommendations, sleeveTargets, settings, homeBias, config)
              : allocationModel?.value === "goals_based"
                ? computeGoalsBasedWeights(recommendations, sleeveTargets, settings, macroStance)
                : allocationModel?.value === "core_satellite"
                  ? computeCoreSatelliteWeights(recommendations, sleeveTargets, settings, riskProfile, macroStance, homeBias)
                  : allocationModel?.value === "scenario_band"
                    ? computeScenarioBandWeights(recommendations, sleeveTargets, macroStance, homeBias)
        : computeRegimeBudgetWeights(recommendations, sleeveTargets);

  const roundLot = Number(config.round_lot || 100);
  const minimumTicket = Number(config.minimum_ticket || 5000);
  const sortedResults = rawResults.sort((a, b) => b.rawWeight - a.rawWeight);
  let roundedTotal = 0;
  sortedResults.forEach((item) => {
    item.amount = Math.round((capital * item.rawWeight) / 100 / roundLot) * roundLot;
    roundedTotal += item.amount;
  });
  if (sortedResults.length) {
    sortedResults[0].amount += capital - roundedTotal;
  }

  sortedResults.forEach((item) => {
    item.finalWeight = capital > 0 ? (item.amount / capital) * 100 : item.rawWeight;
    item.isBelowMinimum = item.amount > 0 && item.amount < minimumTicket;
    item.fitStatus =
      item.finalWeight < item.band.low
        ? "低于参考下沿"
        : item.finalWeight > item.band.high
          ? "高于参考上沿"
          : "处于参考区间";
  });

  const sleeveMix = Object.fromEntries(
    sleeveOrder.map((sleeve) => [
      sleeve,
      sortedResults.filter((item) => item.sleeve === sleeve).reduce((sum, item) => sum + item.finalWeight, 0),
    ])
  );

  const warnings = [];
  const modelMeta = rawResults.length
    ? {
        coreShare: rawResults[0].coreShare ?? null,
        satelliteShare: rawResults[0].satelliteShare ?? null,
      }
    : null;
  if (sortedResults.some((item) => item.isBelowMinimum)) {
    warnings.push(`当前金额下，部分头寸低于 ${formatCurrencyCny(minimumTicket)} 的最低建议建仓额。`);
  }
  if (years <= 2) {
    warnings.push("期限较短，系统已主动下调权益预算并抬升债券和现金。");
  }
  if (macroStance?.value === "offensive") {
    warnings.push("你选择了进取执行，组合会更接近当前宏观判断的上沿表达。");
  }
  if (homeBias?.value === "hedged") {
    warnings.push("你选择了海外对冲，系统会提高海外债券和外汇对冲的相对权重。");
  }
  if (allocationModel?.value === "mean_variance") {
    warnings.push(`当前使用的是约束均值-方差模式，风险厌恶系数为 ${Number(settings.risk_aversion || 6)}。`);
  }
  if (allocationModel?.value === "risk_parity") {
    warnings.push("当前使用风险平价 / 全天候模式，低波动资产会获得更高资金权重，高波动资产更多通过较小仓位贡献风险预算。");
  }
  if (allocationModel?.value === "gtaa") {
    warnings.push(`当前使用 GTAA 模式，战术强度为 ${Number(settings.tactical_strength || 6)}。这更适合中期轮动，不适合当作永久战略中枢。`);
  }
  if (allocationModel?.value === "macro_factor_budget") {
    warnings.push(`当前使用宏观因子风险预算模式，因子倾斜强度为 ${Number(settings.factor_tilt_strength || 6)}。`);
  }
  if (allocationModel?.value === "black_litterman") {
    warnings.push(`当前使用 Black-Litterman 模式，主观观点置信度为 ${Number(settings.view_confidence || 6)}。`);
  }
  if (allocationModel?.value === "goals_based") {
    warnings.push(`当前使用目标导向 / 负债约束模式，安全桶比例为 ${Number(settings.safety_floor_ratio || 35)}%。`);
  }
  if (allocationModel?.value === "core_satellite") {
    warnings.push(
      `当前使用核心-卫星模式，核心仓约 ${formatPercent(modelMeta?.coreShare || 0)}，卫星仓约 ${formatPercent(
        modelMeta?.satelliteShare || 0
      )}。`
    );
  }
  if (allocationModel?.value === "scenario_band") {
    warnings.push("当前使用情景映射 + 区间权重模式，权重更贴近超配 / 中性 / 低配的区间表达，而不是优化器极值解。");
  }

  const stats =
    allocationModel?.value !== "regime_budget"
      ? computePortfolioStats(sortedResults, sortedResults.map((item) => item.finalWeight / 100), config)
      : null;

  return {
    capital,
    years,
    allocationModel,
    riskProfile,
    macroStance,
    homeBias,
    rebalanceThreshold,
    sleeveMix,
    warnings,
    results: sortedResults,
    stats,
    modelMeta,
    currentMacroState: current.current_macro_state || "",
    macroSummary: current.macro_summary || "",
    calibrationSummary: current.allocation_calibration?.summary || "",
    confidence: current.confidence_level || "",
    sleeveLabels: config.sleeve_labels || {},
  };
}

function buildSparklineSvg(values) {
  if (!Array.isArray(values) || values.length < 2) return "";
  const width = 120;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `
    <svg class="macro-signal-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${points}" />
    </svg>
  `;
}

function scoreFromSignalTone(tone) {
  if (tone === "supportive") return 82;
  if (tone === "pressured") return 24;
  if (tone === "watch") return 46;
  return 60;
}

function toneFromScore(score) {
  if (score >= 72) return "supportive";
  if (score >= 54) return "neutral";
  if (score >= 38) return "watch";
  return "pressured";
}

function cockpitLabelFromTone(tone) {
  if (tone === "supportive") return "顺风";
  if (tone === "pressured") return "承压";
  if (tone === "watch") return "观察";
  return "平衡";
}

function validationMetaFromStatus(status) {
  if (status === "基本一致") {
    return { score: 84, tone: "supportive", label: "同步" };
  }
  if (status === "存在分歧") {
    return { score: 44, tone: "watch", label: "分歧" };
  }
  if (status === "明显背离") {
    return { score: 22, tone: "pressured", label: "背离" };
  }
  return { score: 58, tone: "neutral", label: "观察" };
}

function gaugePolarPoint(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function buildGaugeArcPath(cx, cy, radius, startAngle, endAngle) {
  const start = gaugePolarPoint(cx, cy, radius, startAngle);
  const end = gaugePolarPoint(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweepFlag = endAngle >= startAngle ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function buildGaugeTickLines(cx, cy, innerRadius, outerRadius) {
  return Array.from({ length: 25 }, (_, index) => {
    const angle = -120 + index * 10;
    const isMajor = index % 6 === 0;
    const isMid = !isMajor && index % 3 === 0;
    const inner = gaugePolarPoint(cx, cy, isMajor ? innerRadius - 9 : isMid ? innerRadius - 5 : innerRadius, angle);
    const outer = gaugePolarPoint(cx, cy, outerRadius, angle);
    return `
      <line
        class="cockpit-gauge-tick${isMajor ? " is-major" : isMid ? " is-mid" : ""}"
        x1="${inner.x.toFixed(2)}"
        y1="${inner.y.toFixed(2)}"
        x2="${outer.x.toFixed(2)}"
        y2="${outer.y.toFixed(2)}"
      />
    `;
  }).join("");
}

function buildCockpitGauge(score, tone, label, options = {}) {
  const { compact = false } = options;
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const angle = -120 + safeScore * 2.4;
  const gaugeId = `g${Math.random().toString(36).slice(2, 8)}`;
  const cx = 120;
  const cy = 124;
  const outerRadius = 86;
  const bezelRadius = 99;
  const trackRadius = 72;
  const progressRadius = 72;
  const progressPath = buildGaugeArcPath(cx, cy, progressRadius, -120, angle);
  const leftZonePath = buildGaugeArcPath(cx, cy, outerRadius, -120, -40);
  const midZonePath = buildGaugeArcPath(cx, cy, outerRadius, -40, 40);
  const rightZonePath = buildGaugeArcPath(cx, cy, outerRadius, 40, 120);
  const needleTip = gaugePolarPoint(cx, cy, 62, angle);
  const needleTail = gaugePolarPoint(cx, cy, 22, angle + 180);
  const needleLeft = gaugePolarPoint(cx, cy, 11, angle - 92);
  const needleRight = gaugePolarPoint(cx, cy, 11, angle + 92);
  const labelLeft = gaugePolarPoint(cx, cy, 97, -118);
  const labelMid = gaugePolarPoint(cx, cy, 92, 0);
  const labelRight = gaugePolarPoint(cx, cy, 97, 118);
  const reflectionPath = buildGaugeArcPath(cx, cy, 58, -116, -36);
  const bezelPath = buildGaugeArcPath(cx, cy, bezelRadius, -122, 122);
  return `
    <div class="cockpit-gauge${compact ? " is-compact" : ""} ${toneClassFromSignal(tone)}">
      <div class="cockpit-gauge-dial">
        <svg class="cockpit-gauge-svg" viewBox="0 0 240 170" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="${gaugeId}-bezel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.52)" />
              <stop offset="45%" stop-color="rgba(148,163,184,0.22)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0.28)" />
            </linearGradient>
            <linearGradient id="${gaugeId}-progress" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.92)" />
              <stop offset="100%" stop-color="var(--gauge-accent)" />
            </linearGradient>
            <radialGradient id="${gaugeId}-face" cx="50%" cy="44%" r="66%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
              <stop offset="52%" stop-color="rgba(17,24,39,0.95)" />
              <stop offset="100%" stop-color="rgba(5,14,29,0.98)" />
            </radialGradient>
            <linearGradient id="${gaugeId}-hud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
            </linearGradient>
            <filter id="${gaugeId}-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse class="cockpit-gauge-shadow" cx="${cx}" cy="${cy + 18}" rx="72" ry="16" />
          <path class="cockpit-gauge-bezel" d="${bezelPath}" stroke="url(#${gaugeId}-bezel)" />
          <path class="cockpit-gauge-bezel-inner" d="${buildGaugeArcPath(cx, cy, 92, -120, 120)}" />
          <circle class="cockpit-gauge-face-disc" cx="${cx}" cy="${cy}" r="66" fill="url(#${gaugeId}-face)" />
          <path class="cockpit-gauge-reflection" d="${reflectionPath}" />
          <path class="cockpit-gauge-zone is-low" d="${leftZonePath}" />
          <path class="cockpit-gauge-zone is-mid" d="${midZonePath}" />
          <path class="cockpit-gauge-zone is-high" d="${rightZonePath}" />
          <path class="cockpit-gauge-track" d="${buildGaugeArcPath(cx, cy, trackRadius, -120, 120)}" />
          <path class="cockpit-gauge-progress" d="${progressPath}" stroke="url(#${gaugeId}-progress)" filter="url(#${gaugeId}-glow)" />
          <g class="cockpit-gauge-ticks">${buildGaugeTickLines(cx, cy, 66, 77)}</g>
          <text class="cockpit-gauge-mark" x="${labelLeft.x.toFixed(2)}" y="${labelLeft.y.toFixed(2)}">0</text>
          <text class="cockpit-gauge-mark" x="${labelMid.x.toFixed(2)}" y="${labelMid.y.toFixed(2)}">50</text>
          <text class="cockpit-gauge-mark" x="${labelRight.x.toFixed(2)}" y="${labelRight.y.toFixed(2)}">100</text>
          <line class="cockpit-gauge-tail-line" x1="${cx}" y1="${cy}" x2="${needleTail.x.toFixed(2)}" y2="${needleTail.y.toFixed(2)}" />
          <path
            class="cockpit-gauge-needle-fill"
            d="M ${needleLeft.x.toFixed(2)} ${needleLeft.y.toFixed(2)} L ${needleTip.x.toFixed(2)} ${needleTip.y.toFixed(2)} L ${needleRight.x.toFixed(2)} ${needleRight.y.toFixed(2)} Z"
          />
          <line class="cockpit-gauge-needle-line" x1="${cx}" y1="${cy}" x2="${needleTip.x.toFixed(2)}" y2="${needleTip.y.toFixed(2)}" />
          <rect class="cockpit-gauge-hud" x="86" y="143" rx="8" ry="8" width="68" height="14" fill="url(#${gaugeId}-hud)" />
          <text class="cockpit-gauge-hud-text" x="120" y="153">${escapeHtml(label)}</text>
          <circle class="cockpit-gauge-hub-ring" cx="${cx}" cy="${cy}" r="12" />
          <circle class="cockpit-gauge-hub" cx="${cx}" cy="${cy}" r="7" />
        </svg>
      </div>
      <div class="cockpit-gauge-readout">
        <strong>${safeScore}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}

function getMacroSignalMap() {
  const map = new Map();
  (state.data.macro_dashboard?.themes || []).forEach((theme) => {
    (theme.signals || []).forEach((signal) => {
      map.set(signal.id, signal);
    });
  });
  return map;
}

function getDataDrivenCycleMap() {
  return new Map((state.data.macro_dashboard?.data_driven_view?.cycle_cards || []).map((item) => [item.label, item]));
}

function buildOverviewCockpitModels() {
  const signalMap = getMacroSignalMap();
  const cycleMap = getDataDrivenCycleMap();
  const commodityPulse = signalMap.get("NH_COMMODITY");
  const inflationVerdict =
    commodityPulse?.signal_tone === "watch"
      ? "低通胀，留意再通胀脉冲"
      : "通胀整体温和";
  const inflationNote =
    commodityPulse?.signal_tone === "watch"
      ? "CPI 和 PPI 仍温和，但商品价格已给出再通胀提示。"
      : "居民和工业品价格都没有进入高通胀压力区间。";

  const configs = [
    {
      key: "growth",
      title: "增长模型",
      kicker: "景气 + 总量",
      verdict: cycleMap.get("增长周期")?.value || "增长待确认",
      note: cycleMap.get("增长周期")?.note || "先看 PMI 扩张能否继续传导到季度总量。",
      signalIds: ["PMI_MFG", "PMI_NEW_ORDER", "GDP_YoY"],
    },
    {
      key: "inflation",
      title: "通胀模型",
      kicker: "CPI + PPI + 商品",
      verdict: inflationVerdict,
      note: inflationNote,
      signalIds: ["CPI_YoY", "PPI_YoY", "NH_COMMODITY"],
    },
    {
      key: "liquidity",
      title: "流动性模型",
      kicker: "资金 + 利率",
      verdict: "流动性偏宽",
      note: "短端资金利率贴近政策锚，利率债底仓环境仍友好。",
      signalIds: ["DR007", "OMO_7D", "CGB_10Y"],
    },
    {
      key: "credit",
      title: "信用模型",
      kicker: "利差 + 活化 + 投放",
      verdict: cycleMap.get("货币信用")?.value || "信用修复早期",
      note: cycleMap.get("货币信用")?.note || "利差先修复，但实体与活化仍需要继续确认。",
      signalIds: ["CREDIT_SPREAD_AAA_3Y", "M1_YoY", "CORP_MLT_LOAN_NEW"],
    },
    {
      key: "risk",
      title: "风险偏好模型",
      kicker: "权益 + 估值",
      verdict: "风险偏好边际回暖",
      note: "股票价格已有修复，但估值不算极低，更适合结构进攻。",
      signalIds: ["CSI500", "HSI", "CSI300_PE"],
    },
  ];

  return configs
    .map((config) => {
      const signals = config.signalIds.map((id) => signalMap.get(id)).filter(Boolean);
      if (!signals.length) return null;
      const score = Math.round(
        signals.reduce((sum, signal) => sum + scoreFromSignalTone(signal.signal_tone), 0) / signals.length
      );
      const tone = toneFromScore(score);
      return {
        ...config,
        signals,
        score,
        tone,
        toneLabel: cockpitLabelFromTone(tone),
      };
    })
    .filter(Boolean);
}

function ensureOverviewCockpitMount() {
  const panel = document.getElementById("panel-overview");
  if (!panel) return null;

  let shell = document.getElementById("overview-cockpit-card");
  if (!shell) {
    shell = document.createElement("section");
    shell.id = "overview-cockpit-card";
    shell.className = "card overview-cockpit-card-shell";
    shell.innerHTML = `
      <div class="section-head overview-cockpit-head">
        <div>
          <h2>宏观驾驶舱</h2>
          <p>把增长、通胀、流动性、信用和风险偏好拆成几个主仪表，先看状态，再看支撑这些判断的关键指标。</p>
        </div>
      </div>
      <div id="overview-cockpit-root"></div>
    `;
    const anchor = panel.querySelector(".overview-grid");
    if (anchor) {
      anchor.insertAdjacentElement("afterend", shell);
    } else {
      panel.prepend(shell);
    }
  }

  return shell.querySelector("#overview-cockpit-root");
}

function renderOverviewCockpit() {
  const root = ensureOverviewCockpitMount();
  if (!root) return;

  const current = state.data.current_view;
  const models = buildOverviewCockpitModels();
  if (!models.length) {
    root.innerHTML = `
      <section class="macro-dashboard-empty">
        <p>首页驾驶舱需要宏观信号数据后才能生成。</p>
      </section>
    `;
    return;
  }

  const overallScore = Math.round(models.reduce((sum, item) => sum + item.score, 0) / models.length);
  const overallTone = toneFromScore(overallScore);
  const validationStatus = current.data_validation?.status || "人工判断主导";
  const validationMeta = validationMetaFromStatus(current.data_validation?.status);
  const regimeTags = (current.current_regime_labels || []).slice(0, 6);
  const priorityAssets = (current.allocation_calibration?.ranking || []).slice(0, 4);
  const validationEvidence = (current.data_validation?.evidence || []).slice(0, 3);

  root.innerHTML = `
    <div class="overview-cockpit-layout">
      <article class="overview-cockpit-hero">
        <div class="overview-cockpit-gauge-column">
          <div class="overview-cluster-gauge-card">
            <div class="overview-cluster-caption">宏观温度</div>
            ${buildCockpitGauge(overallScore, overallTone, cockpitLabelFromTone(overallTone))}
            <div class="overview-cluster-foot">5 个模型综合后的当前温度。</div>
          </div>

          <div class="overview-cluster-gauge-card is-secondary">
            <div class="overview-cluster-caption">数据一致性</div>
            ${buildCockpitGauge(validationMeta.score, validationMeta.tone, validationMeta.label)}
            <div class="overview-cluster-foot">${escapeHtml(current.data_validation?.summary || "等待数据校验结果。")}</div>
          </div>
        </div>

        <div class="overview-cockpit-copy">
          <div class="overview-cockpit-kicker">Macro Engine</div>
          <h3>${escapeHtml(current.current_macro_state || "")}</h3>
          <p>${escapeHtml(current.macro_state_note || current.macro_summary || "")}</p>

          <div class="overview-cockpit-bridge-grid">
            <div class="overview-cockpit-panel">
              <div class="overview-cockpit-panel-label">运行状态</div>
              <div class="overview-cockpit-meta">
                <div class="overview-cockpit-meta-item">
                  <span>截至</span>
                  <strong>${escapeHtml(current.as_of_date || "—")}</strong>
                </div>
                <div class="overview-cockpit-meta-item">
                  <span>置信度</span>
                  <strong>${escapeHtml(current.confidence_level || "—")}</strong>
                </div>
                <div class="overview-cockpit-meta-item">
                  <span>校验状态</span>
                  <strong>${escapeHtml(validationStatus)}</strong>
                </div>
              </div>
            </div>

            <div class="overview-cockpit-panel">
              <div class="overview-cockpit-panel-label">当前主线</div>
              <div class="overview-cockpit-chip-row">
                ${regimeTags.map((item) => `<span class="overview-cockpit-chip">${escapeHtml(item)}</span>`).join("")}
              </div>
            </div>
          </div>

          <div class="overview-cockpit-lights">
            ${models
              .map(
                (item) => `
                  <div class="overview-cockpit-light ${toneClassFromSignal(item.tone)}">
                    <span>${escapeHtml(item.title.replace("模型", ""))}</span>
                    <strong>${escapeHtml(item.toneLabel)}</strong>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="overview-cockpit-strip-grid">
            <div class="overview-cockpit-strip-card">
              <div class="overview-cockpit-panel-label">优先资产</div>
              <div class="overview-cockpit-priority-list">
                ${priorityAssets
                  .map(
                    (item) => `
                      <div class="overview-cockpit-priority-item">
                        <span class="overview-cockpit-priority-rank">P${escapeHtml(item.priority)}</span>
                        <div>
                          <strong>${escapeHtml(item.asset)}</strong>
                          <span>${escapeHtml(item.label)}</span>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>

            <div class="overview-cockpit-strip-card">
              <div class="overview-cockpit-panel-label">数据锚点</div>
              <div class="overview-cockpit-evidence-list">
                ${validationEvidence.map((item) => `<div class="overview-cockpit-evidence-item">${escapeHtml(item)}</div>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </article>

      <div class="overview-cockpit-model-grid">
        ${models
          .map(
            (item) => `
              <article class="overview-model-card">
                <div class="overview-model-head">
                  <div>
                    <div class="overview-model-kicker">${escapeHtml(item.kicker)}</div>
                    <h3>${escapeHtml(item.title)}</h3>
                  </div>
                  <span class="overview-model-status ${toneClassFromSignal(item.tone)}">${escapeHtml(item.toneLabel)}</span>
                </div>
                <div class="overview-model-body">
                  <div class="overview-model-summary">
                    <div class="overview-model-panel">
                      <div class="overview-model-panel-label">模型结论</div>
                      <div class="overview-model-verdict">${escapeHtml(item.verdict)}</div>
                      <div class="overview-model-note">${escapeHtml(item.note)}</div>
                    </div>
                  </div>
                  <div class="overview-model-meter">
                    <div class="overview-model-meter-label">模型评分</div>
                    ${buildCockpitGauge(item.score, item.tone, item.toneLabel, { compact: true })}
                  </div>
                </div>
                <div class="overview-model-indicator-list">
                  ${item.signals
                    .map(
                      (signal) => `
                        <div class="overview-indicator-row">
                          <div class="overview-indicator-main">
                            <span class="overview-indicator-name">${escapeHtml(signal.display_name)}</span>
                            <strong>${escapeHtml(signal.latest_value)}</strong>
                          </div>
                          <div class="overview-indicator-side">
                            <span class="overview-indicator-badge ${toneClassFromSignal(signal.signal_tone)}">${escapeHtml(signal.signal_label)}</span>
                            <span>${escapeHtml(signal.latest_date)}</span>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderPathCard(path, options = {}) {
  if (!path || !path.steps?.length) return "";
  const { pathKey = "manual", cardClass = "" } = options;
  return `
    <div class="research-path-card ${cardClass}">
      <div class="research-path-head">
        <span class="research-path-kicker">${escapeHtml(path.title || "研究路径")}</span>
        <p>${escapeHtml(path.note || "")}</p>
      </div>
      ${
        path.status
          ? `<div class="research-path-status">${escapeHtml(path.status)}</div>`
          : ""
      }
      <div class="research-path-flow">
        ${path.steps
          .map((item, index) => {
            const label = typeof item === "string" ? item : item.label;
            const isLast = index === path.steps.length - 1;
            return `
              <button class="research-path-node is-clickable" type="button" data-path-key="${escapeHtml(pathKey)}" data-path-step="${index}">${escapeHtml(label)}</button>
              ${isLast ? "" : '<span class="research-path-sep" aria-hidden="true">→</span>'}
            `;
          })
          .join("")}
      </div>
      ${
        path.linked_scenario_title
          ? `<div class="research-path-foot">对应研究情景：<strong>${escapeHtml(path.linked_scenario_title)}</strong></div>`
          : ""
      }
    </div>
  `;
}

function getExternalReportById(reportId) {
  return (state.data.external_reports?.reports || []).find((item) => item.id === reportId) || null;
}

function getLinkedReports(indexKey, title, limit = 3) {
  const reportIds = state.data.external_reports?.indexes?.[indexKey]?.[title] || [];
  return reportIds.map((reportId) => getExternalReportById(reportId)).filter(Boolean).slice(0, limit);
}

function getReportReviewMeta(status) {
  if (status === "reviewed") {
    return { label: "已校正", className: "review-reviewed" };
  }
  if (status === "needs_source_fix") {
    return { label: "待修复", className: "review-needs-fix" };
  }
  if (status) {
    return { label: "未校正", className: "review-unreviewed" };
  }
  return null;
}

function getVisibleReports(reports) {
  if (state.reportReviewMode !== "reviewed") return reports;
  return reports.filter((report) => report.review_status === "reviewed");
}

function renderReportReviewFilter() {
  const container = document.getElementById("report-review-filter");
  if (!container) return;
  const options = [
    { value: "all", label: "全部报告" },
    { value: "reviewed", label: "仅已校正" },
  ];
  container.innerHTML = options
    .map(
      (option) => `
        <button
          type="button"
          class="review-filter-button${state.reportReviewMode === option.value ? " is-active" : ""}"
          data-report-review-mode="${escapeHtml(option.value)}"
          aria-pressed="${state.reportReviewMode === option.value ? "true" : "false"}"
        >${escapeHtml(option.label)}</button>
      `
    )
    .join("");
}

function syncTopbarOffset() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const height = Math.ceil(topbar.getBoundingClientRect().height || 60);
  document.documentElement.style.setProperty("--topbar-offset", `${height}px`);
}

function initTopbarOffsetObserver() {
  syncTopbarOffset();
  window.addEventListener("resize", syncTopbarOffset);
  const topbar = document.querySelector(".topbar");
  if (!topbar || typeof ResizeObserver === "undefined") return;
  const observer = new ResizeObserver(() => syncTopbarOffset());
  observer.observe(topbar);
}

function rerenderReportViews() {
  renderOverview();
  renderFrameworks();
  renderScenarios();
  renderAssets();
  renderHistory();
  renderMethods();
  renderReportReviewFilter();
}

function setReportReviewMode(mode) {
  if (!["all", "reviewed"].includes(mode) || state.reportReviewMode === mode) return;
  state.reportReviewMode = mode;
  rerenderReportViews();
}

function renderReportSupportBlock(reports, options = {}) {
  const { showCharts = false, showKnowledge = false, compact = false } = options;
  if (!reports.length) return "";
  const visibleReports = getVisibleReports(reports);
  if (!visibleReports.length) {
    return `
      <div class="linked-report-empty">
        当前筛选下暂无已校正报告。
      </div>
    `;
  }
  return `
    <div class="linked-report-list${compact ? " is-compact" : ""}">
      ${visibleReports
        .map((report) => {
          const preview = showCharts ? report.top_pages?.[0] : null;
          const benchmarkSeconds =
            report.timing?.benchmark_total_seconds ?? report.timing?.total_seconds ?? 0;
          const reviewMeta = getReportReviewMeta(report.review_status);
          return `
            <article class="linked-report-item-card">
              <div class="linked-report-meta">${escapeHtml([report.date, report.institution].filter(Boolean).join(" · ") || "本地报告")} · ${escapeHtml(formatSeconds(benchmarkSeconds))}</div>
              <div class="linked-report-title">${escapeHtml(report.title)}</div>
              <div class="linked-report-note">${escapeHtml(report.summary || "")}</div>
              ${
                preview
                  ? `
                    <div class="linked-report-preview">
                      <img src="${encodePathForHref(preview.image_path)}" alt="${escapeHtml(preview.label || report.title)}" loading="lazy" />
                      <div class="linked-report-preview-note">${escapeHtml(`P${preview.page_number} · ${preview.label || "关键图表页"}`)}</div>
                    </div>
                  `
                  : ""
              }
              <div class="history-meta">
                ${
                  reviewMeta
                    ? `<span class="meta-pill ${escapeHtml(reviewMeta.className)}">${escapeHtml(reviewMeta.label)}</span>`
                    : ""
                }
                ${(report.framework_matches || []).slice(0, 2).map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("")}
                ${(report.scenario_matches || []).slice(0, 2).map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("")}
              </div>
              ${
                report.review_notes
                  ? `<div class="linked-report-review-note">${escapeHtml(report.review_notes)}</div>`
                  : ""
              }
              ${
                showKnowledge && report.new_knowledge_points?.length
                  ? `
                    <div class="linked-report-knowledge">
                      ${report.new_knowledge_points
                        .slice(0, 2)
                        .map((item) => `<span class="meta-pill">${escapeHtml(item.name)}</span>`)
                        .join("")}
                    </div>
                  `
                  : ""
              }
              <div class="linked-report-actions">
                <a class="report-link-button minor" href="${encodePathForHref(report.source_pdf_path)}" target="_blank" rel="noreferrer">打开原 PDF</a>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function getBundle() {
  if (window.__MACRO_ALLOCATION_BUNDLE__) {
    return Promise.resolve(window.__MACRO_ALLOCATION_BUNDLE__);
  }
  return fetch("./data/macro_allocation_bundle.json").then((resp) => resp.json());
}

function clearAssetFocusIfNeeded() {
  if (!state.activeAssetFocus) return;
  state.activeAssetFocus = null;
  renderAssets();
}

function setActiveTab(tabId, options = {}) {
  const { preserveAssetFocus = false, focusTab = false } = options;
  if (!preserveAssetFocus) {
    clearAssetFocusIfNeeded();
  }
  state.activeTab = tabId;
  document.querySelectorAll(".tab").forEach((item) => {
    const isActive = item.dataset.tab === tabId;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
    item.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive && focusTab) {
      item.focus();
    }
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    const isActive = panel.id === `panel-${tabId}`;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
}

function initTabs() {
  const tabs = state.data.config.tabs;
  document.getElementById("main-tabs").innerHTML = tabs
    .map(
      (tab) =>
        `<button
          class="tab${tab.id === state.activeTab ? " is-active" : ""}"
          id="tab-${escapeHtml(tab.id)}"
          type="button"
          role="tab"
          aria-selected="${tab.id === state.activeTab ? "true" : "false"}"
          aria-controls="panel-${escapeHtml(tab.id)}"
          tabindex="${tab.id === state.activeTab ? "0" : "-1"}"
          data-tab="${escapeHtml(tab.id)}"
        >${escapeHtml(tab.label)}</button>`
    )
    .join("");
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    button.addEventListener("keydown", (event) => {
      const { key } = event;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
      if (key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (key === "Home") nextIndex = 0;
      if (key === "End") nextIndex = tabButtons.length - 1;
      const nextTab = tabButtons[nextIndex];
      setActiveTab(nextTab.dataset.tab, { focusTab: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderHero() {
  const current = state.data.current_view;
  document.getElementById("hero-date").textContent = current.as_of_date;
  document.getElementById("hero-confidence").textContent = current.confidence_level;
  document.getElementById("hero-summary").textContent = current.macro_summary;
  document.getElementById("hero-state").textContent = current.current_macro_state || "—";
  document.getElementById("hero-domestic").textContent = current.domestic_view || "—";
  document.getElementById("hero-overseas").textContent = current.overseas_view || "—";
  document.getElementById("hero-validation").innerHTML = current.data_validation
    ? `
      <div class="hero-validation-card">
        <div class="hero-validation-top">
          <span class="hero-validation-kicker">数据校验</span>
          <span class="hero-validation-status ${
            current.data_validation.status === "基本一致"
              ? "is-supportive"
              : current.data_validation.status === "明显背离"
                ? "is-pressured"
                : "is-watch"
          }">${escapeHtml(current.data_validation.status)}</span>
        </div>
        <div class="hero-validation-text">${escapeHtml(current.data_validation.summary || "")}</div>
      </div>
    `
    : "";
  document.getElementById("hero-regimes").innerHTML = current.current_regime_labels
    .map((item, index) => {
      const colors = ["blue", "red", "gold", "green"];
      return `<span class="tag ${colors[index % colors.length]}">${escapeHtml(item)}</span>`;
    })
    .join("");
  document.getElementById("current-summary-points").innerHTML = `<div class="point-list">${current.key_drivers
    .map((item) => `<div class="point-item">${escapeHtml(item)}</div>`)
    .join("")}</div>`;
  document.getElementById("current-risk-points").innerHTML = `<div class="point-list">${current.risk_factors
    .map((item) => `<div class="point-item">${escapeHtml(item)}</div>`)
    .join("")}</div>`;
}

function renderDataDrivenView() {
  const root = document.getElementById("overview-data-driven-view");
  if (!root) return;
  const view = state.data.macro_dashboard?.data_driven_view;
  if (!view) {
    root.innerHTML = "";
    return;
  }

  root.innerHTML = `
    <section class="data-driven-view">
      <div class="data-driven-hero">
        <div>
          <div class="data-driven-kicker">As Of ${escapeHtml(view.as_of_date || "")}</div>
          <div class="data-driven-headline">${escapeHtml(view.headline || "")}</div>
          <div class="data-driven-summary">${escapeHtml(view.summary || "")}</div>
        </div>
        <div class="data-driven-tags">
          ${(view.regime_tags || []).map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>

      <div class="data-driven-cycle-grid">
        ${(view.cycle_cards || [])
          .map(
            (item) => `
              <article class="data-driven-cycle-card">
                <div class="data-driven-cycle-label">${escapeHtml(item.label)}</div>
                <div class="data-driven-cycle-value">${escapeHtml(item.value)}</div>
                <div class="data-driven-cycle-note">${escapeHtml(item.note || "")}</div>
                ${
                  item.scenario_id
                    ? `<button class="data-driven-scenario-link" type="button" data-data-scenario="${escapeHtml(item.scenario_id)}">查看对应情景</button>`
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </div>

      <div class="data-driven-lower">
        <div class="data-driven-block">
          <h3>关键证据</h3>
          <ul class="data-driven-list">
            ${(view.evidence || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        <div class="data-driven-block">
          <h3>资产含义</h3>
          <div class="data-driven-implication-list">
            ${(view.implications || [])
              .map(
                (item) => `
                  <article class="data-driven-implication-card">
                    <div class="data-driven-implication-top">
                      <span class="data-driven-asset">${escapeHtml(item.asset)}</span>
                      <span class="data-driven-asset-view">${escapeHtml(item.view)}</span>
                    </div>
                    <div class="data-driven-implication-note">${escapeHtml(item.reason || "")}</div>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;

  root.querySelectorAll("[data-data-scenario]").forEach((node) => {
    node.addEventListener("click", () => {
      const scenarioId = node.dataset.dataScenario;
      if (!scenarioId) return;
      state.activeScenarioId = scenarioId;
      renderScenarios();
      setActiveTab("scenarios");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderChinaMacroAllocationModule() {
  const root = document.getElementById("china-macro-allocation-module");
  if (!root) return;
  const module = CHINA_MACRO_ALLOCATION_MODULE;
  root.innerHTML = `
    <section class="section-head china-macro-allocation-head">
      <div>
        <h2>${escapeHtml(module.title)}</h2>
        <p>把最新中国宏观判断、行业轮动和组合建议压缩成一个独立研究模块，便于首页直接查看。</p>
      </div>
      <div class="china-macro-allocation-asof">截至 ${escapeHtml(module.asOf)}</div>
    </section>

    <section class="china-macro-allocation-hero">
      <div class="china-macro-allocation-kicker">China Macro Allocation</div>
      <h3>${escapeHtml(module.summary)}</h3>
      <div class="china-macro-allocation-copy-grid">
        <article class="china-macro-copy-card">
          <span>数据事实</span>
          <p>${escapeHtml(module.facts)}</p>
        </article>
        <article class="china-macro-copy-card">
          <span>配置判断</span>
          <p>${escapeHtml(module.judgment)}</p>
        </article>
      </div>
    </section>

    <section class="china-macro-allocation-section">
      <div class="china-macro-section-head">
        <h3>核心证据</h3>
        <p>把关键月度和季度指标压缩成可直接讨论的配置锚点。</p>
      </div>
      <div class="china-macro-evidence-grid">
        ${module.evidence
          .map(
            (item) => `
              <article class="china-macro-evidence-card">
                <div class="china-macro-evidence-top">
                  <span class="china-macro-evidence-label">${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.value)}</strong>
                </div>
                <p>${escapeHtml(item.note)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="china-macro-allocation-section">
      <div class="china-macro-section-head">
        <h3>周期阶段</h3>
        <p>当前以基准情景为主，同时保留切换条件。</p>
      </div>
      <div class="china-macro-phase-grid">
        ${module.phases
          .map(
            (item) => `
              <article class="china-macro-phase-card">
                <div class="china-macro-phase-top">
                  <span>${escapeHtml(item.name)}</span>
                  <strong>${escapeHtml(item.probability)}</strong>
                </div>
                <p>${escapeHtml(item.note)}</p>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="china-macro-trigger-card">
        <div class="china-macro-trigger-title">情景切换指标</div>
        <ul class="bullet-list">
          ${module.phaseSwitches.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </section>

    <section class="china-macro-allocation-section">
      <div class="china-macro-section-head">
        <h3>行业轮动结论</h3>
        <p>按超配、标配、低配三层结构展示，不改动站内原有资产模块。</p>
      </div>
      <div class="china-macro-sector-grid">
        <article class="china-macro-sector-card is-overweight">
          <div class="china-macro-sector-title">超配</div>
          <ul class="bullet-list">
            ${module.sectors.overweight.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
        <article class="china-macro-sector-card is-neutral">
          <div class="china-macro-sector-title">标配</div>
          <ul class="bullet-list">
            ${module.sectors.neutral.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
        <article class="china-macro-sector-card is-underweight">
          <div class="china-macro-sector-title">低配</div>
          <ul class="bullet-list">
            ${module.sectors.underweight.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </div>
    </section>

    <section class="china-macro-allocation-section">
      <div class="china-macro-section-head">
        <h3>组合配置建议</h3>
        <p>${escapeHtml(module.portfolio.summary)}</p>
      </div>
      <div class="china-macro-portfolio-grid">
        ${module.portfolio.structure
          .map(
            (item) => `
              <article class="china-macro-portfolio-card">
                <div class="china-macro-portfolio-weight">${escapeHtml(item.weight)}</div>
                <div class="china-macro-portfolio-name">${escapeHtml(item.label)}</div>
                <div class="china-macro-portfolio-amount">${escapeHtml(item.amount)}</div>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="china-macro-rule-card">
        <div class="china-macro-trigger-title">执行规则</div>
        <ul class="bullet-list">
          ${module.portfolio.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </section>

    <section class="china-macro-allocation-section china-macro-allocation-tail">
      <article class="china-macro-tail-card">
        <div class="china-macro-section-head compact">
          <div>
            <h3>风险与失效条件</h3>
            <p>这部分决定组合什么时候该收缩，而不是继续硬扛。</p>
          </div>
        </div>
        <ul class="bullet-list">
          ${module.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="china-macro-tail-card">
        <div class="china-macro-section-head compact">
          <div>
            <h3>下一步跟踪数据</h3>
            <p>后续最关键的是确认这轮修复能否从生产端扩散到需求端。</p>
          </div>
        </div>
        <ul class="bullet-list">
          ${module.tracking.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
    </section>
  `;
}

function renderOverview() {
  const current = state.data.current_view;
  const pathSteps = current.current_system_path?.steps || [];
  const validationStatusClass = current.data_validation
    ? current.data_validation.status === "基本一致"
      ? "is-supportive"
      : current.data_validation.status === "明显背离"
        ? "is-pressured"
        : "is-watch"
    : "is-neutral";
  document.getElementById("macro-summary-cards").innerHTML = `
    <div class="overview-state-grid">
      <article class="overview-state-card is-hero">
        <div class="overview-state-eyebrow">Current Regime</div>
        <h3>${escapeHtml(current.current_macro_state || "—")}</h3>
        <p class="overview-state-copy">${escapeHtml(current.macro_state_note || current.macro_summary || "")}</p>
        <div class="overview-state-meta">
          <div class="overview-state-meta-item">
            <span>截至日期</span>
            <strong>${escapeHtml(current.as_of_date || "—")}</strong>
          </div>
          <div class="overview-state-meta-item">
            <span>判断置信度</span>
            <strong>${escapeHtml(current.confidence_level || "—")}</strong>
          </div>
          <div class="overview-state-meta-item">
            <span>情景标签</span>
            <strong>${escapeHtml(`${(current.current_regime_labels || []).length || 0} 项主线`)}</strong>
          </div>
        </div>
      </article>

      <article class="overview-state-card">
        <div class="overview-state-label">国内主线</div>
        <div class="overview-state-value">${escapeHtml(current.domestic_view || "—")}</div>
        <div class="overview-state-note">${escapeHtml(current.domestic_note || "")}</div>
      </article>

      <article class="overview-state-card">
        <div class="overview-state-label">海外主线</div>
        <div class="overview-state-value">${escapeHtml(current.overseas_view || "—")}</div>
        <div class="overview-state-note">${escapeHtml(current.overseas_note || "")}</div>
      </article>

      ${
        current.data_validation
          ? `
            <article class="overview-state-card is-validation ${validationStatusClass}">
              <div class="overview-state-topline">
                <div class="overview-state-label">数据驱动校验</div>
                <span class="overview-state-badge ${validationStatusClass}">${escapeHtml(current.data_validation.status || "观察")}</span>
              </div>
              <div class="overview-state-note">${escapeHtml(current.data_validation.summary || "")}</div>
            </article>
          `
          : ""
      }
    </div>
  `;

  document.getElementById("framework-pills").innerHTML = `
    <div class="overview-framework-shell">
      <div class="overview-framework-stat">
        <span>框架编排</span>
        <strong>${escapeHtml(`${(current.primary_frameworks_used || []).length} 个核心框架`)}</strong>
        <p>先识别位置，再验证节奏，最后映射到资产动作。</p>
      </div>
      <div class="overview-framework-cloud">
        ${(current.primary_frameworks_used || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
  `;
  const recommendedFrameworks = FRAMEWORK_READING_ORDER
    .map((id) => (state.data.frameworks || []).find((item) => item.id === id))
    .filter(Boolean)
    .filter((item) => (current.primary_frameworks_used || []).includes(item.title))
    .slice(0, 4);
  document.getElementById("framework-reading-intro").innerHTML = recommendedFrameworks.length
    ? `
      <div class="framework-reading-intro-card">
        <div class="framework-reading-intro-head">
          <h3>推荐入门框架</h3>
          <p>从当前判断最相关的基础框架开始，再进入节奏、验证和配置方法。</p>
        </div>
        <div class="framework-reading-intro-list">
          ${recommendedFrameworks
            .map(
              (item) => `
                <button class="framework-reading-intro-item" type="button" data-home-framework="${escapeHtml(item.id)}">
                  <span class="framework-reading-step">${escapeHtml(`Step ${FRAMEWORK_READING_ORDER.indexOf(item.id) + 1}`)}</span>
                  <span class="framework-reading-intro-title">${escapeHtml(item.title)}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  document.querySelectorAll("[data-home-framework]").forEach((node) => {
    node.addEventListener("click", () => {
      const frameworkId = node.dataset.homeFramework;
      if (!frameworkId) return;
      state.activeFrameworkId = frameworkId;
      renderFrameworks();
      setActiveTab("frameworks");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  const allocationCalibration = current.allocation_calibration || { ranking: [], summary: "" };
  document.getElementById("allocation-calibration-summary").innerHTML =
    allocationCalibration.ranking?.length
      ? `
        <div class="allocation-calibration-card">
          <div class="allocation-calibration-head">
            <div>
              <h3>数据驱动资产校准</h3>
              <p>${escapeHtml(allocationCalibration.summary || "")}</p>
            </div>
          </div>
          <div class="allocation-calibration-tags">
            ${allocationCalibration.ranking
              .slice(0, 6)
              .map(
                (item) => `
                  <span class="allocation-calibration-tag ${toneClassFromSignal(item.tone)}">
                    ${escapeHtml(`${item.asset} · ${item.label}`)}
                  </span>
                `
              )
              .join("")}
          </div>
        </div>
      `
      : "";

  document.getElementById("allocation-grid").innerHTML = current.allocation_recommendations
    .map((item) => {
      const linkedPathSteps = pathSteps
        .map((step, index) => {
          if (!step || typeof step === "string") return null;
          if (step.action === "asset" && step.asset === item.asset_name) {
            return `第 ${index + 1} 步`;
          }
          if (step.action === "assets" && (step.assets || []).includes(item.asset_name)) {
            return `第 ${index + 1} 步`;
          }
          return null;
        })
        .filter(Boolean);
      return `
        <article
          class="allocation-card is-clickable"
          data-allocation-asset="${escapeHtml(item.asset_name)}"
          tabindex="0"
          role="button"
          aria-label="查看 ${escapeHtml(item.asset_name)} 的资产映射详情"
        >
          <div class="allocation-head">
            <div>
              <h3>${escapeHtml(item.asset_name)}</h3>
              <div class="allocation-text">${escapeHtml(item.reason)}</div>
              ${
                linkedPathSteps.length
                  ? `<div class="allocation-path-hint">本资产对应当前研究导航的 ${escapeHtml(linkedPathSteps.join(" / "))}</div>`
                  : ""
              }
            </div>
            <span class="view-badge ${tagClassFromView(item.view)}">${escapeHtml(item.view)}</span>
          </div>
          <div class="weight-band">${escapeHtml(item.weight_band)}</div>
          <div class="allocation-text">建议口径：${escapeHtml(item.view)}，权重区间为 ${escapeHtml(item.weight_band)}。</div>
          ${
            item.data_calibration
              ? `
                <div class="allocation-calibration-inline">
                  <div class="allocation-calibration-inline-top">
                    <span class="allocation-calibration-inline-label">数据校准</span>
                    <span class="allocation-calibration-inline-badge ${toneClassFromSignal(item.data_calibration.tone)}">${escapeHtml(item.data_calibration.view)}</span>
                  </div>
                  <div class="allocation-calibration-inline-note">${escapeHtml(item.data_calibration.note || "")}</div>
                  <div class="allocation-calibration-inline-rank">${escapeHtml(item.data_calibration.priority_label || "")}</div>
                </div>
              `
              : ""
          }
          <div class="allocation-risk">风险提示：${escapeHtml(item.risk_warning)}</div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-allocation-asset]").forEach((node) => {
    const navigateToAsset = () => {
      const asset = node.dataset.allocationAsset;
      if (!asset) return;
      state.activeAssetFocus = {
        title: "研究导航对应资产",
        note: "从首页配置建议直接跳转而来，建议结合资产映射库查看该资产的驱动、风险与当前研究导航位置。",
        assets: [asset],
      };
      renderAssets();
      setActiveTab("assets", { preserveAssetFocus: true });
      requestAnimationFrame(() => flashAssetCard(asset));
    };
    node.addEventListener("click", navigateToAsset);
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigateToAsset();
    });
  });

  renderChinaMacroAllocationModule();
  document.getElementById("driver-list").innerHTML = current.key_drivers.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.getElementById("notes-list").innerHTML = current.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  renderOverviewCockpit();
  renderDataDrivenView();

  const path = current.current_system_path;
  const dataDrivenPath = current.data_driven_path;
  const pathComparison = current.path_comparison;
  document.getElementById("overview-research-path").innerHTML =
    path?.steps?.length || dataDrivenPath?.steps?.length
      ? `
        ${
          pathComparison
            ? `
              <div class="path-comparison-card">
                <div class="path-comparison-top">
                  <div>
                    <h3>${escapeHtml(pathComparison.headline || "路径比较")}</h3>
                    <p>${escapeHtml(pathComparison.action_hint || "")}</p>
                  </div>
                  <span class="path-comparison-badge ${pathComparison.status === "基本一致" ? "is-supportive" : "is-watch"}">${escapeHtml(pathComparison.status || "")}</span>
                </div>
                <ul class="path-comparison-list">
                  ${(pathComparison.points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
            `
            : ""
        }
        <div class="research-path-stack">
          ${renderPathCard(path, { pathKey: "manual", cardClass: "overview-path-card" })}
          ${renderPathCard(dataDrivenPath, { pathKey: "data", cardClass: "data-path-card" })}
        </div>
      `
      : "";

  bindPathNodes("#overview-research-path");
}

function renderFrameworks() {
  const frameworks = state.data.frameworks;
  if (!state.activeFrameworkId) {
    state.activeFrameworkId = frameworks[0].id;
  }
  const readingMap = new Map(FRAMEWORK_READING_ORDER.map((id, index) => [id, index + 1]));
  const groups = [
    {
      id: "recognition",
      title: "识别框架",
      note: "回答“现在宏观处于什么位置”，包括总量周期、传导链条、节奏划分和环境修正。",
      match: (item) => ["经济周期识别框架", "中长周期框架"].includes(item.category),
    },
    {
      id: "validation",
      title: "验证框架",
      note: "回答“当前判断是否真的得到数据确认”，用于过滤噪音和提升转折判断置信度。",
      match: (item) => item.category === "指标验证框架",
    },
    {
      id: "allocation",
      title: "配置方法论",
      note: "回答“知道方向后如何分配权重”，把宏观判断进一步转成组合结构和风险预算。",
      match: (item) => item.category === "资产配置方法论",
    },
  ];

  document.getElementById("framework-grid").innerHTML = groups
    .map((group, groupIndex) => {
      const items = frameworks.filter(group.match);
      if (!items.length) return "";
      return `
        <section class="framework-group-section${groupIndex === 0 ? " is-first" : ""}">
          ${
            groupIndex === 0
              ? `
                <div class="framework-reading-card">
                  <div class="framework-reading-head">
                    <h3>推荐阅读顺序</h3>
                    <p>先看总框架，再看中国本土传导和环境修正，最后再进入节奏细化、中长周期与配置方法论。</p>
                  </div>
                  <div class="framework-reading-flow">
                    ${FRAMEWORK_READING_ORDER
                      .map((id, index) => {
                        const item = frameworks.find((framework) => framework.id === id);
                        if (!item) return "";
                        const isLast = index === FRAMEWORK_READING_ORDER.length - 1;
                        return `
                          <button class="framework-reading-node" type="button" data-framework-id="${escapeHtml(id)}">
                            <span class="framework-reading-step">${escapeHtml(`Step ${index + 1}`)}</span>
                            <span class="framework-reading-label">${escapeHtml(item.title)}</span>
                          </button>
                          ${isLast ? "" : '<span class="framework-reading-sep" aria-hidden="true">→</span>'}
                        `;
                      })
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
          <div class="framework-group-head">
            <div>
              <h3>${escapeHtml(group.title)}</h3>
              <p>${escapeHtml(group.note)}</p>
            </div>
            <span class="framework-group-count">${escapeHtml(`${items.length} 个`)}</span>
          </div>
          <div class="framework-group-grid">
            ${items
              .map(
                (item) => `
                  <article class="framework-card${item.id === state.activeFrameworkId ? " is-active" : ""}" data-framework-id="${escapeHtml(item.id)}">
                    <div class="framework-card-top">
                      <div class="framework-type">${escapeHtml(item.category)}</div>
                      ${
                        readingMap.has(item.id)
                          ? `<span class="framework-step-pill">${escapeHtml(`Step ${readingMap.get(item.id)}`)}</span>`
                          : ""
                      }
                    </div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.short_summary)}</p>
                    <div class="history-meta">${item.tags.map((tag) => `<span class="meta-pill">${escapeHtml(tag)}</span>`).join("")}</div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  document.querySelectorAll("[data-framework-id]").forEach((node) => {
    node.addEventListener("click", () => {
      state.activeFrameworkId = node.dataset.frameworkId;
      renderFrameworks();
    });
  });

  const current = frameworks.find((item) => item.id === state.activeFrameworkId);
  const linkedExternalReports =
    current.external_report_support?.length ? current.external_report_support : getLinkedReports("by_framework", current.title, 4);
  const structuredSections = [
    { id: "origin", title: "起源背景", type: "text", value: current.origin_background },
    { id: "idea", title: "核心思想", type: "text", value: current.core_idea },
    { id: "method", title: "分析方法", type: "list", value: current.methodology },
    { id: "state", title: "状态划分", type: "text", value: current.state_definition },
    { id: "mechanism", title: "传导机制", type: "list", value: current.transition_mechanism },
    { id: "performance", title: "典型资产表现", type: "list", value: current.asset_performance },
    { id: "indicators", title: "关键指标", type: "list", value: current.key_indicators },
    { id: "china", title: "本土应用", type: "text", value: current.china_adaptation },
    { id: "history", title: "历史表现", type: "list", value: current.historical_evidence },
    { id: "scene", title: "适用场景", type: "list", value: current.applicable_scenes },
    { id: "limits", title: "局限性", type: "list", value: current.limitations },
    { id: "pitfalls", title: "常见误用", type: "list", value: current.common_pitfalls },
  ].filter((section) => section.value && (!Array.isArray(section.value) || section.value.length));
  const sections =
    current.source_sections && current.source_sections.length
      ? current.source_sections.map((section, index) => ({
          id: `source-${index + 1}`,
          title: section.title,
          type: "markdown",
          value: section.content,
        }))
      : structuredSections;
  const allSections = sections;
  document.getElementById("framework-outline").innerHTML = `
    <div class="framework-outline-card">
      <div class="framework-outline-title">${escapeHtml(current.title)}</div>
      <div class="framework-outline-subtitle">${escapeHtml(current.category)}</div>
      <div class="framework-outline-links">
        ${allSections
          .map(
            (section) =>
              `<a class="outline-link" href="#framework-${escapeHtml(current.id)}-${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`
          )
          .join("")}
        <a class="outline-link" href="#framework-${escapeHtml(current.id)}-sources">参考来源</a>
      </div>
    </div>
  `;

  document.getElementById("framework-detail").innerHTML = `
    <article class="framework-article-card">
      <div class="framework-article-hero">
        <div>
          <div class="framework-card-top">
            <div class="framework-type">${escapeHtml(current.category)}</div>
            ${
              readingMap.has(current.id)
                ? `<span class="framework-step-pill">${escapeHtml(`Step ${readingMap.get(current.id)}`)}</span>`
                : ""
            }
          </div>
          <h3>${escapeHtml(current.title)}</h3>
          <p>${escapeHtml(current.short_summary)}</p>
        </div>
        <div class="history-meta">${current.tags.map((tag) => `<span class="meta-pill">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      ${allSections
        .map((section) => {
          if (section.type === "markdown") {
            return `
              <section class="framework-section-block" id="framework-${escapeHtml(current.id)}-${escapeHtml(section.id)}">
                <h4>${escapeHtml(section.title)}</h4>
                ${renderMarkdownFragment(section.value)}
              </section>
            `;
          }
          if (section.type === "list") {
            return `
              <section class="framework-section-block" id="framework-${escapeHtml(current.id)}-${escapeHtml(section.id)}">
                <h4>${escapeHtml(section.title)}</h4>
                <ul>${section.value.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </section>
            `;
          }
          return `
            <section class="framework-section-block" id="framework-${escapeHtml(current.id)}-${escapeHtml(section.id)}">
              <h4>${escapeHtml(section.title)}</h4>
              <p>${escapeHtml(section.value)}</p>
            </section>
          `;
        })
        .join("")}
      <section class="framework-section-block" id="framework-${escapeHtml(current.id)}-sources">
        <h4>参考来源</h4>
        <ul>${(current.source_links || [])
          .map((item) => {
            if (!item.url || item.url === "本地理论稿") {
              return `<li>${escapeHtml(item.label)}</li>`;
            }
            return `<li><a href="${encodePathForHref(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a></li>`;
          })
          .join("")}</ul>
      </section>
      ${
        linkedExternalReports.length
          ? `
      <section class="framework-section-block" id="framework-${escapeHtml(current.id)}-external-reports">
        <h4>相关图表与原报告</h4>
        ${renderReportSupportBlock(linkedExternalReports, { showCharts: true, showKnowledge: true })}
      </section>
      `
          : ""
      }
    </article>
  `;
}

function renderScenarios() {
  const scenarios = state.data.macro_scenarios;
  if (!state.activeScenarioId) {
    state.activeScenarioId = state.data.current_view?.current_system_path?.linked_scenario_id || scenarios[0].id;
  }
  const recommendedScenarioId = state.data.current_view?.current_system_path?.linked_scenario_id;
  const dataDrivenScenarioId = state.data.current_view?.data_driven_path?.linked_scenario_id;
  document.getElementById("scenario-toggle").innerHTML = scenarios
    .map(
      (item) =>
        `<button class="scenario-chip${item.id === state.activeScenarioId ? " is-active" : ""}${item.id === recommendedScenarioId ? " is-recommended" : ""}${item.id === dataDrivenScenarioId ? " is-data-recommended" : ""}" data-scenario-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`
    )
    .join("");

  document.querySelectorAll("[data-scenario-id]").forEach((node) => {
    node.addEventListener("click", () => {
      state.activeScenarioId = node.dataset.scenarioId;
      renderScenarios();
    });
  });

  const current = scenarios.find((item) => item.id === state.activeScenarioId);
  const path = state.data.current_view?.current_system_path;
  const dataPath = state.data.current_view?.data_driven_path;
  const pathSteps = path?.steps || [];
  const dataPathSteps = dataPath?.steps || [];
  const recommendedAssetStep =
    current.id === recommendedScenarioId
      ? pathSteps.find((item) => item && typeof item !== "string" && item.action === "assets")
      : null;
  const nextAssetStep =
    current.id === recommendedScenarioId
      ? pathSteps.find((item) => item && typeof item !== "string" && item.action === "asset")
      : null;
  const dataRecommendedAssetStep =
    current.id === dataDrivenScenarioId
      ? dataPathSteps.find((item) => item && typeof item !== "string" && item.action === "assets")
      : null;
  const dataNextAssetStep =
    current.id === dataDrivenScenarioId
      ? dataPathSteps.find((item) => item && typeof item !== "string" && item.action === "asset")
      : null;
  const linkedReports =
    current.external_report_support?.length ? current.external_report_support : getLinkedReports("by_scenario", current.title, 3);
  document.getElementById("scenario-detail").innerHTML = `
    <div class="scenario-panel">
      ${
        current.id === recommendedScenarioId
          ? `<div class="scenario-recommended-flag">当前研究情景</div>`
          : ""
      }
      ${
        current.id === dataDrivenScenarioId
          ? `<div class="scenario-recommended-flag is-data">数据驱动情景</div>`
          : ""
      }
      <h3>${escapeHtml(current.title)}</h3>
      <div class="history-meta">${current.framework_links.map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("")}</div>
      ${
        recommendedAssetStep
          ? `
            <div class="scenario-guidance-card">
              <div class="scenario-guidance-head">
                <span class="scenario-guidance-kicker">研究导航对应资产</span>
                <p>利率债 + 黄金，关注权益扩仓触发条件。先稳住防守资产，再等待信用与实体确认后评估权益风险预算是否上调。</p>
              </div>
              <div class="scenario-guidance-actions">
                ${((recommendedAssetStep.assets || []).map((asset) => `<button class="scenario-guidance-tag" type="button" data-guidance-asset="${escapeHtml(asset)}">${escapeHtml(asset)}</button>`).join(""))}
                ${
                  nextAssetStep?.asset
                    ? `<button class="scenario-guidance-tag is-secondary" type="button" data-guidance-asset="${escapeHtml(nextAssetStep.asset)}">关注：${escapeHtml(nextAssetStep.asset)}</button>`
                    : ""
                }
              </div>
            </div>
          `
          : ""
      }
      ${
        dataRecommendedAssetStep
          ? `
            <div class="scenario-guidance-card is-data">
              <div class="scenario-guidance-head">
                <span class="scenario-guidance-kicker">数据驱动优先资产</span>
                <p>${escapeHtml(dataPath?.note || "根据最新数据环境，优先关注底仓与信用修复资产，再决定是否切向更高弹性资产。")}</p>
              </div>
              <div class="scenario-guidance-actions">
                ${((dataRecommendedAssetStep.assets || []).map((asset) => `<button class="scenario-guidance-tag is-data" type="button" data-guidance-asset="${escapeHtml(asset)}">${escapeHtml(asset)}</button>`).join(""))}
                ${
                  dataNextAssetStep?.asset
                    ? `<button class="scenario-guidance-tag is-secondary" type="button" data-guidance-asset="${escapeHtml(dataNextAssetStep.asset)}">再评估：${escapeHtml(dataNextAssetStep.asset)}</button>`
                    : ""
                }
              </div>
            </div>
          `
          : ""
      }
      <div class="detail-section">
        <h4>宏观特征</h4>
        <ul>${current.features.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="detail-section">
        <h4>领先指标</h4>
        <ul>${current.leading_indicators.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="detail-section">
        <h4>常见配置思路</h4>
        <ul>${current.allocation_playbook.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="detail-section">
        <h4>历史对应案例</h4>
        <ul>${current.linked_cases.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      ${
        linkedReports.length
          ? `
            <div class="detail-section">
              <h4>相关图表与原报告</h4>
              ${renderReportSupportBlock(linkedReports, { compact: true })}
            </div>
          `
          : ""
      }
    </div>
  `;

  document.getElementById("scenario-assets").innerHTML = current.asset_views
    .map(
      (item) => `
        <div class="asset-row">
          <div class="asset-name">${escapeHtml(item.asset_name)}</div>
          <div class="asset-view ${tagClassFromView(item.view)}">${escapeHtml(item.view)}</div>
          <div class="asset-reason">${escapeHtml(item.reason)}</div>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-guidance-asset]").forEach((node) => {
    node.addEventListener("click", () => {
      const asset = node.dataset.guidanceAsset;
      if (!asset) return;
      state.activeAssetFocus = {
        title: "研究导航对应资产",
        note: "这是当前研究情景下建议优先联动查看的资产组与下一步重点观察方向。",
        assets: [asset],
      };
      renderAssets();
      setActiveTab("assets", { preserveAssetFocus: true });
      requestAnimationFrame(() => flashAssetCard(asset));
    });
  });
}

function renderAssets() {
  const focusAssets = state.activeAssetFocus?.assets || [];
  const focusTitle = state.activeAssetFocus?.title || "";
  const focusNote = state.activeAssetFocus?.note || "";
  const pathSteps = state.data.current_view?.current_system_path?.steps || [];
  const dataPath = state.data.current_view?.data_driven_path || {};
  const calibrationMap = new Map(
    (state.data.current_view?.allocation_calibration?.ranking || []).map((item) => [item.asset, item])
  );
  const dataPriorityAssets = dataPath.linked_assets || [];
  const dataFocusAsset = dataPath.focus_asset || "";
  document.getElementById("asset-focus-banner").innerHTML =
    focusAssets.length
      ? `
        <div class="asset-focus-banner">
          <div class="asset-focus-banner-head">
            <span class="asset-focus-kicker">${escapeHtml(focusTitle || "研究导航对应资产")}</span>
            <p>${escapeHtml(focusNote || "当前节点建议优先联动查看这一组资产，而不是孤立理解单一资产。")}</p>
          </div>
          <div class="asset-focus-tags">
            ${focusAssets.map((item) => `<span class="asset-focus-tag">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>
      `
      : dataPriorityAssets.length
        ? `
          <div class="asset-focus-banner is-data">
            <div class="asset-focus-banner-head">
              <span class="asset-focus-kicker">数据驱动优先资产</span>
              <p>${escapeHtml(dataPath.note || "根据最新数据环境，当前更适合先看底仓与信用修复资产，再决定是否提升权益风险预算。")}</p>
            </div>
            <div class="asset-focus-tags">
              ${dataPriorityAssets.map((item) => `<span class="asset-focus-tag">${escapeHtml(item)}</span>`).join("")}
              ${dataFocusAsset ? `<span class="asset-focus-tag is-secondary">${escapeHtml(`再评估：${dataFocusAsset}`)}</span>` : ""}
            </div>
          </div>
        `
        : "";
  document.getElementById("asset-library-grid").innerHTML = state.data.assets
    .map(
      (asset) => {
        const calibration = calibrationMap.get(asset.name);
        const isDataPriority = dataPriorityAssets.includes(asset.name);
        const isDataFocus = dataFocusAsset === asset.name;
        const linkedReports =
          asset.external_report_support?.length
            ? asset.external_report_support
            : getLinkedReports("by_asset", asset.name, focusAssets.includes(asset.name) ? 2 : 1);
        const linkedPathSteps = pathSteps
          .map((step, index) => {
            if (!step || typeof step === "string") return null;
            if (step.action === "asset" && step.asset === asset.name) {
              return `第 ${index + 1} 步`;
            }
            if (step.action === "assets" && (step.assets || []).includes(asset.name)) {
              return `第 ${index + 1} 步`;
            }
            return null;
          })
          .filter(Boolean);
        return `
        <article class="asset-library-card${focusAssets.includes(asset.name) ? " is-focused" : ""}${isDataPriority ? " is-data-priority" : ""}${isDataFocus ? " is-data-focus" : ""}" id="asset-${escapeHtml(asset.name)}" data-asset-name="${escapeHtml(asset.name)}">
          <div class="asset-library-head">
            <div>
              <h3>${escapeHtml(asset.name)}</h3>
              <div class="asset-library-summary">${escapeHtml(asset.summary || asset.relative_role || "")}</div>
              ${
                linkedPathSteps.length
                  ? `<div class="asset-path-hint">本资产对应当前研究导航的 ${escapeHtml(linkedPathSteps.join(" / "))}</div>`
                  : ""
              }
              ${
                calibration
                  ? `
                    <div class="asset-data-tags">
                      <span class="asset-data-tag ${toneClassFromSignal(calibration.tone)}">${escapeHtml(`数据校准 · ${calibration.label}`)}</span>
                      <span class="asset-data-tag is-rank">${escapeHtml(`优先级 ${calibration.priority}`)}</span>
                      ${isDataFocus ? `<span class="asset-data-tag is-focus">${escapeHtml("当前数据关注")}</span>` : ""}
                    </div>
                  `
                  : ""
              }
            </div>
            <div class="asset-role-pill">${escapeHtml(asset.relative_role)}</div>
          </div>
          <div class="history-meta">
            ${(asset.related_frameworks || []).map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("")}
          </div>
          ${
            calibration
              ? `
                <div class="asset-library-section">
                  <h4>数据校准</h4>
                  <p>${escapeHtml(calibration.reason || "")}</p>
                </div>
              `
              : ""
          }
          <div class="asset-library-section">
            <h4>核心驱动</h4>
            <ul>${(asset.drivers || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          <div class="asset-library-section">
            <h4>关键观察点</h4>
            <ul>${(asset.key_watch_list || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          <div class="asset-library-section">
            <h4>适用情景</h4>
            <div class="history-meta">${(asset.suited_scenarios || []).map((line) => `<span class="meta-pill">${escapeHtml(line)}</span>`).join("")}</div>
          </div>
          <div class="asset-library-section">
            <h4>配置用途</h4>
            <p>${escapeHtml(asset.allocation_use || "—")}</p>
          </div>
          ${
            asset.historical_patterns && asset.historical_patterns.length
              ? `
          <div class="asset-library-section">
            <h4>历史规律</h4>
            <ul>${asset.historical_patterns.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          `
              : ""
          }
          ${
            asset.china_application
              ? `
          <div class="asset-library-section">
            <h4>本土应用</h4>
            <p>${escapeHtml(asset.china_application)}</p>
          </div>
          `
              : ""
          }
          ${
            asset.quarterly_sorting && asset.quarterly_sorting.length
              ? `
          <div class="asset-library-section">
            <h4>季度资产排序</h4>
            <ul>${asset.quarterly_sorting.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          `
              : ""
          }
          ${
            asset.report_risk_prompts && asset.report_risk_prompts.length
              ? `
          <div class="asset-library-section">
            <h4>报告常见风险提示</h4>
            <ul>${asset.report_risk_prompts.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          `
              : ""
          }
          ${
            linkedReports.length
              ? `
          <div class="asset-library-section">
            <h4>相关图表与原报告</h4>
            ${renderReportSupportBlock(linkedReports, { compact: true })}
          </div>
          `
              : ""
          }
          <div class="asset-library-section split">
            <div>
              <h4>主要风险</h4>
              <ul>${(asset.risks || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
            </div>
            <div>
              <h4>常见误用</h4>
              <ul>${(asset.pitfalls || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
            </div>
          </div>
          ${
            asset.source_links && asset.source_links.length
              ? `
          <div class="asset-library-section">
            <h4>参考来源</h4>
            <ul>${asset.source_links
              .map((item) => {
                if (!item.url || item.url === "本地研究归档") {
                  return `<li>${escapeHtml(item.label)}</li>`;
                }
                return `<li><a href="${encodePathForHref(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a></li>`;
              })
              .join("")}</ul>
          </div>
          `
              : ""
          }
        </article>
      `;
      }
    )
    .join("");
}

function renderHistory() {
  document.getElementById("history-grid").innerHTML = state.data.historical_cases
    .map((item) => {
      const linkedReports = item.external_report_support || [];
      const sourceTitle = item.source_report_title || linkedReports[0]?.title || "";
      const sourcePdfPath = item.source_pdf_path || linkedReports[0]?.source_pdf_path || "";
      return `
        <article class="history-card">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="history-meta">
            <span class="meta-pill">${escapeHtml(item.period)}</span>
            <span class="meta-pill">${escapeHtml(item.regime)}</span>
          </div>
          <p>${escapeHtml(item.macro_background)}</p>
          <div class="detail-section">
            <h4>资产表现</h4>
            <ul>${item.asset_performance.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          <div class="detail-section">
            <h4>复盘结论</h4>
            <ul>${item.takeaways.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          ${
            sourceTitle || sourcePdfPath
              ? `
                <div class="detail-section">
                  <h4>来源报告</h4>
                  ${sourceTitle ? `<p>${escapeHtml(sourceTitle)}</p>` : ""}
                  ${
                    sourcePdfPath
                      ? `<a class="report-link-button minor" href="${encodePathForHref(sourcePdfPath)}" target="_blank" rel="noreferrer">打开来源 PDF</a>`
                      : ""
                  }
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderMacroDashboard() {
  const root = document.getElementById("macro-dashboard-root");
  if (!root) return;
  const dashboard = state.data.macro_dashboard;
  if (!dashboard) {
    root.innerHTML = `
      <section class="macro-dashboard-empty">
        <p>外部宏观仪表盘数据尚未生成，请先运行数据打包脚本。</p>
      </section>
    `;
    return;
  }

  const coverage = dashboard.coverage || { dimensions: [], missing_priority: [], summary: "" };
  root.innerHTML = `
    <section class="macro-dashboard-shell">
      <div class="macro-summary-grid">
        ${(dashboard.summary_cards || [])
          .map(
            (card) => `
              <article class="macro-summary-card">
                <div class="macro-summary-label">${escapeHtml(card.label)}</div>
                <div class="macro-summary-value">${escapeHtml(card.value)}</div>
                <div class="macro-summary-note">${escapeHtml(card.note)}</div>
              </article>
            `
          )
          .join("")}
      </div>

      ${
        (dashboard.highlights || []).length
          ? `
            <section class="macro-highlight-card">
              <div class="dashboard-subhead">
                <div>
                  <h3>信号快照</h3>
                  <p>先看高频资产价格给出的方向，再等待总量和信用数据确认。</p>
                </div>
              </div>
              <div class="macro-highlight-list">
                ${(dashboard.highlights || []).map((item) => `<div class="macro-highlight-item">${escapeHtml(item)}</div>`).join("")}
              </div>
            </section>
          `
          : ""
      }

      <div class="macro-theme-grid">
        ${(dashboard.themes || [])
          .map(
            (theme) => `
              <section class="macro-theme-card">
                <div class="dashboard-subhead">
                  <div>
                    <h3>${escapeHtml(theme.title)}</h3>
                    <p>${escapeHtml(theme.summary_hint || "")}</p>
                  </div>
                </div>
                <div class="macro-theme-summary">${escapeHtml(theme.summary || "")}</div>
                <div class="macro-signal-grid">
                  ${(theme.signals || [])
                    .map(
                      (item) => `
                        <article class="macro-signal-card">
                          <div class="macro-signal-top">
                            <div>
                              <div class="macro-signal-name">${escapeHtml(item.display_name)}</div>
                              <div class="macro-signal-meta">${escapeHtml([item.dimension, item.priority, item.frameworks].filter(Boolean).join(" · "))}</div>
                            </div>
                            <span class="macro-signal-badge ${toneClassFromSignal(item.signal_tone)}">${escapeHtml(item.signal_label)}</span>
                          </div>
                          <div class="macro-signal-value-row">
                            <div class="macro-signal-value">${escapeHtml(item.latest_value)}</div>
                            <div class="macro-signal-date">${escapeHtml(item.latest_date)}</div>
                          </div>
                          ${buildSparklineSvg(item.sparkline)}
                          <div class="macro-signal-stats">
                            <span>5日 ${escapeHtml(item.change_5d)}</span>
                            <span>20日 ${escapeHtml(item.change_20d)}</span>
                            <span>1年 ${escapeHtml(item.change_250d)}</span>
                          </div>
                          <div class="macro-signal-foot">
                            <div class="macro-signal-percentile">${escapeHtml(item.percentile_text)}</div>
                            ${
                              item.staleness_days > 3
                                ? `<div class="macro-signal-staleness">非日更 · ${escapeHtml(`${item.staleness_days} 天未更新`)}</div>`
                                : ""
                            }
                          </div>
                          <div class="macro-signal-note">${escapeHtml(item.observation)}</div>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </section>
            `
          )
          .join("")}
      </div>

      <div class="macro-dashboard-lower">
        <section class="dashboard-subsection">
          <div class="dashboard-subhead">
            <div>
              <h3>覆盖情况</h3>
              <p>${escapeHtml(coverage.summary || "")}</p>
            </div>
          </div>
          <div class="macro-coverage-grid">
            ${(coverage.dimensions || [])
              .map(
                (item) => `
                  <article class="macro-coverage-card">
                    <div class="macro-coverage-top">
                      <span class="macro-coverage-name">${escapeHtml(item.dimension)}</span>
                      <span class="macro-coverage-ratio">${escapeHtml(item.coverage_text)}</span>
                    </div>
                    <div class="macro-coverage-bar">
                      <span style="width:${Math.max(6, Math.round((item.coverage_ratio || 0) * 100))}%"></span>
                    </div>
                    <div class="macro-coverage-meta">P0 覆盖 ${escapeHtml(`${item.mapped_p0} / ${item.p0_total}`)}</div>
                    <div class="macro-coverage-note">${escapeHtml(item.comment)}</div>
                  </article>
                `
              )
              .join("")}
          </div>
          ${
            (coverage.missing_priority || []).length
              ? `
                <div class="dashboard-subhead compact">
                  <div>
                    <h3>优先待补数据</h3>
                    <p>根据说明文件的 P0 优先级和当前导出状态，建议优先补齐这些总量确认指标。</p>
                  </div>
                </div>
                <div class="macro-missing-grid">
                  ${(coverage.missing_priority || [])
                    .map(
                      (item) => `
                        <article class="macro-missing-card">
                          <div class="macro-missing-name">${escapeHtml(item.name)}</div>
                          <div class="macro-missing-meta">${escapeHtml([item.dimension, item.frequency, item.priority].filter(Boolean).join(" · "))}</div>
                          <div class="macro-missing-note">${escapeHtml(item.note || item.frameworks || "")}</div>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
          ${
            (coverage.remaining_all || []).length
              ? `
                <div class="dashboard-subhead compact">
                  <div>
                    <h3>剩余可选缺口</h3>
                    <p>这些指标不影响 P0 主看板，但当前源文件还没有数据。可通过手工覆盖文件继续补齐。</p>
                  </div>
                </div>
                <div class="macro-missing-grid">
                  ${(coverage.remaining_all || [])
                    .map(
                      (item) => `
                        <article class="macro-missing-card">
                          <div class="macro-missing-name">${escapeHtml(item.name)}</div>
                          <div class="macro-missing-meta">${escapeHtml([item.dimension, item.frequency, item.priority].filter(Boolean).join(" · "))}</div>
                          <div class="macro-missing-note">${escapeHtml(item.note || item.frameworks || "")}</div>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </section>

        <section class="dashboard-subsection">
          <div class="dashboard-subhead">
            <div>
              <h3>导入与质量说明</h3>
              <p>先看文件导入状态，再看说明表里的口径风险，避免把技术性噪音误判为宏观拐点。</p>
            </div>
          </div>
          ${
            (dashboard.source_status || []).length
              ? `
                <div class="macro-source-status-list">
                  ${(dashboard.source_status || [])
                    .map(
                      (item) => `
                        <article class="macro-source-status-card">
                          <div class="macro-source-top">
                            <span class="macro-source-kind">${escapeHtml(item.label || "")}</span>
                            <span class="macro-signal-badge ${toneClassFromSignal(item.status === "ready" ? "supportive" : item.status === "formula_only" ? "watch" : "pressured")}">${escapeHtml(item.status)}</span>
                          </div>
                          <div class="macro-source-file">${escapeHtml(item.file_name || "未找到文件")}</div>
                          <div class="macro-source-meta">${escapeHtml([item.layout || "", item.latest_date ? `最新日期 ${item.latest_date}` : "", `解析 ${item.parsed_series_count || 0} 条序列`].filter(Boolean).join(" · "))}</div>
                          <div class="macro-source-note">${escapeHtml(item.summary || "")}</div>
                          ${
                            (item.details || []).length
                              ? `<ul class="macro-source-detail-list">${item.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`
                              : ""
                          }
                        </article>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
          <ul class="macro-note-list">
            ${(dashboard.quality_notes || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>

          ${
            (dashboard.references || []).length
              ? `
                <div class="dashboard-subhead compact">
                  <div>
                    <h3>参考口径</h3>
                    <p>说明文件之外，补充了若干官方定义页与海外公开数据源，便于后续扩展自动化采集。</p>
                  </div>
                </div>
                <div class="macro-reference-list">
                  ${(dashboard.references || [])
                    .map(
                      (item) => `
                        <a class="macro-reference-item" href="${encodePathForHref(item.url)}" target="_blank" rel="noreferrer">
                          <span class="macro-reference-title">${escapeHtml(item.title)}</span>
                          <span class="macro-reference-note">${escapeHtml(item.note)}</span>
                        </a>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </section>
      </div>
    </section>
  `;
}

function getMacroDashboardSignal(indicatorId) {
  const themes = state.data.macro_dashboard?.themes || [];
  for (const theme of themes) {
    const signal = (theme.signals || []).find((item) => item.id === indicatorId);
    if (signal) return signal;
  }
  return null;
}

function buildIndicatorGroups() {
  const dataView = state.data.macro_dashboard?.data_driven_view || {};
  const groups = [];

  if ((dataView.cycle_cards || []).length) {
    groups.push({
      title: "周期判断",
      items: dataView.cycle_cards.map((item) => ({
        name: item.label,
        value: item.value,
        comment: item.note || "",
      })),
    });
  }

  const supplementalSignals = ["LME_COPPER", "BRENT_OIL", "COMEX_GOLD", "NH_COMMODITY"]
    .map((indicatorId) => getMacroDashboardSignal(indicatorId))
    .filter(Boolean);
  if (supplementalSignals.length) {
    groups.push({
      title: "最新高频补充",
      items: supplementalSignals.map((item) => ({
        name: item.display_name,
        value: item.latest_value,
        comment: `${item.signal_label}；${item.observation}`,
      })),
    });
  }

  if ((dataView.evidence || []).length) {
    groups.push({
      title: "关键证据",
      items: dataView.evidence.map((item) => ({
        name: "",
        value: "",
        comment: item,
      })),
    });
  }

  if ((dataView.implications || []).length) {
    groups.push({
      title: "资产含义",
      items: dataView.implications.map((item) => ({
        name: item.asset,
        value: item.view,
        comment: item.reason || "",
      })),
    });
  }
  return groups;
}

function renderIndicators() {
  renderMacroDashboard();
  const groups = buildIndicatorGroups();
  document.getElementById("indicator-groups").innerHTML =
    !groups.length
      ? `
        <div class="indicator-empty">
          当前数据驱动补充尚未生成，请先重建 <code>macro_dashboard.json</code>。
        </div>
      `
      : groups
    .map(
      (group) => `
        <section class="indicator-group">
          <h3>${escapeHtml(group.title)}</h3>
          ${group.items
            .map(
              (item) => `
                <div class="indicator-item">
                  <div class="indicator-head">
                    ${item.name ? `<span class="indicator-name">${escapeHtml(item.name)}</span>` : ""}
                    ${item.value ? `<span class="indicator-value">${escapeHtml(item.value)}</span>` : ""}
                  </div>
                  <div class="indicator-comment">${escapeHtml(item.comment)}</div>
                </div>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");
}

function renderResearchMapIntro(containerId, intro) {
  const root = document.getElementById(containerId);
  if (!root) return;
  const path = state.data.current_view?.current_system_path;
  root.innerHTML = intro
    ? `
      <div class="index-intro-card research-map-card">
        <div class="index-intro-head">
          <h3>${escapeHtml(intro.title)}</h3>
          <p>${escapeHtml(intro.summary)}</p>
        </div>
        <div class="research-map-flow">
          ${(intro.steps || [])
            .map(
              (item, index) => `
                <article class="research-map-step-card">
                  <div class="research-map-step-top">
                    <span class="research-map-step-no">Step ${index + 1}</span>
                    <span class="research-map-step-label">${escapeHtml(item.step || "")}</span>
                  </div>
                  <h4>${escapeHtml(item.title)}</h4>
                  <ul>${(item.points || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
                </article>
              `
            )
            .join('<div class="research-map-arrow" aria-hidden="true">→</div>')}
        </div>
        ${
          path && path.steps && path.steps.length
            ? `
              <div class="research-path-card">
                <div class="research-path-head">
                  <span class="research-path-kicker">${escapeHtml(path.title || "当前研究导航路径")}</span>
                  <p>${escapeHtml(path.note || "")}</p>
                </div>
                <div class="research-path-flow">
                  ${path.steps
                    .map((item, index) => {
                      const label = typeof item === "string" ? item : item.label;
                      const isLast = index === path.steps.length - 1;
                      return `
                        <button class="research-path-node is-clickable" type="button" data-path-step="${index}">${escapeHtml(label)}</button>
                        ${isLast ? "" : '<span class="research-path-sep" aria-hidden="true">→</span>'}
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `
            : ""
        }
      </div>
    `
    : "";

  bindPathNodes(`#${containerId}`);
}

function renderAllocationWorkbench() {
  const config = getAllocationWorkbenchConfig();
  const result = computeAllocationWorkbenchResult();
  if (!config || !result || !state.allocationWorkbench) return "";
  const settings = state.allocationWorkbench;
  const assetOptions = (config.asset_map || []).map((item) => item.name);
  const renderAssetOptions = (selected) =>
    assetOptions
      .map((name) => `<option value="${escapeHtml(name)}"${selected === name ? " selected" : ""}>${escapeHtml(name)}</option>`)
      .join("");
  const renderChoiceGroup = (field, options, variant = "") => `
    <div class="allocation-choice-group${variant ? ` is-${escapeHtml(variant)}` : ""}">
      ${(options || [])
        .map(
          (option) => `
            <button
              type="button"
              class="allocation-choice-button${variant ? ` is-${escapeHtml(variant)}` : ""}${settings[field] === option.value ? " is-active" : ""}"
              data-allocation-choice="${escapeHtml(field)}"
              data-allocation-value="${escapeHtml(option.value)}"
            >
              <span>${escapeHtml(option.label)}</span>
              <small>${escapeHtml(option.note || "")}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
  return `
    <article class="method-card allocation-workbench-card" id="allocation-workbench-card">
      <div class="method-system-kicker">Allocation Engine</div>
      <h3>${escapeHtml(config.title)}</h3>
      <p>${escapeHtml(config.summary)}</p>
      <div class="allocation-workbench-layout">
        <section class="allocation-control-panel">
          <div class="detail-section">
            <h4>配置模型</h4>
            ${renderChoiceGroup("allocation_model", config.allocation_models, "model")}
          </div>

          <div class="allocation-control-grid">
            <label class="allocation-control-card">
              <span>组合规模</span>
              <input
                type="number"
                min="50000"
                step="10000"
                value="${escapeHtml(String(settings.capital))}"
                data-allocation-input="capital"
              />
              <small>默认 30 万，可按你的真实资金规模调整。</small>
            </label>
            <label class="allocation-control-card">
              <span>投资期限</span>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value="${escapeHtml(String(settings.horizon_years))}"
                data-allocation-range="horizon_years"
              />
              <strong>${escapeHtml(`${settings.horizon_years} 年`)}</strong>
            </label>
            <label class="allocation-control-card">
              <span>再平衡阈值</span>
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                value="${escapeHtml(String(settings.rebalance_threshold))}"
                data-allocation-range="rebalance_threshold"
              />
              <strong>${escapeHtml(`偏离 ${settings.rebalance_threshold}% 触发`)}</strong>
            </label>
            ${
              settings.allocation_model === "mean_variance"
                ? `
                  <label class="allocation-control-card">
                    <span>风险厌恶系数</span>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value="${escapeHtml(String(settings.risk_aversion))}"
                      data-allocation-range="risk_aversion"
                    />
                    <strong>${escapeHtml(`${settings.risk_aversion}`)}</strong>
                    <small>数值越高，均值-方差模型越偏向压低波动和回撤。</small>
                  </label>
                `
                : settings.allocation_model === "gtaa"
                  ? `
                    <label class="allocation-control-card">
                      <span>战术强度</span>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        step="1"
                        value="${escapeHtml(String(settings.tactical_strength))}"
                        data-allocation-range="tactical_strength"
                      />
                      <strong>${escapeHtml(`${settings.tactical_strength}`)}</strong>
                      <small>数值越高，GTAA 对当前相对强弱和趋势信号的响应越明显。</small>
                    </label>
                  `
                  : settings.allocation_model === "macro_factor_budget"
                    ? `
                      <label class="allocation-control-card">
                        <span>因子倾斜强度</span>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          step="1"
                          value="${escapeHtml(String(settings.factor_tilt_strength))}"
                          data-allocation-range="factor_tilt_strength"
                        />
                        <strong>${escapeHtml(`${settings.factor_tilt_strength}`)}</strong>
                        <small>数值越高，组合对增长、利率、信用和通胀因子预算的偏离越大。</small>
                      </label>
                    `
                      : settings.allocation_model === "black_litterman"
                        ? `
                          <label class="allocation-control-card">
                            <span>全局观点强度</span>
                            <input
                              type="range"
                              min="2"
                            max="10"
                            step="1"
                            value="${escapeHtml(String(settings.view_confidence))}"
                            data-allocation-range="view_confidence"
                          />
                          <strong>${escapeHtml(`${settings.view_confidence}`)}</strong>
                          <small>数值越高，当前宏观观点对战略锚的偏离幅度越大。</small>
                        </label>
                      `
                      : settings.allocation_model === "goals_based"
                        ? `
                          <label class="allocation-control-card">
                            <span>安全桶比例</span>
                            <input
                              type="range"
                              min="10"
                              max="70"
                              step="5"
                              value="${escapeHtml(String(settings.safety_floor_ratio))}"
                              data-allocation-range="safety_floor_ratio"
                            />
                            <strong>${escapeHtml(`${settings.safety_floor_ratio}%`)}</strong>
                            <small>先划入现金和债券的安全桶比例，剩余资金进入增长桶。</small>
                          </label>
                        `
                        : settings.allocation_model === "core_satellite"
                          ? `
                            <label class="allocation-control-card">
                              <span>执行方式</span>
                              <strong>核心仓 + 卫星仓</strong>
                              <small>核心仓承接长期中枢，卫星仓跟随当前宏观观点，最终按再平衡阈值控制偏离。</small>
                            </label>
                          `
                          : settings.allocation_model === "scenario_band"
                            ? `
                              <label class="allocation-control-card">
                                <span>输出方式</span>
                                <strong>区间权重映射</strong>
                                <small>直接把超配、中性、低配映射到参考区间，更适合快速形成投委会讨论口径。</small>
                              </label>
                            `
                : ""
            }
          </div>

          ${
            settings.allocation_model === "black_litterman"
              ? `
                <div class="detail-section">
                  <div class="allocation-views-head">
                    <div>
                      <h4>观点输入层</h4>
                      <p>只输入你真正有把握的观点。未被观点覆盖的资产会更多沿用战略锚，不需要对每个资产都手工写观点。</p>
                    </div>
                    <button type="button" class="allocation-inline-button" data-bl-view-add>新增观点</button>
                  </div>
                  <div class="allocation-view-list">
                    ${(settings.bl_views || [])
                      .map(
                        (view, index) => `
                          <article class="allocation-view-card">
                            <div class="allocation-view-grid">
                              <label>
                                <span>类型</span>
                                <select data-bl-view-field="type" data-bl-view-index="${index}">
                                  <option value="relative"${view.type === "relative" ? " selected" : ""}>相对观点</option>
                                  <option value="absolute"${view.type === "absolute" ? " selected" : ""}>绝对观点</option>
                                </select>
                              </label>
                              <label>
                                <span>资产 A</span>
                                <select data-bl-view-field="asset" data-bl-view-index="${index}">
                                  ${renderAssetOptions(view.asset)}
                                </select>
                              </label>
                              ${
                                view.type === "relative"
                                  ? `
                                    <label>
                                      <span>相对资产 B</span>
                                      <select data-bl-view-field="relative_asset" data-bl-view-index="${index}">
                                        ${renderAssetOptions(view.relative_asset)}
                                      </select>
                                    </label>
                                  `
                                  : `
                                    <label>
                                      <span>目标资产</span>
                                      <div class="allocation-view-static">绝对收益观点</div>
                                    </label>
                                  `
                              }
                              <label>
                                <span>${view.type === "relative" ? "超额收益预期" : "目标年化收益"}</span>
                                <input type="number" step="0.1" value="${escapeHtml(String(view.return_delta ?? 0))}" data-bl-view-field="return_delta" data-bl-view-index="${index}" />
                              </label>
                              <label>
                                <span>置信度</span>
                                <input type="range" min="2" max="10" step="1" value="${escapeHtml(String(view.confidence ?? settings.view_confidence ?? 6))}" data-bl-view-field="confidence" data-bl-view-index="${index}" />
                                <strong>${escapeHtml(String(view.confidence ?? settings.view_confidence ?? 6))}</strong>
                              </label>
                            </div>
                            <div class="allocation-view-foot">
                              <div class="allocation-view-note">
                                ${
                                  view.type === "relative"
                                    ? escapeHtml(
                                        `${view.asset || "资产 A"} 相对 ${view.relative_asset || "资产 B"} 未来年化多 ${view.return_delta ?? 0}% · 置信度 ${view.confidence ?? settings.view_confidence ?? 6}/10 · ${blackLittermanConfidenceLabel(view.confidence ?? settings.view_confidence ?? 6)}`
                                      )
                                    : escapeHtml(
                                        `${view.asset || "资产"} 的目标年化收益为 ${view.return_delta ?? 0}% · 置信度 ${view.confidence ?? settings.view_confidence ?? 6}/10 · ${blackLittermanConfidenceLabel(view.confidence ?? settings.view_confidence ?? 6)}`
                                      )
                                }
                              </div>
                              <button type="button" class="allocation-inline-button is-danger" data-bl-view-remove="${index}">删除</button>
                            </div>
                          </article>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }

          <div class="detail-section">
            <h4>风险偏好</h4>
            ${renderChoiceGroup("risk_profile", config.risk_profiles)}
          </div>

          <div class="detail-section">
            <h4>宏观执行倾向</h4>
            ${renderChoiceGroup("macro_stance", config.macro_stances)}
          </div>

          <div class="detail-section">
            <h4>境内 / 海外偏好</h4>
            ${renderChoiceGroup("home_bias", config.home_biases)}
          </div>
        </section>

        <section class="allocation-output-panel">
          <div class="allocation-output-head">
            <div>
              <div class="allocation-output-kicker">Current Macro Anchor</div>
              <h4>${escapeHtml(result.currentMacroState || "当前宏观判断")}</h4>
              <p>${escapeHtml(result.macroSummary || result.calibrationSummary || "")}</p>
            </div>
            <div class="allocation-output-meta">
              <span class="meta-pill">${escapeHtml(result.allocationModel?.label || "")}</span>
              <span class="meta-pill">${escapeHtml(result.riskProfile?.label || "")}</span>
              <span class="meta-pill">${escapeHtml(result.macroStance?.label || "")}</span>
              <span class="meta-pill">${escapeHtml(result.homeBias?.label || "")}</span>
              ${result.confidence ? `<span class="meta-pill">${escapeHtml(result.confidence)}</span>` : ""}
            </div>
          </div>

          <div class="allocation-sleeve-grid">
            ${Object.entries(result.sleeveMix)
              .map(
                ([key, value]) => `
                  <article class="allocation-sleeve-card">
                    <span>${escapeHtml(result.sleeveLabels[key] || key)}</span>
                    <strong>${escapeHtml(formatPercent(value))}</strong>
                  </article>
                `
              )
              .join("")}
          </div>

          <div class="allocation-output-summary">
            <div class="allocation-output-summary-item">
              <span>组合规模</span>
              <strong>${escapeHtml(formatCurrencyCny(result.capital))}</strong>
            </div>
            <div class="allocation-output-summary-item">
              <span>期限</span>
              <strong>${escapeHtml(`${result.years} 年`)}</strong>
            </div>
            <div class="allocation-output-summary-item">
              <span>再平衡</span>
              <strong>${escapeHtml(`季度检查 + ${result.rebalanceThreshold}% 阈值`)}</strong>
            </div>
            ${
              result.stats
                ? `
                  <div class="allocation-output-summary-item">
                    <span>预期收益</span>
                    <strong>${escapeHtml(formatPercent(result.stats.expectedReturn))}</strong>
                  </div>
                  <div class="allocation-output-summary-item">
                    <span>预期波动</span>
                    <strong>${escapeHtml(formatPercent(result.stats.volatility))}</strong>
                  </div>
                  <div class="allocation-output-summary-item">
                    <span>夏普近似</span>
                    <strong>${escapeHtml(Number(result.stats.sharpe || 0).toFixed(2))}</strong>
                  </div>
                `
                : ""
            }
          </div>

          ${buildAllocationPieChartMarkup(result)}

          <div class="allocation-result-table">
            <div class="allocation-result-table-head">
              <span>资产</span>
              <span>权重</span>
              <span>金额</span>
              <span>参考区间</span>
            </div>
            ${result.results
              .map(
                (item) => `
                  <article class="allocation-result-row">
                    <div class="allocation-result-main">
                      <div class="allocation-result-name">${escapeHtml(item.asset_name)}</div>
                      <div class="allocation-result-note">${escapeHtml(item.reason)}</div>
                      ${
                        item.calibration?.reason
                          ? `<div class="allocation-result-calibration">${escapeHtml(item.calibration.reason)}</div>`
                          : ""
                      }
                    </div>
                    <div class="allocation-result-weight">${escapeHtml(formatPercent(item.finalWeight))}</div>
                    <div class="allocation-result-amount">${escapeHtml(formatCurrencyCny(item.amount))}</div>
                    <div class="allocation-result-band">
                      <strong>${escapeHtml(item.weight_band)}</strong>
                      <span>${escapeHtml(item.fitStatus)}</span>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>

          <div class="allocation-output-foot-grid">
            <section class="detail-section allocation-output-foot-card">
              <h4>系统解释</h4>
              <ul>
                <li>${escapeHtml(`长期锚采用 ${result.riskProfile?.label || ""} 档配置，再用 ${result.macroStance?.label || ""} 做阶段性倾斜。`)}</li>
                <li>${escapeHtml(`境内 / 海外偏好当前选择为 ${result.homeBias?.label || ""}，会改变境内外资产的相对得分。`)}</li>
                <li>${escapeHtml(
                  result.allocationModel?.value === "mean_variance"
                    ? "当前使用约束均值-方差：在参考区间内，综合预期收益、波动、相关性和战略锚做优化。"
                    : result.allocationModel?.value === "risk_parity"
                      ? "当前使用风险平价 / 全天候：先按风险预算分配三大风险资产层，再在层内按当前宏观判断和波动约束拆分。"
                      : result.allocationModel?.value === "gtaa"
                        ? "当前使用 GTAA：先用战略锚确定基准，再按跨资产相对强弱做战术倾斜。"
                        : result.allocationModel?.value === "macro_factor_budget"
                          ? "当前使用宏观因子风险预算：先做增长、利率、信用、通胀和安全因子预算，再映射回资产。"
                          : result.allocationModel?.value === "black_litterman"
                            ? "当前使用 Black-Litterman：先用战略锚做先验，再用当前宏观观点形成后验权重。"
                            : result.allocationModel?.value === "goals_based"
                              ? "当前使用目标导向 / 负债约束：先划安全桶，再把剩余资金按增长目标配置。"
                              : result.allocationModel?.value === "core_satellite"
                                ? `当前使用核心-卫星 + 阈值再平衡：核心仓约 ${formatPercent(
                                    result.modelMeta?.coreShare || 0
                                  )} 承接长期中枢，卫星仓约 ${formatPercent(
                                    result.modelMeta?.satelliteShare || 0
                                  )} 表达当前宏观倾向。`
                                : result.allocationModel?.value === "scenario_band"
                                  ? "当前使用情景映射 + 区间权重：先把超配、中性、低配映射到参考区间，再按当前宏观倾向在区间内选位。"
                      : "当前使用系统预算：先按风险档位确定大类资产分层，再顺着当前宏观判断和优先级做分配。"
                )}</li>
              </ul>
            </section>
            <section class="detail-section allocation-output-foot-card">
              <h4>再平衡与提醒</h4>
              <ul>
                <li>${escapeHtml(`默认采用季度检查 + 偏离 ${result.rebalanceThreshold}% 触发。`)}</li>
                ${
                  result.warnings.length
                    ? result.warnings.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
                    : "<li>当前参数下没有触发额外警示，适合按系统结果做首版落地。</li>"
                }
              </ul>
            </section>
          </div>
        </section>
      </div>
    </article>
  `;
}

function bindAllocationWorkbenchControls() {
  const root = document.getElementById("allocation-workbench-card");
  if (!root) return;
  root.querySelectorAll("[data-allocation-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      initializeAllocationWorkbenchState();
      state.allocationWorkbench[button.dataset.allocationChoice] = button.dataset.allocationValue;
      renderAllocationSystem();
    });
  });
  root.querySelectorAll("[data-allocation-input]").forEach((input) => {
    input.addEventListener("change", () => {
      initializeAllocationWorkbenchState();
      state.allocationWorkbench[input.dataset.allocationInput] = clampNumber(Number(input.value || 0), 50000, 50000000);
      renderAllocationSystem();
    });
  });
  root.querySelectorAll("[data-allocation-range]").forEach((input) => {
    input.addEventListener("input", () => {
      initializeAllocationWorkbenchState();
      const key = input.dataset.allocationRange;
      state.allocationWorkbench[key] =
        key === "horizon_years"
          ? clampNumber(Number(input.value || 0), 1, 15)
          : key === "risk_aversion"
            ? clampNumber(Number(input.value || 0), 2, 10)
            : key === "safety_floor_ratio"
              ? clampNumber(Number(input.value || 0), 10, 70)
            : clampNumber(Number(input.value || 0), 3, 10);
      renderAllocationSystem();
    });
  });
  root.querySelectorAll("[data-bl-view-field]").forEach((input) => {
    const syncViewField = () => {
      initializeAllocationWorkbenchState();
      const index = Number(input.dataset.blViewIndex);
      const field = input.dataset.blViewField;
      const nextViews = [...(state.allocationWorkbench.bl_views || [])];
      if (!nextViews[index]) return;
      nextViews[index] = {
        ...nextViews[index],
        [field]: field === "return_delta" || field === "confidence" ? Number(input.value || 0) : input.value,
      };
      if (field === "type" && input.value === "absolute") {
        delete nextViews[index].relative_asset;
      }
      if (field === "type" && input.value === "relative" && !nextViews[index].relative_asset) {
        nextViews[index].relative_asset = nextViews[index].asset;
      }
      state.allocationWorkbench.bl_views = nextViews;
      renderAllocationSystem();
    };
    input.addEventListener("change", syncViewField);
    if (input.tagName === "INPUT") {
      input.addEventListener("input", syncViewField);
    }
  });
  root.querySelectorAll("[data-bl-view-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      initializeAllocationWorkbenchState();
      const index = Number(button.dataset.blViewRemove);
      state.allocationWorkbench.bl_views = (state.allocationWorkbench.bl_views || []).filter((_, i) => i !== index);
      renderAllocationSystem();
    });
  });
  root.querySelectorAll("[data-bl-view-add]").forEach((button) => {
    button.addEventListener("click", () => {
      initializeAllocationWorkbenchState();
      const config = getAllocationWorkbenchConfig();
      const maxViews = Number(config?.black_litterman_settings?.max_views || 6);
      const firstAsset = config?.asset_map?.[0]?.name || "";
      const secondAsset = config?.asset_map?.[1]?.name || firstAsset;
      const nextViews = [...(state.allocationWorkbench.bl_views || [])];
      if (nextViews.length >= maxViews) return;
      nextViews.push({
        type: "relative",
        asset: firstAsset,
        relative_asset: secondAsset,
        return_delta: 1,
        confidence: clampNumber(Number(state.allocationWorkbench.view_confidence || 6), 2, 10),
      });
      state.allocationWorkbench.bl_views = nextViews;
      renderAllocationSystem();
    });
  });
}

function flashAssetCard(assetName) {
  if (!assetName) return;
  const target = document.querySelector(`[data-asset-name="${CSS.escape(assetName)}"]`);
  if (!target) return;
  document.querySelectorAll(".asset-library-card.is-focused").forEach((node) => node.classList.remove("is-focused"));
  target.classList.add("is-focused");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => target.classList.remove("is-focused"), 2200);
}

function handlePathStepClick(step) {
  if (!step || typeof step === "string") return;
  if (step.action === "tab" && step.tab) {
    state.activeAssetFocus = null;
    renderAssets();
    setActiveTab(step.tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (step.action === "scenario" && step.scenario_id) {
    state.activeScenarioId = step.scenario_id;
    renderScenarios();
    setActiveTab("scenarios");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (step.action === "assets") {
    state.activeAssetFocus = {
      title: "研究导航对应资产",
      note: "当前研究导航建议把这组资产联动起来看：先稳住利率债和避险资产，再观察信用与实体确认能否支撑进一步扩风险预算。",
      assets: step.assets || [],
    };
    renderAssets();
    setActiveTab("assets", { preserveAssetFocus: true });
    const assets = step.assets || [];
    if (assets.length) {
      requestAnimationFrame(() => {
        const target = document.querySelector(`[data-asset-name="${CSS.escape(assets[0])}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    return;
  }
  if (step.action === "asset" && step.asset) {
    state.activeAssetFocus = {
      title: "研究导航重点资产",
      note: "当前研究导航已经进入权益扩仓时点的评估阶段，建议重点回到股票资产卡查看驱动、风险与节奏。",
      assets: [step.asset],
    };
    renderAssets();
    setActiveTab("assets", { preserveAssetFocus: true });
    requestAnimationFrame(() => flashAssetCard(step.asset));
  }
}

function bindPathNodes(scopeSelector) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return;
  scope.querySelectorAll("[data-path-step]").forEach((node) => {
    node.addEventListener("click", () => {
      const pathKey = node.dataset.pathKey;
      const steps =
        pathKey === "data"
          ? state.data.current_view?.data_driven_path?.steps || []
          : state.data.current_view?.current_system_path?.steps || [];
      const step = steps[Number(node.dataset.pathStep)];
      handlePathStepClick(step);
    });
  });
}

function renderMethodSystemCard(value) {
  if (!value) return "";
  return `
    <article class="method-card method-system-card">
      <div class="method-system-head">
        <div>
          <div class="method-system-kicker">Asset Allocation System</div>
          <h3>${escapeHtml(value.title)}</h3>
          <p>${escapeHtml(value.summary)}</p>
        </div>
      </div>
      <div class="method-system-grid">
        ${(value.layers || [])
          .map(
            (layer) => `
              <section class="method-system-step-card">
                <div class="method-system-step-top">
                  <span class="method-system-step-no">${escapeHtml(layer.label || "")}</span>
                  <span class="method-system-step-title">${escapeHtml(layer.title || "")}</span>
                </div>
                <div class="method-system-methods">
                  ${(layer.methods || []).map((method) => `<span class="meta-pill">${escapeHtml(method)}</span>`).join("")}
                </div>
                <ul>${(layer.points || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
              </section>
            `
          )
          .join("")}
      </div>
      ${
        value.house_playbook
          ? `
            <div class="method-system-playbook">
              <div class="method-system-playbook-head">
                <h4>${escapeHtml(value.house_playbook.title || "")}</h4>
                <p>${escapeHtml(value.house_playbook.summary || "")}</p>
              </div>
              <ul>${(value.house_playbook.points || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
            </div>
          `
          : ""
      }
    </article>
  `;
}

function renderMethods() {
  const methodsIntro = state.data.config.methods_index_intro;
  renderResearchMapIntro("methods-index-intro", methodsIntro);
  document.getElementById("method-grid").innerHTML = state.data.config.methods
    .map((item) => {
      const linkedReports =
        item.external_report_support?.length ? item.external_report_support : getLinkedReports("by_method", item.title, 2);
      return `
        <article class="method-card">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="method-meta">
            ${item.tags.map((tag) => `<span class="meta-pill">${escapeHtml(tag)}</span>`).join("")}
          </div>
          ${item.system_role ? `<div class="method-role">${escapeHtml(item.system_role)}</div>` : ""}
          <p>${escapeHtml(item.summary)}</p>
          <div class="detail-section">
            <h4>在系统中的用途</h4>
            <ul>${item.usage.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
          </div>
          ${
            (item.source_links || []).length
              ? `
                <div class="detail-section">
                  <h4>网上原始资料</h4>
                  <div class="method-source-list">
                    ${(item.source_links || [])
                      .map(
                        (source) => `
                          <a class="method-source-item" href="${encodePathForHref(source.url)}" target="_blank" rel="noreferrer">
                            <span class="method-source-title">${escapeHtml(source.label)}</span>
                            ${source.note ? `<span class="method-source-note">${escapeHtml(source.note)}</span>` : ""}
                          </a>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
          ${
            linkedReports.length
              ? `
                <div class="detail-section">
                  <h4>相关图表与原报告</h4>
                  ${renderReportSupportBlock(linkedReports, { compact: true })}
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderAllocationSystem() {
  initializeAllocationWorkbenchState();
  renderResearchMapIntro("allocation-system-intro", state.data.config.allocation_system_intro);
  document.getElementById("allocation-system-grid").innerHTML = [
    renderMethodSystemCard(state.data.config.methods_system),
    renderAllocationWorkbench(),
  ].join("");
  bindAllocationWorkbenchControls();
}

function renderAssetIndexIntro() {
  const assetIntro = state.data.config.assets_index_intro;
  renderResearchMapIntro("assets-index-intro", assetIntro);
}

async function init() {
  state.data = await getBundle();
  state.activeScenarioId = state.data.current_view?.current_system_path?.linked_scenario_id || state.activeScenarioId;
  initializeAllocationWorkbenchState();
  initTabs();
  initTopbarOffsetObserver();
  setActiveTab(state.activeTab, { preserveAssetFocus: true });
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-report-review-mode]");
    if (!target) return;
    setReportReviewMode(target.dataset.reportReviewMode);
  });
  renderReportReviewFilter();
  renderHero();
  renderOverview();
  renderFrameworks();
  renderScenarios();
  renderAssets();
  renderAssetIndexIntro();
  renderHistory();
  renderIndicators();
  renderMethods();
  renderAllocationSystem();
}

init();
