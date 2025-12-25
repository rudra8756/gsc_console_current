/* -------------------------
   GLOBAL VARIABLES
--------------------------*/
let gscData = null;
let charts = {};
let gscLoadingTimer = null;

/* -------------------------
   GLOBAL LOADING EFFECT
--------------------------*/
function gscShowGlobalLoading(duration = 700) {
  const bar = document.getElementById("gscLoadingBar");
  const overlay = document.getElementById("gscLoadingOverlay");
  if (!bar || !overlay) return;

  clearTimeout(gscLoadingTimer);

  bar.classList.add("active");
  overlay.classList.add("visible");

  gscLoadingTimer = setTimeout(() => {
    bar.classList.remove("active");
    overlay.classList.remove("visible");
  }, duration);
}

/* -------------------------
   NAV ACTIVE LINK HIGHLIGHT
--------------------------*/
function gscInitNavHighlight() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".gsc-nav-item");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href === path || (path === "" && href === "index.html")) {
      link.classList.add("active");
    }

    link.addEventListener("click", () => gscShowGlobalLoading(600));
  });
}

/* -------------------------
   DOM LOADED
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  setupSidebarToggle();
  loadData();
  gscInitNavHighlight();
  gscShowGlobalLoading(550);
  initFilterButtons();
});

/* -------------------------
   SIDEBAR TOGGLE
--------------------------*/
function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const openBtn = document.getElementById("openSidebarBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");

  if (openBtn) {
    openBtn.addEventListener("click", () => sidebar.classList.add("open"));
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));
  }

  document.addEventListener("click", (e) => {
    if (window.innerWidth >= 992) return;
    if (!sidebar.classList.contains("open")) return;

    if (!sidebar.contains(e.target) && (!openBtn || !openBtn.contains(e.target))) {
      sidebar.classList.remove("open");
    }
  });
}

/* -------------------------
   LOAD data.json
--------------------------*/
function loadData() {
  fetch("data/data.json")
    .then((res) => res.json())
    .then((data) => {
      gscData = data;
      initPropertyDropdown();

      if (gscData.properties && gscData.properties.length > 0) {
        selectProperty(gscData.properties[0].id);
      }
    })
    .catch((err) => console.error("Error loading data.json", err));
}

/* -------------------------
   PROPERTY DROPDOWN
--------------------------*/
function initPropertyDropdown() {
  const dropdown = document.getElementById("propertyDropdown");
  if (!dropdown || !gscData) return;

  dropdown.innerHTML = "";

  gscData.properties.forEach((prop) => {
    const item = document.createElement("div");
    item.className = "gsc-property-item";
    item.dataset.id = prop.id;

    const iconPath = prop.icon || "images/logo_search_console.svg";

    item.innerHTML = `
      <img src="${iconPath}" class="gsc-property-icon" alt="${prop.label}">
      <div>
        <div class="gsc-property-item-label">${prop.label}</div>
        <div class="gsc-property-item-sub">${prop.type}</div>
      </div>
    `;

    item.addEventListener("click", () => {
      selectProperty(prop.id);
      togglePropertyDropdown(false);
    });

    dropdown.appendChild(item);
  });

  const propertyBtn = document.getElementById("propertyBtn");
  if (propertyBtn) {
    propertyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === "block";
      togglePropertyDropdown(!isOpen);
    });
  }

  document.addEventListener("click", () => togglePropertyDropdown(false));
}

function togglePropertyDropdown(show) {
  const dropdown = document.getElementById("propertyDropdown");
  if (dropdown) dropdown.style.display = show ? "block" : "none";
}

/* -------------------------
   SELECT PROPERTY
--------------------------*/
function selectProperty(id) {
  gscShowGlobalLoading(700);

  if (!gscData || !gscData.properties) return;

  const prop = gscData.properties.find((p) => p.id === id);
  if (!prop) return;

  // Update property label in button
  const labelEl = document.getElementById("selectedPropertyLabel");
  if (labelEl) labelEl.textContent = prop.label;

  // Update Inspect URL placeholder
  const inspectInput = document.getElementById("inspectInput");
  if (inspectInput) {
    inspectInput.placeholder = `Inspect any URL in "https://${prop.label}/"`;
  }

  // Overview top performance metric (total clicks)
  if (prop.performance) {
    const ovClicks = document.getElementById("overviewTotalClicks");
    if (ovClicks) {
      const total = prop.performance.clicks?.reduce((sum, v) => sum + v, 0) || 0;
      ovClicks.textContent = `${total} total web search clicks`;
    }
  }

  // Overview indexing counts
  if (prop.indexing) {
    const notIndexedEl = document.getElementById("overviewIndexingNotIndexed");
    const indexedEl = document.getElementById("overviewIndexingIndexed");

    if (notIndexedEl) {
      notIndexedEl.textContent = (prop.indexing.notIndexed || 0).toLocaleString();
    }
    if (indexedEl) {
      indexedEl.textContent = (prop.indexing.indexed || 0).toLocaleString();
    }
  }

  // Now initialize charts according to page
  updatePageForProperty(prop);
}

/* -------------------------
   PAGE-SPECIFIC INIT
--------------------------*/
function updatePageForProperty(prop) {
  const page = document.body.dataset.page || "overview";

  if (page === "overview") {
    initOverviewForProperty(prop);
  } else if (page === "performance") {
    initPerformanceForProperty(prop);
  } else if (page === "pages") {
    initPagesForProperty(prop);
  } else {
    // Fallback: only performance charts if canvas exists
    initPerformanceForProperty(prop);
  }
}

/* -------------------------
   DESTROY ALL CHART INSTANCES
--------------------------*/
function destroyCharts() {
  Object.values(charts).forEach((c) => {
    if (c && typeof c.destroy === "function") c.destroy();
  });
  charts = {};
}

/* -------------------------
   OVERVIEW PAGE
   Performance + Indexing + Experience + Shopping + Enhancements
--------------------------*/
function initOverviewForProperty(prop) {
  destroyCharts();

  if (!prop) return;

  /* --- PERFORMANCE CHART (main line) --- */
  if (prop.performance) {
    const perf = prop.performance;
    const perfCanvas = document.getElementById("overviewPerformanceChart");
    if (perfCanvas) {
      charts.overviewPerf = createLineChart(
        "overviewPerformanceChart",
        perf.dates || [],
        perf.clicks || [],
        "Total clicks"
      );
    }
  }

  /* --- INDEXING CHART (stacked area) --- */
  if (prop.indexing && prop.indexing.chart) {
    const idx = prop.indexing;
    const idxCanvas = document.getElementById("overviewIndexingChart");
    if (idxCanvas) {
      const ctx = idxCanvas.getContext("2d");
      const notIndexedGradient = ctx.createLinearGradient(0, 0, 0, 400);
      notIndexedGradient.addColorStop(0, "rgba(218, 220, 224, 0.8)");
      notIndexedGradient.addColorStop(1, "rgba(218, 220, 224, 0.2)");

      const indexedGradient = ctx.createLinearGradient(0, 0, 0, 400);
      indexedGradient.addColorStop(0, "rgba(52, 168, 83, 0.8)");
      indexedGradient.addColorStop(1, "rgba(52, 168, 83, 0.2)");

      charts.overviewIndexing = new Chart(ctx, {
        type: "line",
        data: {
          labels: idx.chart.dates || [],
          datasets: [
            {
              label: "Not indexed",
              data: idx.chart.notIndexed || [],
              backgroundColor: notIndexedGradient,
              borderColor: "#dadce0",
              borderWidth: 1,
              fill: true,
              tension: 0.4,
              stack: "pages"
            },
            {
              label: "Indexed",
              data: idx.chart.indexed || [],
              backgroundColor: indexedGradient,
              borderColor: "#34A853",
              borderWidth: 1,
              fill: true,
              tension: 0.4,
              stack: "pages"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: "easeInOutQuart"
          },
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: "#f0f0f0" },
              ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(0,0,0,0.8)",
              titleColor: "#ffffff",
              bodyColor: "#ffffff",
              borderColor: "#34A853",
              borderWidth: 1
            }
          }
        }
      });
    }
  }

  /* --- EXPERIENCE (Core Web Vitals + HTTPS) --- */
  if (prop.experience) {
    const exp = prop.experience;

    // Numbers
    if (exp.cwv) {
      const m = exp.cwv.mobile || {};
      const d = exp.cwv.desktop || {};

      setText("expCwvMobileGood", m.good);
      setText("expCwvMobileNi", m.ni);
      setText("expCwvMobilePoor", m.poor);

      setText("expCwvDesktopGood", d.good);
      setText("expCwvDesktopNi", d.ni);
      setText("expCwvDesktopPoor", d.poor);

      // Trend chart = mobile + desktop combined
      const trendMobile = m.trend || [];
      const trendDesktop = d.trend || [];
      const cwvTrend = sumArrays(trendMobile, trendDesktop);

      createSparklineChart("expCoreVitalsTrend", cwvTrend);
    }

    if (exp.https) {
      const h = exp.https;

      setText("expHttpsGood", h.good);
      setText("expHttpsNi", h.ni);
      setText("expHttpsPoor", h.poor);

      // For demo we keep Non-HTTPS as 0
      setText("expNonHttpsGood", 0);
      setText("expNonHttpsNi", 0);
      setText("expNonHttpsPoor", 0);

      createSparklineChart("expHttpsTrend", h.trend || []);
    }
  }

  /* --- SHOPPING --- */
  if (prop.shopping) {
    const shop = prop.shopping;

    if (shop.product) {
      setText("shopProductValid", shop.product.valid);
      setText("shopProductInvalid", shop.product.invalid);
      createSparklineChart("shopProductTrend", shop.product.trend || []);
    }

    if (shop.merchant) {
      setText("shopMerchantValid", shop.merchant.valid);
      setText("shopMerchantInvalid", shop.merchant.invalid);
      createSparklineChart("shopMerchantTrend", shop.merchant.trend || []);
    }
  }

  /* --- ENHANCEMENTS --- */
  if (prop.enhancements && prop.enhancements.breadcrumbs) {
    const b = prop.enhancements.breadcrumbs;
    setText("enhBreadcrumbValid", b.valid);
    setText("enhBreadcrumbInvalid", b.invalid);
    createSparklineChart("enhBreadcrumbTrend", b.trend || []);
  }
}

/* Helper to safely set innerText */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el != null) {
    el.textContent = (value != null ? value : 0).toString();
  }
}

/* Sum two arrays value-wise (for CWV trend) */
function sumArrays(a, b) {
  const len = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < len; i++) {
    const v1 = a[i] || 0;
    const v2 = b[i] || 0;
    out.push(v1 + v2);
  }
  return out;
}

/* -------------------------
   PERFORMANCE PAGE
   (Multi-line chart + Impressions bar)
--------------------------*/
function initPerformanceForProperty(prop) {
  destroyCharts();

  if (!prop || !prop.performance) return;

  const perfCanvas = document.getElementById("performanceClicksChart");
  if (perfCanvas) {
    const ctx = perfCanvas.getContext("2d");

    // Create gradients for each metric
    const clicksGradient = ctx.createLinearGradient(0, 0, 0, 400);
    clicksGradient.addColorStop(0, "rgba(66, 133, 244, 0.3)");
    clicksGradient.addColorStop(1, "rgba(66, 133, 244, 0.05)");

    const impressionsGradient = ctx.createLinearGradient(0, 0, 0, 400);
    impressionsGradient.addColorStop(0, "rgba(52, 168, 83, 0.3)");
    impressionsGradient.addColorStop(1, "rgba(52, 168, 83, 0.05)");

    const ctrGradient = ctx.createLinearGradient(0, 0, 0, 400);
    ctrGradient.addColorStop(0, "rgba(251, 188, 5, 0.3)");
    ctrGradient.addColorStop(1, "rgba(251, 188, 5, 0.05)");

    const positionGradient = ctx.createLinearGradient(0, 0, 0, 400);
    positionGradient.addColorStop(0, "rgba(234, 67, 53, 0.3)");
    positionGradient.addColorStop(1, "rgba(234, 67, 53, 0.05)");

    charts.perfChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: prop.performance.dates || [],
        datasets: [
          {
            label: "Total clicks",
            data: prop.performance.clicks || [],
            borderColor: "#4285F4",
            backgroundColor: clicksGradient,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            yAxisID: "y"
          },
          {
            label: "Total impressions",
            data: prop.performance.impressions || [],
            borderColor: "#34A853",
            backgroundColor: impressionsGradient,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            yAxisID: "y"
          },
          {
            label: "Average CTR",
            data: prop.performance.ctr || [],
            borderColor: "#FBBC05",
            backgroundColor: ctrGradient,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            yAxisID: "y1"
          },
          {
            label: "Average position",
            data: prop.performance.position || [],
            borderColor: "#EA4335",
            backgroundColor: positionGradient,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            yAxisID: "y2"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: "easeInOutQuart"
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            beginAtZero: true,
            grid: { color: "#f0f0f0" },
            ticks: { font: { size: 12, family: "Roboto, sans-serif" } },
            title: {
              display: true,
              text: "Clicks & Impressions"
            }
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 12, family: "Roboto, sans-serif" } },
            title: {
              display: true,
              text: "CTR (%)"
            }
          },
          y2: {
            type: "linear",
            display: true,
            position: "right",
            beginAtZero: false,
            reverse: true,
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 12, family: "Roboto, sans-serif" } },
            title: {
              display: true,
              text: "Position"
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 12, family: "Roboto, sans-serif" }
            }
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0,0,0,0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#4285F4",
            borderWidth: 1
          }
        }
      }
    });

    const impCanvas = document.getElementById("performanceImpressionsChart");
    if (impCanvas) {
      charts.perfImp = createBarChart(
        "performanceImpressionsChart",
        prop.performance.dates,
        prop.performance.impressions,
        "Impressions"
      );
    }
  }
}

/* -------------------------
   PAGES (INDEXING) PAGE
--------------------------*/
function initPagesForProperty(prop) {
  destroyCharts();

  if (!prop || !prop.indexing) return;

  initPagesIndexingChart(prop);
  initPagesTables(prop);
}

/* -------------------------
   FILTER CHART (PERFORMANCE PAGE)
--------------------------*/
function updateFilterChart(prop, type) {
  if (!prop || !prop.performance) return;

  const labels = prop.performance.dates || [];
  let dataset = [];

  if (type === "clicks") dataset = prop.performance.clicks || [];
  if (type === "impressions") dataset = prop.performance.impressions || [];
  if (type === "ctr") dataset = prop.performance.ctr || [];
  if (type === "position") dataset = prop.performance.position || [];

  if (charts.filterChart) charts.filterChart.destroy();
  charts.filterChart = createLineChart(
    "performanceClicksChart",
    labels,
    dataset,
    type
  );
}

/* -------------------------
   FILTER BUTTON EVENTS (PERFORMANCE)
--------------------------*/
function initFilterButtons() {
  const btns = document.querySelectorAll(".gsc-filter-btn");
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!charts.perfChart) return;

      const type = btn.dataset.filter;
      const datasetIndex = getDatasetIndex(type);

      if (datasetIndex !== -1) {
        const meta = charts.perfChart.getDatasetMeta(datasetIndex);
        meta.hidden = meta.hidden === null ? !charts.perfChart.data.datasets[datasetIndex].hidden : null;
        charts.perfChart.update();
      }

      // Update button active state
      btn.classList.toggle("active");
    });
  });
}

function getDatasetIndex(type) {
  switch (type) {
    case "clicks": return 0;
    case "impressions": return 1;
    case "ctr": return 2;
    case "position": return 3;
    default: return -1;
  }
}

/* -------------------------
   PAGES INDEXING CHART (PAGES PAGE)
--------------------------*/
function initPagesIndexingChart(prop) {
  const idx = prop.indexing;
  if (!idx || !idx.chart) return;

  const notIndexedEl = document.getElementById("pagesNotIndexedCount");
  const indexedEl = document.getElementById("pagesIndexedCount");
  const reasonsLabelEl = document.getElementById("pagesNotIndexedReasons");

  if (notIndexedEl) notIndexedEl.textContent = (idx.notIndexed || 0).toLocaleString();
  if (indexedEl) indexedEl.textContent = (idx.indexed || 0).toLocaleString();
  if (reasonsLabelEl && idx.reasons) {
    reasonsLabelEl.textContent = `${idx.reasons.length} reasons`;
  }

  const ctx = document.getElementById("pagesIndexChart");
  if (!ctx) return;

  charts.pagesIndex = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: idx.chart.dates,
      datasets: [
        {
          label: "Not indexed",
          data: idx.chart.notIndexed,
          backgroundColor: "#dadce0",
          borderWidth: 0,
          stack: "pages"
        },
        {
          label: "Indexed",
          data: idx.chart.indexed,
          backgroundColor: "#188038",
          borderWidth: 0,
          stack: "pages"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: "#e0e0e0" },
          ticks: { font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false }
      }
    }
  });
}

/* -------------------------
   PAGES TABLES (REASONS + IMPROVEMENT)
--------------------------*/
function initPagesTables(prop) {
  if (!prop.indexing) return;
  const idx = prop.indexing;

  // REASONS TABLE
  const reasonsBody = document.getElementById("pagesReasonsBody");
  if (reasonsBody && idx.reasons) {
    reasonsBody.innerHTML = "";
    idx.reasons.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.reason}</td>
        <td>${row.source}</td>
        <td><span class="gsc-badge-status">${row.validation}</span></td>
        <td><canvas class="gsc-trend-canvas" id="pagesReasonTrend-${i}"></canvas></td>
        <td class="text-end">${(row.pages || 0).toLocaleString()}</td>
      `;
      reasonsBody.appendChild(tr);

      createSparklineChart(`pagesReasonTrend-${i}`, row.trend || []);
    });

    const totalEl = document.getElementById("pagesReasonsTotal");
    if (totalEl) totalEl.textContent = idx.reasons.length;
  }

  // IMPROVEMENT TABLE
  const improveBody = document.getElementById("pagesImproveBody");
  if (improveBody && idx.improvement) {
    improveBody.innerHTML = "";
    idx.improvement.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.reason}</td>
        <td>${row.source}</td>
        <td><span class="gsc-badge-status">${row.validation}</span></td>
        <td><canvas class="gsc-trend-canvas" id="pagesImproveTrend-${i}"></canvas></td>
        <td class="text-end">${(row.pages || 0).toLocaleString()}</td>
      `;
      improveBody.appendChild(tr);

      createSparklineChart(`pagesImproveTrend-${i}`, row.trend || []);
    });

    const t1 = document.getElementById("pagesImproveTotal");
    const t2 = document.getElementById("pagesImproveTotal2");
    if (t1) t1.textContent = idx.improvement.length;
    if (t2) t2.textContent = idx.improvement.length;
  }
}

/* -------------------------
   CHART HELPERS
--------------------------*/
function createLineChart(canvasId, labels, data, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(66, 133, 244, 0.3)");
  gradient.addColorStop(1, "rgba(66, 133, 244, 0.05)");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
          {
            label,
            data,
            borderWidth: 3,
            borderColor: "#4285F4",
            backgroundColor: gradient,
            pointRadius: 0,
            tension: 0.4,
            fill: true
          }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: "easeInOutQuart"
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
        },
        y: {
          beginAtZero: false,
          grid: { color: "#f0f0f0" },
          ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "#4285F4",
          borderWidth: 1
        }
      }
    }
  });
}

function createBarChart(canvasId, labels, data, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "#4285F4");
  gradient.addColorStop(1, "#a3c4f3");

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
          {
            label,
            data,
            backgroundColor: gradient,
            borderRadius: 4,
            borderSkipped: false,
            borderWidth: 0,
            pointRadius: 0
          }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: "easeInOutQuart"
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f0f0f0" },
          ticks: { font: { size: 12, family: "Roboto, sans-serif" } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "#4285F4",
          borderWidth: 1
        }
      }
    }
  });
}

/* Sparkline chart used in tables (tiny trend lines & overview tiny charts) */
function createSparklineChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || !data.length) return;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 50);
  gradient.addColorStop(0, "rgba(66, 133, 244, 0.2)");
  gradient.addColorStop(1, "rgba(66, 133, 244, 0.05)");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => i + 1),
      datasets: [
          {
            data,
            borderWidth: 2,
            borderColor: "#4285F4",
            backgroundColor: gradient,
            pointRadius: 0,
            tension: 0.4,
            fill: true
          }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: "easeInOutQuart"
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}
