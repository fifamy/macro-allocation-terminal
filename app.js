const state = {
  data: null,
  activeTab: "overview",
  activeFrameworkId: null,
  activeScenarioId: null,
  activeAssetFocus: null,
  reportReviewMode: "all",
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
            return `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a></li>`;
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
                return `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a></li>`;
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
                        <a class="macro-reference-item" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
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
          <p>${escapeHtml(item.summary)}</p>
          <div class="detail-section">
            <h4>在系统中的用途</h4>
            <ul>${item.usage.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
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
        </article>
      `;
    })
    .join("");
}

function renderAssetIndexIntro() {
  const assetIntro = state.data.config.assets_index_intro;
  renderResearchMapIntro("assets-index-intro", assetIntro);
}

async function init() {
  state.data = await getBundle();
  state.activeScenarioId = state.data.current_view?.current_system_path?.linked_scenario_id || state.activeScenarioId;
  initTabs();
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
}

init();
