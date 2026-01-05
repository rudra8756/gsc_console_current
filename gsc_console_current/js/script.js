/* -------------------------
   GLOBAL VARIABLES
--------------------------*/
let gscData = null;
let charts = {};
let gscLoadingTimer = null;
let currentTimeRange = "24hours";
let currentSearchType = "web";
let currentDateRange = null;

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
   LAST UPDATE TIME
--------------------------*/
function updateLastUpdateTime() {
  const lastUpdateEl = document.getElementById("lastUpdateTime");
  if (lastUpdateEl) {
    const now = new Date();
    const timeString = now.toLocaleString();
    lastUpdateEl.textContent = `Last updated: ${timeString}`;
  }
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
/* -------------------------
   DOM LOADED
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  setupSidebarToggle();
  gscInitNavHighlight();
  gscShowGlobalLoading(550);

  // Pehle data load karo
  loadData();

  // Phir filters initialize karo (small delay ke saath)
  setTimeout(() => {
    initFilterButtons();

    const page = document.body.dataset.page || "overview";
    if (page === "performance") {
      initPerformanceFilters();
    } else {
      initOverviewFilters();
    }

    // Scroll to the indexing section below the 24 hours and 7 days buttons
    const indexingSection = document.getElementById("overviewIndexingChart");
    if (indexingSection) {
      indexingSection.scrollIntoView({ behavior: "smooth" });
    }

    // For performance page, scroll to below the 24 hours and 7 days buttons
    if (page === "performance") {
      const statsRow = document.querySelector(".stats-row");
      if (statsRow) {
        statsRow.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Initialize export functionality
    initExportFunctionality();
  }, 100);
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

    if (
      !sidebar.contains(e.target) &&
      (!openBtn || !openBtn.contains(e.target))
    ) {
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
      console.log("Data loaded successfully:", gscData);
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

  // Overview performance metrics
  if (prop.performance) {
    const perf = prop.performance;
    const totalClicks = perf.clicks?.reduce((sum, v) => sum + v, 0) || 0;
    const totalImpressions = perf.impressions?.reduce((sum, v) => sum + v, 0) || 0;
    const avgCtr = perf.ctr?.length ? (perf.ctr.reduce((sum, v) => sum + v, 0) / perf.ctr.length).toFixed(1) : 0;
    const avgPosition = perf.position?.length ? (perf.position.reduce((sum, v) => sum + v, 0) / perf.position.length).toFixed(1) : 0;

    // Update overview performance metrics
    const ovClicks = document.getElementById("overviewTotalClicks");
    const ovImpressions = document.getElementById("overviewTotalImpressions");
    const ovCtr = document.getElementById("overviewAvgCTR");
    const ovPosition = document.getElementById("overviewAvgPosition");

    if (ovClicks) ovClicks.textContent = totalClicks.toLocaleString();
    if (ovImpressions) ovImpressions.textContent = totalImpressions.toLocaleString();
    if (ovCtr) ovCtr.textContent = `${avgCtr}%`;
    if (ovPosition) ovPosition.textContent = avgPosition;
  }

  // Overview indexing counts
  if (prop.indexing) {
    const notIndexedEl = document.getElementById("overviewIndexingNotIndexed");
    const indexedEl = document.getElementById("overviewIndexingIndexed");

    if (notIndexedEl) {
      notIndexedEl.textContent = (
        prop.indexing.notIndexed || 0
      ).toLocaleString();
    }
    if (indexedEl) {
      indexedEl.textContent = (prop.indexing.indexed || 0).toLocaleString();
    }
  }

  // Now initialize charts according to page
  updatePageForProperty(prop);

  // Apply current filters if on overview or performance page
  if (
    document.body.dataset.page === "overview" ||
    document.body.dataset.page === "performance"
  ) {
    applyOverviewFilters();
  }
}

/* -------------------------
   PAGE-SPECIFIC INIT
--------------------------*/
function updatePageForProperty(prop) {
  const page = document.body.dataset.page || "overview";
  console.log("updatePageForProperty called for page:", page);

  if (page === "overview") {
    console.log("Initializing overview for property");
    initOverviewForProperty(prop);
  } else if (page === "performance") {
    console.log("Initializing performance for property");
    initPerformanceForProperty(prop);
  } else if (page === "pages") {
    initPagesForProperty(prop);
  } else {
    // Fallback: only performance charts if canvas exists
    console.log("Fallback: initializing performance for property");
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

  /* --- PERFORMANCE CHART (multi-line with all metrics) --- */
  if (prop.performance) {
    const perf = prop.performance;
    const perfCanvas = document.getElementById("overviewPerformanceChart");
    if (perfCanvas) {
      const datasets = [
        {
          label: "Total clicks",
          data: perf.clicks || [],
          borderWidth: 2.5,
          borderColor: "#4285f4",
          backgroundColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          yAxisID: "y",
        },
        {
          label: "Total impressions",
          data: perf.impressions || [],
          borderWidth: 2.5,
          borderColor: "#673ab7",
          backgroundColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          yAxisID: "y",
        },
        {
          label: "Average CTR",
          data: perf.ctr || [],
          borderWidth: 2.5,
          borderColor: "#00897b",
          backgroundColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          yAxisID: "y1",
        },
        {
          label: "Average position",
          data: perf.position || [],
          borderWidth: 2.5,
          borderColor: "#ef6c00",
          backgroundColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          yAxisID: "y1",
        },
      ];

      charts.overviewPerf = new Chart(perfCanvas.getContext("2d"), {
        type: "line",
        data: {
          labels: perf.dates || [],
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            line: {
              tension: 0,
              borderWidth: 2.5,
            },
            point: {
              radius: 0,
              hoverRadius: 4,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#5F6368"
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "left",
              beginAtZero: false,
              grid: { display: false },
              ticks: {
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#5F6368"
              },
              title: {
                display: true,
                text: "Clicks & Impressions",
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#5F6368"
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              beginAtZero: false,
              grid: { display: false },
              ticks: {
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#5F6368",
                reverse: true
              },
              title: {
                display: true,
                text: "CTR & Position",
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#5F6368"
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                font: { size: 12, family: "Roboto, Arial, sans-serif" },
                color: "#202124"
              },
            },
            tooltip: {
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              titleColor: "#202124",
              bodyColor: "#5F6368",
              borderColor: "#E0E0E0",
              borderWidth: 1,
              cornerRadius: 8,
              titleFont: { size: 12, family: "Roboto, Arial, sans-serif" },
              bodyFont: { size: 12, family: "Roboto, Arial, sans-serif" }
            },
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
        },
      });
    }
  }

  /* --- INDEXING CHART (stacked bar) --- */
  if (prop.indexing && prop.indexing.chart) {
    const idx = prop.indexing;
    const idxCanvas = document.getElementById("overviewIndexingChart");
    if (idxCanvas) {
      charts.overviewIndexing = new Chart(idxCanvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: idx.chart.dates || [],
          datasets: [
            {
              label: "Not indexed",
              data: idx.chart.notIndexed || [],
              backgroundColor: "#dadce0",
              borderWidth: 0,
              stack: "pages",
            },
            {
              label: "Indexed",
              data: idx.chart.indexed || [],
              backgroundColor: "#188038",
              borderWidth: 0,
              stack: "pages",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
          },
        },
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
  if (prop.enhancements) {
    const enh = prop.enhancements;

    // Breadcrumbs
    if (enh.breadcrumbs) {
      setText("enhBreadcrumbValid", enh.breadcrumbs.valid);
      setText("enhBreadcrumbInvalid", enh.breadcrumbs.invalid);
      createSparklineChart("enhBreadcrumbTrend", enh.breadcrumbs.trend || []);
    }

    // FAQ
    if (enh.faq) {
      setText("enhFaqValid", enh.faq.valid);
      setText("enhFaqInvalid", enh.faq.invalid);
      createSparklineChart("enhFaqTrend", enh.faq.trend || []);
    }

    // Sitelinks
    if (enh.sitelinks) {
      setText("enhSitelinksValid", enh.sitelinks.valid);
      setText("enhSitelinksInvalid", enh.sitelinks.invalid);
      createSparklineChart("enhSitelinksTrend", enh.sitelinks.trend || []);
    }

    // Products
    if (enh.products) {
      setText("enhProductsValid", enh.products.valid);
      setText("enhProductsInvalid", enh.products.invalid);
      createSparklineChart("enhProductsTrend", enh.products.trend || []);
    }

    // Mobile Usability
    if (enh.mobile_usability) {
      setText("enhMobileUsabilityValid", enh.mobile_usability.valid);
      setText("enhMobileUsabilityInvalid", enh.mobile_usability.invalid);
      createSparklineChart(
        "enhMobileUsabilityTrend",
        enh.mobile_usability.trend || []
      );
    }
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
   (Filter chart + Impressions bar)
--------------------------*/
function initPerformanceForProperty(prop) {
  console.log("initPerformanceForProperty called with prop:", prop);
  destroyCharts();

  if (!prop || !prop.performance) {
    console.log("No property or performance data provided");
    return;
  }

  // Update performance metric bars
  if (prop.performance) {
    const perf = prop.performance;
    const totalClicks = perf.clicks?.reduce((sum, v) => sum + v, 0) || 0;
    const totalImpressions =
      perf.impressions?.reduce((sum, v) => sum + v, 0) || 0;
    const avgCtr = perf.ctr?.length
      ? (perf.ctr.reduce((sum, v) => sum + v, 0) / perf.ctr.length).toFixed(1)
      : 0;
    const avgPosition = perf.position?.length
      ? (
          perf.position.reduce((sum, v) => sum + v, 0) / perf.position.length
        ).toFixed(1)
      : 0;

    // Update stat-box values
    const clicksValue = document.querySelector(".stat-box.blue.active .value");
    const impressionsValue = document.querySelector(".stat-box.purple.active .value");
    const ctrValue = document.querySelector(".stat-box.green.active .value");
    const positionValue = document.querySelector(".stat-box.orange.active .value");

    if (clicksValue) clicksValue.textContent = totalClicks.toLocaleString();
    if (impressionsValue)
      impressionsValue.textContent = totalImpressions.toLocaleString();
    if (ctrValue) ctrValue.textContent = `${avgCtr}%`;
    if (positionValue) positionValue.textContent = avgPosition;

    // Update total clicks display
    const totalClicksDisplay = document.getElementById(
      "performanceTotalClicks"
    );
    if (totalClicksDisplay)
      totalClicksDisplay.textContent = totalClicks.toLocaleString();
  }

  // Initialize performance filters
  initPerformanceFilters();

  // Initialize dimension tabs and table
  initDimensionTabs();
  initTableSorting();
  updateTableData("queries"); // Default to queries

  // Set all metric buttons as active by default for overlapping graphs
  const metricBtns = document.querySelectorAll(".gsc-filter-btn");
  metricBtns.forEach((btn) => btn.classList.add("active"));

  // Use setTimeout to ensure DOM is fully ready
  setTimeout(() => {
    console.log("setTimeout triggered for performance charts");
    const perfCanvas = document.getElementById("performanceClicksChart");
    console.log("Performance canvas found:", !!perfCanvas);
    if (perfCanvas) {
      updateFilterChart(prop);
      console.log("Filter chart updated");

      // Initialize with default filter (queries) data
      updatePerformanceFilterData("queries");
      console.log("Performance filter data updated with queries");
    }
  }, 100);
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
function updateFilterChart(prop) {
  if (!prop || !prop.performance) return;

  const labels = prop.performance.dates || [];
  const datasets = [];

  // Get active cards to determine which metrics to show
  const activeCards = document.querySelectorAll(".stat-box.active");
  const activeFilters = Array.from(activeCards).map(
    (card) => card.dataset.filter
  );

  // Only show metrics for active cards
  const metrics = [
    {
      type: "clicks",
      data: prop.performance.clicks || [],
      label: "Total clicks",
      color: "#4285f4", // Blue (matches stat-box blue)
      yAxisID: "y",
      fill: false,
      backgroundColor: "transparent",
    },
    {
      type: "impressions",
      data: prop.performance.impressions || [],
      label: "Total impressions",
      color: "#673ab7", // Purple (matches stat-box purple)
      yAxisID: "y",
      fill: false,
      backgroundColor: "transparent",
    },
    {
      type: "ctr",
      data: prop.performance.ctr || [],
      label: "Average CTR",
      color: "#00897b", // Green (matches stat-box green)
      yAxisID: "y1",
      fill: false,
      backgroundColor: "transparent",
    },
    {
      type: "position",
      data: prop.performance.position || [],
      label: "Average position",
      color: "#ef6c00", // Orange (matches stat-box orange)
      yAxisID: "y1",
      fill: false,
      backgroundColor: "transparent",
    },
  ];

  // Only add datasets for active filters
  metrics.forEach((metric) => {
    if (activeFilters.includes(metric.type)) {
      datasets.push({
        label: metric.label,
        data: metric.data,
        borderWidth: 2.5,
        borderColor: metric.color,
        backgroundColor: metric.backgroundColor,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0,
        fill: metric.fill,
        yAxisID: metric.yAxisID,
      });
    }
  });

  if (charts.filterChart) charts.filterChart.destroy();
  charts.filterChart = createMultiLineChart(
    "performanceClicksChart",
    labels,
    datasets
  );
}

/* -------------------------
   METRIC CARD EVENTS (PERFORMANCE)
--------------------------*/
function initFilterButtons() {
  const cards = document.querySelectorAll(".gsc-metric-card");
  if (!cards.length) return;

  // Set default state: all metrics active
  cards.forEach((card) => {
    card.classList.add("active");
  });

  /* 🔥 CHECKBOX → CARD → GRAPH SYNC */
  cards.forEach((card) => {
    const checkbox = card.querySelector("input[type='checkbox']");
    if (!checkbox) return;

    checkbox.addEventListener("change", (e) => {
      e.stopPropagation(); // prevent card click

      const isChecked = checkbox.checked;

      // At least one card active rahe
      const activeCards = document.querySelectorAll(".gsc-metric-card.active");
      if (!isChecked && activeCards.length <= 1) {
        checkbox.checked = true;
        return;
      }

      card.classList.toggle("active", isChecked);

      const currentLabel = document.getElementById(
        "selectedPropertyLabel"
      )?.textContent;

      const prop = gscData?.properties?.find((p) => p.label === currentLabel);
      if (!prop) return;

      updateFilterChart(prop);
      // Update stat boxes after chart update
      updatePerformanceStatBoxes(prop);
    });

    // Card click (entire card is clickable)
    card.addEventListener("click", (e) => {
      if (e.target.type !== "checkbox") {
        const checkbox = card.querySelector("input[type='checkbox']");
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change"));
        }
      }
    });

    // Prevent checkbox from being clicked separately
    if (checkbox) {
      checkbox.style.pointerEvents = "none";
    }
  });
}

/* -------------------------
   PERFORMANCE FILTERS (DROPDOWNS AND BUTTONS)
--------------------------*/
function initPerformanceFilters() {
  // Performance filter buttons (queries, pages, countries, etc.)
  const perfFilterBtns = document.querySelectorAll(".gsc-perf-filter-btn");
  perfFilterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filterType = e.target.dataset.filter;
      // Update active state
      perfFilterBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      console.log("Performance filter selected:", filterType);
      // Update chart data based on filter type
      updatePerformanceFilterData(filterType);
    });
  });
  // Time Range Buttons (for performance page)
  const timeButtons = document.querySelectorAll(
    ".gsc-time-pill-btn[data-value]"
  );
  timeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const value = e.target.dataset.value;
      currentTimeRange = value;
      // Update active state for buttons
      timeButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      applyTimeRangeFilter();
    });
  });

  // More dropdown options (for performance page)
  const moreOptions = document.querySelectorAll(".gsc-time-option");
  moreOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const value = e.target.dataset.value;
      if (value === "date_filter") {
        // Open date range modal
        const modal = new bootstrap.Modal(
          document.getElementById("dateRangeModal")
        );
        modal.show();
        return;
      }
      currentTimeRange = value;
      // Close dropdown
      const dropdown = bootstrap.Dropdown.getInstance(
        document.getElementById("moreTimeDropdown")
      );
      if (dropdown) dropdown.hide();
      applyTimeRangeFilter();
    });
  });

  // Search Type Dropdown
  const searchTypeDropdown = document.getElementById("searchTypeDropdown");
  if (searchTypeDropdown) {
    const searchTypeItems = document.querySelectorAll(
      "#searchTypeDropdown + .dropdown-menu .dropdown-item"
    );
    searchTypeItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const value = e.target.dataset.value;
        searchTypeDropdown.textContent = `Search type: ${e.target.textContent}`;
        // Update active state in dropdown
        searchTypeItems.forEach((i) => i.classList.remove("active"));
        e.target.classList.add("active");
        currentSearchType = value;
        console.log("Search type selected:", value);
        // TODO: Filter data based on search type
      });
    });
  }

  // Add Filter Button
  const addFilterBtn = document.getElementById("addFilterBtn");
  if (addFilterBtn) {
    addFilterBtn.addEventListener("click", () => {
      console.log("Add filter clicked");
      alert(
        "Add filter functionality - this would open a filter modal in a real implementation"
      );
      // TODO: Open filter modal or add filter logic
    });
  }

  // Date Range Modal Functionality
  const customRadio = document.getElementById("custom");
  const customDateRange = document.getElementById("customDateRange");
  const applyDateRangeBtn = document.getElementById("applyDateRange");

  if (customRadio && customDateRange) {
    customRadio.addEventListener("change", () => {
      if (customRadio.checked) {
        customDateRange.style.display = "block";
      }
    });

    // Hide custom date range when other options are selected
    document.querySelectorAll('input[name="dateRange"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value !== "custom") {
          customDateRange.style.display = "none";
        }
      });
    });
  }

  if (applyDateRangeBtn) {
    applyDateRangeBtn.addEventListener("click", () => {
      const selectedRange = document.querySelector(
        'input[name="dateRange"]:checked'
      ).value;

      if (selectedRange === "custom") {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (!startDate || !endDate) {
          alert("Please select both start and end dates.");
          return;
        }

        // Apply custom date range
        currentTimeRange = "custom";
        currentDateRange = { start: startDate, end: endDate };

        // Update More button text to show custom range
        const moreBtn = document.querySelector(".gsc-more-btn");
        if (moreBtn) {
          moreBtn.textContent = `Custom (${startDate} – ${endDate})`;
        }
      } else {
        // Apply predefined range
        currentTimeRange = selectedRange;
        currentDateRange = null;

        // Update More button text
        const rangeLabels = {
          "6months": "Last 6 months",
          "12months": "Last 12 months",
          "16months": "Last 16 months",
        };
        const moreBtn = document.querySelector(".gsc-more-btn");
        if (moreBtn) {
          moreBtn.textContent = rangeLabels[selectedRange] || "More";
        }
      }

      // Close modal and apply filter
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("dateRangeModal")
      );
      modal.hide();
      applyTimeRangeFilter();
    });
  }

  // Reset Filters Button
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      console.log("Reset filters clicked");
      // Reset time range to default
      if (timeRangeDropdown) {
        timeRangeDropdown.textContent = "24 hours";
        const timeRangeItems = document.querySelectorAll(
          "#timeRangeDropdown + .dropdown-menu .dropdown-item"
        );
        timeRangeItems.forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.value === "24hours") {
            item.classList.add("active");
          }
        });
      }
      // Reset search type to default
      if (searchTypeDropdown) {
        searchTypeDropdown.textContent = "Search type: Web";
        const searchTypeItems = document.querySelectorAll(
          "#searchTypeDropdown + .dropdown-menu .dropdown-item"
        );
        searchTypeItems.forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.value === "web") {
            item.classList.add("active");
          }
        });
      }
      // Reset More button to default
      const moreBtn = document.querySelector(".gsc-more-btn");
      if (moreBtn) {
        moreBtn.textContent = "More";
      }
      currentTimeRange = "24hours";
      currentDateRange = null;
      // TODO: Reset any additional filters
      applyTimeRangeFilter();
    });
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

  if (notIndexedEl)
    notIndexedEl.textContent = (idx.notIndexed || 0).toLocaleString();
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
          stack: "pages",
        },
        {
          label: "Indexed",
          data: idx.chart.indexed,
          backgroundColor: "#188038",
          borderWidth: 0,
          stack: "pages",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: "#e0e0e0" },
          ticks: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
    },
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

  return new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderWidth: 2,
          borderColor: "#1a73e8",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0, // 🔥 SHARP LINE
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: false,
          grid: { display: false },
          ticks: { font: { size: 11 } },
          reverse: label === "ctr" || label === "position",
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function createMultiLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: {
        line: {
          tension: 0, // Sharp lines like Google
          borderWidth: 2, // Exact Google line thickness
        },
        point: {
          radius: 0, // No points like Google
          hoverRadius: 4,
        },
      },
      scales: {
        x: {
          grid: { display: false }, // No vertical grid lines
          ticks: {
            font: {
              size: 12, // Google axis font size
              family: "Roboto, Arial, sans-serif" // Google font
            },
            color: "#5F6368" // Google axis text color
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          beginAtZero: false,
          grid: { display: false },
          ticks: {
            font: {
              size: 12,
              family: "Roboto, Arial, sans-serif"
            },
            color: "#5F6368"
          },
          title: {
            display: true,
            text: "Clicks & Impressions",
            font: {
              size: 12,
              family: "Roboto, Arial, sans-serif"
            },
            color: "#5F6368"
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          beginAtZero: false,
          grid: { drawOnChartArea: false }, // No grid on right axis
          ticks: {
            font: {
              size: 12,
              family: "Roboto, Arial, sans-serif"
            },
            color: "#5F6368",
            reverse: true // For CTR and position
          },
          title: {
            display: true,
            text: "CTR & Position",
            font: {
              size: 12,
              family: "Roboto, Arial, sans-serif"
            },
            color: "#5F6368"
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: {
              size: 12,
              family: "Roboto, Arial, sans-serif"
            },
            color: "#202124"
          },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const chart = legend.chart;
            chart.toggleDataVisibility(index);
            chart.update();
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#202124",
          bodyColor: "#5F6368",
          borderColor: "#E0E0E0",
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            size: 12,
            family: "Roboto, Arial, sans-serif"
          },
          bodyFont: {
            size: 12,
            family: "Roboto, Arial, sans-serif"
          }
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
    },
  });
}

function createDualLineChart(canvasId, labels, data1, data2, label1, label2) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: label1,
          data: data1,
          borderWidth: 3,
          borderColor: "#1a73e8",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: false,
          cubicInterpolationMode: "monotone",
        },
        {
          label: label2,
          data: data2,
          borderWidth: 1.5,
          borderColor: "#34a853",
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: false,
          cubicInterpolationMode: "monotone",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: false,
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function createBarChart(canvasId, labels, data, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: "#a3c4f3",
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

/* Sparkline chart used in tables (tiny trend lines & overview tiny charts) */
function createSparklineChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || !data.length) return;

  new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map((_, i) => i + 1),
      datasets: [
        {
          data,
          borderWidth: 1.5,
          borderColor: "#5f6368",
          pointRadius: 0,
          tension: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { display: false },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
}

// NAV ACTIVE LINK HIGHLIGHT

document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".gsc-nav-item").forEach((item) => {
    const page = item.getAttribute("href");
    if (page === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
});

/* -------------------------
   OVERVIEW FILTERS
--------------------------*/
function initOverviewFilters() {
  // Time Range Buttons
  const timeButtons = document.querySelectorAll(
    ".gsc-time-pill-btn[data-value]"
  );
  timeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const value = e.target.dataset.value;
      currentTimeRange = value;
      // Update active state for buttons
      timeButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      applyTimeRangeFilter();
    });
  });

  // Date Range Modal Functionality
  const customRadio = document.getElementById("custom");
  const customDateRange = document.getElementById("customDateRange");
  const applyDateRangeBtn = document.getElementById("applyDateRange");

  if (customRadio && customDateRange) {
    customRadio.addEventListener("change", function () {
      if (this.checked) {
        customDateRange.style.display = "block";
      }
    });

    // Hide custom date range when other options are selected
    document.querySelectorAll('input[name="dateRange"]').forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.value !== "custom") {
          customDateRange.style.display = "none";
        }
      });
    });
  }

  if (applyDateRangeBtn) {
    applyDateRangeBtn.addEventListener("click", function () {
      const selectedRange = document.querySelector(
        'input[name="dateRange"]:checked'
      );
      if (selectedRange) {
        let value;
        if (selectedRange.value === "custom") {
          const startDate = document.getElementById("startDate").value;
          const endDate = document.getElementById("endDate").value;
          if (startDate && endDate) {
            value = `custom_${startDate}_${endDate}`;
          } else {
            alert("Please select both start and end dates.");
            return;
          }
        } else {
          value = selectedRange.value;
        }
        currentTimeRange = value;
        applyTimeRangeFilter();
        // Close modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("dateRangeModal")
        );
        modal.hide();
      }
    });
  }

  // More dropdown options
  const moreOptions = document.querySelectorAll(".gsc-time-option");
  moreOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const value = e.target.dataset.value;
      currentTimeRange = value;
      // Close dropdown
      const dropdown = bootstrap.Dropdown.getInstance(
        document.getElementById("moreTimeDropdown")
      );
      if (dropdown) dropdown.hide();
      applyTimeRangeFilter();
    });
  });

  // Date Range Modal
  const modal = document.getElementById("gscDateModal");
  if (modal) {
    document.getElementById("openDateRange").addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "flex";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

    modal.querySelector(".cancel").addEventListener("click", () => {
      modal.style.display = "none";
    });

    // Show/hide custom date
    const radios = modal.querySelectorAll('input[name="date"]');
    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const customDate = modal.querySelector(".gsc-custom-date");
        if (radio.value === "custom") {
          customDate.style.display = "flex";
        } else {
          customDate.style.display = "none";
        }
      });
    });

    // Initially hide custom date
    modal.querySelector(".gsc-custom-date").style.display = "none";

    modal.querySelector(".apply").addEventListener("click", () => {
      const selectedRadio = modal.querySelector('input[name="date"]:checked');
      if (selectedRadio) {
        const value = selectedRadio.value;
        if (value === "custom") {
          const startDate = modal.querySelector(
            'input[type="date"]:first-of-type'
          ).value;
          const endDate = modal.querySelector(
            'input[type="date"]:last-of-type'
          ).value;
          if (startDate && endDate) {
            currentTimeRange = "custom";
            currentDateRange = { start: startDate, end: endDate };
          }
        } else {
          currentTimeRange = value;
          currentDateRange = null;
        }
        modal.style.display = "none";
        applyTimeRangeFilter();
      }
    });
  }

  // Reset Filters Button
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      // Reset time range buttons to default
      const timeButtons = document.querySelectorAll(".gsc-time-btn");
      timeButtons.forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.value === "24hours") {
          btn.classList.add("active");
        }
      });

      // Reset search type to default
      const searchTypeDropdown = document.getElementById("searchTypeDropdown");
      if (searchTypeDropdown) {
        searchTypeDropdown.textContent = "Search type: Web";
        const searchTypeItems = document.querySelectorAll(
          "#searchTypeDropdown + .dropdown-menu .dropdown-item"
        );
        searchTypeItems.forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.value === "web") {
            item.classList.add("active");
          }
        });
      }
      currentTimeRange = "24hours";
      currentSearchType = "web";
      currentDateRange = null;
      applyTimeRangeFilter();
    });
  }
}

function applyTimeRangeFilter() {
  if (!gscData || !gscData.properties) return;

  const currentLabel = document.getElementById(
    "selectedPropertyLabel"
  )?.textContent;
  const prop = gscData.properties.find((p) => p.label === currentLabel);
  if (!prop) return;

  // Create filtered property based on time range
  const filteredProp = filterPropertyByTimeRange(prop, currentTimeRange);

  // Update charts with filtered data
  if (document.body.dataset.page === "overview") {
    initOverviewForProperty(filteredProp);
  } else if (document.body.dataset.page === "performance") {
    initPerformanceForProperty(filteredProp);
    // Ensure stat boxes are updated with filtered data
    const perf = filteredProp.performance;
    const totalClicks = perf.clicks?.reduce((sum, v) => sum + v, 0) || 0;
    const totalImpressions = perf.impressions?.reduce((sum, v) => sum + v, 0) || 0;
    const avgCtr = perf.ctr?.length ? (perf.ctr.reduce((sum, v) => sum + v, 0) / perf.ctr.length).toFixed(1) : 0;
    const avgPosition = perf.position?.length ? (perf.position.reduce((sum, v) => sum + v, 0) / perf.position.length).toFixed(1) : 0;

    const clicksValue = document.querySelector(".stat-box.blue .value");
    const impressionsValue = document.querySelector(".stat-box.purple .value");
    const ctrValue = document.querySelector(".stat-box.green .value");
    const positionValue = document.querySelector(".stat-box.orange .value");

    if (clicksValue) clicksValue.textContent = totalClicks.toLocaleString();
    if (impressionsValue) impressionsValue.textContent = totalImpressions.toLocaleString();
    if (ctrValue) ctrValue.textContent = `${avgCtr}%`;
    if (positionValue) positionValue.textContent = avgPosition;
  }

  // Update last update time when filters are applied
  updateLastUpdateTime();
}

function updatePerformanceStatBoxes(prop) {
  if (!prop || !prop.performance) return;

  const perf = prop.performance;
  const totalClicks = perf.clicks?.reduce((sum, v) => sum + v, 0) || 0;
  const totalImpressions =
    perf.impressions?.reduce((sum, v) => sum + v, 0) || 0;
  const avgCtr = perf.ctr?.length
    ? (perf.ctr.reduce((sum, v) => sum + v, 0) / perf.ctr.length).toFixed(1)
    : 0;
  const avgPosition = perf.position?.length
    ? (
        perf.position.reduce((sum, v) => sum + v, 0) / perf.position.length
      ).toFixed(1)
    : 0;

  // Update stat-box values
  const clicksValue = document.querySelector(".stat-box.blue .value");
  const impressionsValue = document.querySelector(".stat-box.purple .value");
  const ctrValue = document.querySelector(".stat-box.green .value");
  const positionValue = document.querySelector(".stat-box.orange .value");

  if (clicksValue) clicksValue.textContent = totalClicks.toLocaleString();
  if (impressionsValue)
    impressionsValue.textContent = totalImpressions.toLocaleString();
  if (ctrValue) ctrValue.textContent = `${avgCtr}%`;
  if (positionValue) positionValue.textContent = avgPosition;
}

function filterPropertyByTimeRange(prop, timeRange) {
  if (!prop || !prop.performance) return prop;

  const originalDates = prop.performance.dates;
  const originalClicks = prop.performance.clicks;
  const originalImpressions = prop.performance.impressions;
  const originalCtr = prop.performance.ctr;
  const originalPosition = prop.performance.position;

  let filteredIndices = [];

  if (timeRange === "custom" && currentDateRange) {
    // Filter by custom date range
    const startDate = new Date(currentDateRange.start);
    const endDate = new Date(currentDateRange.end);

    originalDates.forEach((dateStr, index) => {
      const date = new Date(dateStr);
      if (date >= startDate && date <= endDate) {
        filteredIndices.push(index);
      }
    });
  } else {
    // Calculate how many data points to show based on time range
    let dataPoints = originalDates.length;

    switch (timeRange) {
      case "24hours":
        dataPoints = Math.min(7, originalDates.length); // Show last 7 days for 24 hours view to display a graph
        break;
      case "7days":
        dataPoints = Math.min(7, originalDates.length);
        break;
      case "28days":
        dataPoints = Math.min(28, originalDates.length);
        break;
      case "3months":
        dataPoints = Math.min(90, originalDates.length);
        break;
      case "6months":
        dataPoints = Math.min(180, originalDates.length);
        break;
      case "12months":
        dataPoints = Math.min(365, originalDates.length);
        break;
      case "16months":
        dataPoints = Math.min(480, originalDates.length);
        break;
      case "18months":
        dataPoints = Math.min(540, originalDates.length);
        break;
      case "2years":
        dataPoints = Math.min(730, originalDates.length);
        break;
      case "3years":
        dataPoints = originalDates.length; // Show all data
        break;
      default:
        dataPoints = originalDates.length;
    }

    // Get last N indices
    for (
      let i = originalDates.length - dataPoints;
      i < originalDates.length;
      i++
    ) {
      filteredIndices.push(i);
    }
  }

  // Create filtered property
  const filteredProp = JSON.parse(JSON.stringify(prop)); // Deep clone

  // Filter performance data
  filteredProp.performance.dates = filteredIndices.map((i) => originalDates[i]);
  filteredProp.performance.clicks = filteredIndices.map(
    (i) => originalClicks[i]
  );
  filteredProp.performance.impressions = filteredIndices.map(
    (i) => originalImpressions[i]
  );
  filteredProp.performance.ctr = filteredIndices.map((i) => originalCtr[i]);
  filteredProp.performance.position = filteredIndices.map(
    (i) => originalPosition[i]
  );

  // Also filter overview indexing data if it exists
  if (filteredProp.overviewIndexing) {
    const origOverviewDates = filteredProp.overviewIndexing.dates;
    const origOverviewIndexed = filteredProp.overviewIndexing.indexed;
    const origOverviewNotIndexed = filteredProp.overviewIndexing.notIndexed;

    filteredProp.overviewIndexing.dates = filteredIndices.map(
      (i) => origOverviewDates[i]
    );
    filteredProp.overviewIndexing.indexed = filteredIndices.map(
      (i) => origOverviewIndexed[i]
    );
    filteredProp.overviewIndexing.notIndexed = filteredIndices.map(
      (i) => origOverviewNotIndexed[i]
    );
  }

  return filteredProp;
}

function applyOverviewFilters() {
  // This function is now replaced by applyTimeRangeFilter
  applyTimeRangeFilter();
}

/* -------------------------
   PERFORMANCE FILTER DATA UPDATE
--------------------------*/
function updatePerformanceFilterData(filterType) {
  if (!gscData || !gscData.properties) return;

  const currentLabel = document.getElementById(
    "selectedPropertyLabel"
  )?.textContent;
  const prop = gscData.properties.find((p) => p.label === currentLabel);
  if (!prop || !prop.performance) return;

  let filterData = [];
  let labels = [];
  let title = "";

  switch (filterType) {
    case "queries":
      filterData = prop.performance.queries || [];
      labels = filterData.map((item) => item.query);
      title = "Top Queries";
      break;
    case "pages":
      filterData = prop.performance.pages || [];
      labels = filterData.map((item) => item.page);
      title = "Top Pages";
      break;
    case "countries":
      filterData = prop.performance.countries || [];
      labels = filterData.map((item) => item.country);
      title = "Top Countries";
      break;
    case "devices":
      filterData = prop.performance.devices || [];
      labels = filterData.map((item) => item.device);
      title = "Device Performance";
      break;
    case "search_appearance":
      filterData = prop.performance.search_appearance || [];
      labels = filterData.map((item) => item.appearance);
      title = "Search Appearance";
      break;
    case "days":
      filterData = prop.performance.dates.map((date, index) => ({
        date: date,
        clicks: prop.performance.clicks[index] || 0,
        impressions: prop.performance.impressions[index] || 0,
        ctr: prop.performance.ctr[index] || 0,
        position: prop.performance.position[index] || 0,
      }));
      labels = filterData.map((item) => item.date);
      title = "Performance by Day";
      break;

      labels = filterData.map((item) => item.date);
      title = "Performance by Days";
      break;
    default:
      return;
  }

  // Update the impressions chart with filtered data
  const clicksData = filterData.map((item) => item.clicks);
  const impressionsData = filterData.map((item) => item.impressions);

  // Destroy existing impressions chart
  if (charts.perfImp) {
    charts.perfImp.destroy();
  }

  // Create new bar chart with filtered data
  const impCanvas = document.getElementById("performanceImpressionsChart");
  if (impCanvas) {
    charts.perfImp = new Chart(impCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Impressions",
            data: impressionsData,
            backgroundColor: "#a3c4f3",
            borderWidth: 0,
          },
          {
            label: "Clicks",
            data: clicksData,
            backgroundColor: "#1a73e8",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
        },
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: { mode: "index", intersect: false },
          title: {
            display: true,
            text: title,
          },
        },
      },
    });
  }
}

/* -------------------------
   DIMENSION TABS
--------------------------*/
function initDimensionTabs() {
  const tabs = document.querySelectorAll(".gsc-dimension-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");
      // Update table data
      const dimension = tab.dataset.dimension;
      updateTableData(dimension);
    });
  });
}

/* -------------------------
   TABLE SORTING
--------------------------*/
function initTableSorting() {
  const sortableHeaders = document.querySelectorAll(".gsc-table th.sortable");
  sortableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.column;
      const currentSort = header.classList.contains("desc") ? "desc" : "asc";
      const newSort = currentSort === "asc" ? "desc" : "asc";

      // Remove active and sort classes from all headers
      sortableHeaders.forEach((h) => {
        h.classList.remove("active", "asc", "desc");
      });

      // Add active and new sort class to clicked header
      header.classList.add("active", newSort);

      // Sort table data
      sortTableData(column, newSort);
    });
  });
}

/* -------------------------
   UPDATE TABLE DATA
--------------------------*/
function updateTableData(dimension) {
  if (!gscData || !gscData.properties) return;

  const currentLabel = document.getElementById(
    "selectedPropertyLabel"
  )?.textContent;
  const prop = gscData.properties.find((p) => p.label === currentLabel);
  if (!prop || !prop.performance) return;

  let data = [];
  switch (dimension) {
    case "queries":
      data = prop.performance.queries || [];
      break;
    case "pages":
      data = prop.performance.pages || [];
      break;
    case "countries":
      data = prop.performance.countries || [];
      break;
    case "devices":
      data = prop.performance.devices || [];
      break;
    case "search_appearance":
      data = prop.performance.search_appearance || [];
      break;
    case "days":
      data = prop.performance.dates.map((date, index) => ({
        query: date,
        clicks: prop.performance.clicks[index],
        impressions: prop.performance.impressions[index],
        ctr: prop.performance.ctr[index],
        position: prop.performance.position[index],
      }));
      break;
    default:
      data = prop.performance.queries || [];
  }

  const tbody = document.getElementById("performanceTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${
        item.query ||
        item.page ||
        item.country ||
        item.device ||
        item.appearance ||
        item.date
      }</td>
      <td>${item.clicks.toLocaleString()}</td>
      <td>${item.impressions.toLocaleString()}</td>
      <td>${item.ctr}%</td>
      <td>${item.position}</td>
    `;
    tbody.appendChild(row);
  });
}

/* -------------------------
   SORT TABLE DATA
--------------------------*/
/* -------------------------
   SORT TABLE DATA
--------------------------*/
function sortTableData(column, direction) {
  if (!gscData || !gscData.properties) return;

  const currentLabel = document.getElementById(
    "selectedPropertyLabel"
  )?.textContent;
  const prop = gscData.properties.find((p) => p.label === currentLabel);
  if (!prop || !prop.performance) return;

  const activeTab = document.querySelector(".gsc-dimension-tab.active");
  const dimension = activeTab ? activeTab.dataset.dimension : "queries";

  let data = [];
  switch (dimension) {
    case "queries":
      data = prop.performance.queries || [];
      break;
    case "pages":
      data = prop.performance.pages || [];
      break;
    case "countries":
      data = prop.performance.countries || [];
      break;
    case "devices":
      data = prop.performance.devices || [];
      break;
    case "search_appearance":
      data = prop.performance.search_appearance || [];
      break;
    case "days":
      data = prop.performance.dates.map((date, index) => ({
        query: date,
        clicks: prop.performance.clicks[index] || 0,
        impressions: prop.performance.impressions[index] || 0,
        ctr: prop.performance.ctr[index] || 0,
        position: prop.performance.position[index] || 0,
      }));
      break;
    default:
      data = prop.performance.queries || [];
  }

  data.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    } else {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }

    return direction === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const tbody = document.getElementById("performanceTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${
        item.query ||
        item.page ||
        item.country ||
        item.device ||
        item.appearance ||
        item.date
      }</td>
      <td>${item.clicks}</td>
      <td>${item.impressions}</td>
      <td>${item.ctr}%</td>
      <td>${item.position}</td>
    `;
    tbody.appendChild(row);
  });
}

/* -------------------------
   EXPORT FUNCTIONALITY
--------------------------*/
function initExportFunctionality() {
  const exportItems = document.querySelectorAll("[data-export]");
  exportItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const exportType = e.target.dataset.export;
      handleExport(exportType);
    });
  });
}

function handleExport(exportType) {
  if (!gscData || !gscData.properties) return;

  const currentLabel = document.getElementById(
    "selectedPropertyLabel"
  )?.textContent;
  const prop = gscData.properties.find((p) => p.label === currentLabel);
  if (!prop || !prop.performance) return;

  const activeTab = document.querySelector(".gsc-dimension-tab.active");
  const dimension = activeTab ? activeTab.dataset.dimension : "queries";

  let data = [];
  let headers = [];

  switch (dimension) {
    case "queries":
      data = prop.performance.queries || [];
      headers = ["Query", "Clicks", "Impressions", "CTR", "Position"];
      break;
    case "pages":
      data = prop.performance.pages || [];
      headers = ["Page", "Clicks", "Impressions", "CTR", "Position"];
      break;
    case "countries":
      data = prop.performance.countries || [];
      headers = ["Country", "Clicks", "Impressions", "CTR", "Position"];
      break;
    case "devices":
      data = prop.performance.devices || [];
      headers = ["Device", "Clicks", "Impressions", "CTR", "Position"];
      break;
    case "search_appearance":
      data = prop.performance.search_appearance || [];
      headers = [
        "Search Appearance",
        "Clicks",
        "Impressions",
        "CTR",
        "Position",
      ];
      break;
    case "days":
      data = prop.performance.dates.map((date, index) => ({
        query: date,
        clicks: prop.performance.clicks[index] || 0,
        impressions: prop.performance.impressions[index] || 0,
        ctr: prop.performance.ctr[index] || 0,
        position: prop.performance.position[index] || 0,
      }));
      headers = ["Date", "Clicks", "Impressions", "CTR", "Position"];
      break;
    default:
      data = prop.performance.queries || [];
      headers = ["Query", "Clicks", "Impressions", "CTR", "Position"];
  }

  switch (exportType) {
    case "csv":
      exportToCSV(data, headers, dimension);
      break;
    case "excel":
      exportToExcel(data, headers, dimension);
      break;
    case "google-sheets":
      exportToGoogleSheets(data, headers, dimension);
      break;
  }
}

function exportToCSV(data, headers, dimension) {
  let csvContent = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const key = header.toLowerCase().replace(" ", "");
      let value =
        row[key] ||
        row.query ||
        row.page ||
        row.country ||
        row.device ||
        row.appearance ||
        "";
      // Escape commas and quotes in CSV
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csvContent += values.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `gsc_${dimension}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data, headers, dimension) {
  // For Excel export, we'll create a more detailed Excel file
  // This is a simplified version - in a real implementation, you'd use a library like SheetJS
  let csvContent = headers.join("\t") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const key = header.toLowerCase().replace(" ", "");
      return (
        row[key] ||
        row.query ||
        row.page ||
        row.country ||
        row.device ||
        row.appearance ||
        ""
      );
    });
    csvContent += values.join("\t") + "\n";
  });

  const blob = new Blob([csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `gsc_${dimension}_${new Date().toISOString().split("T")[0]}.xls`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToGoogleSheets(data, headers, dimension) {
  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const key = header.toLowerCase().replace(" ", "");
      let value =
        row[key] ||
        row.query ||
        row.page ||
        row.country ||
        row.device ||
        row.appearance ||
        "";
      // Escape commas and quotes in CSV
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csvContent += values.join(",") + "\n";
  });

  // Encode the CSV content for URL
  const encodedCsv = encodeURIComponent(csvContent);

  // Create Google Sheets import URL
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/1/import?format=csv&csv=${encodedCsv}`;

  // Open in new tab
  window.open(googleSheetsUrl, "_blank");
}

// Initialize export functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // ... existing code ...
  initExportFunctionality();

  // Initialize add property functionality if on settings page
  if (document.body.dataset.page === "settings") {
    initAddPropertyFunctionality();
  }
});

/* -------------------------
   ADD PROPERTY FUNCTIONALITY (SETTINGS PAGE)
--------------------------*/
function initAddPropertyFunctionality() {
  // Generate random verification code
  function generateRandomCode(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // URL Prefix (Meta Tag) - Generate Button
  const generateMetaTagBtn = document.getElementById("generateMetaTagBtn");
  if (generateMetaTagBtn) {
    generateMetaTagBtn.addEventListener("click", () => {
      const urlInput = document.getElementById("urlPrefixInput");
      if (!urlInput || !urlInput.value.trim()) {
        alert("Please enter a valid URL prefix.");
        return;
      }

      const code = generateRandomCode();
      const metaTagCode = `<meta name="google-site-verification" content="${code}" />`;

      document.getElementById("metaTagCode").textContent = metaTagCode;
      document.getElementById("metaTagSection").classList.remove("d-none");

      // Store the code and URL for verification
      generateMetaTagBtn.dataset.code = code;
      generateMetaTagBtn.dataset.url = urlInput.value.trim();
    });
  }

  // URL Prefix (Meta Tag) - Verify Button
  const verifyMetaTagBtn = document.getElementById("verifyMetaTagBtn");
  if (verifyMetaTagBtn) {
    verifyMetaTagBtn.addEventListener("click", () => {
      const code = generateMetaTagBtn?.dataset.code;
      const url = generateMetaTagBtn?.dataset.url;

      if (!code || !url) {
        alert("Please generate a verification code first.");
        return;
      }

      // Simulate verification success
      alert("Verification successful! Property added to Google Search Console.");

      // Add new property to data
      const newProperty = {
        id: Date.now().toString(),
        label: url.replace(/^https?:\/\//, ''),
        type: "URL prefix",
        icon: "images/logo_search_console.svg",
        performance: {
          dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
          clicks: [10, 15, 20],
          impressions: [100, 150, 200],
          ctr: [10.0, 10.0, 10.0],
          position: [5.0, 4.8, 4.5]
        },
        indexing: {
          indexed: 100,
          notIndexed: 10,
          chart: {
            dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
            indexed: [90, 95, 100],
            notIndexed: [10, 5, 0]
          }
        },
        experience: {
          cwv: {
            mobile: { good: 80, ni: 15, poor: 5, trend: [75, 78, 80] },
            desktop: { good: 85, ni: 10, poor: 5, trend: [80, 82, 85] }
          },
          https: { good: 95, ni: 3, poor: 2, trend: [90, 92, 95] }
        },
        shopping: {
          product: { valid: 90, invalid: 10, trend: [85, 87, 90] },
          merchant: { valid: 95, invalid: 5, trend: [90, 92, 95] }
        },
        enhancements: {
          breadcrumbs: { valid: 80, invalid: 20, trend: [75, 77, 80] },
          faq: { valid: 70, invalid: 30, trend: [65, 67, 70] },
          sitelinks: { valid: 85, invalid: 15, trend: [80, 82, 85] },
          products: { valid: 75, invalid: 25, trend: [70, 72, 75] },
          mobile_usability: { valid: 90, invalid: 10, trend: [85, 87, 90] }
        }
      };

      gscData.properties.push(newProperty);

      // Update property dropdown
      initPropertyDropdown();

      // Select the new property
      selectProperty(newProperty.id);

      // Reset form
      document.getElementById("urlPrefixInput").value = "";
      document.getElementById("metaTagSection").classList.add("d-none");
    });
  }

  // Domain (DNS TXT) - Generate Button
  const generateDnsBtn = document.getElementById("generateDnsBtn");
  if (generateDnsBtn) {
    generateDnsBtn.addEventListener("click", () => {
      const domainInput = document.getElementById("domainInput");
      if (!domainInput || !domainInput.value.trim()) {
        alert("Please enter a valid domain.");
        return;
      }

      const code = generateRandomCode();
      const dnsValue = `google-site-verification=${code}`;

      document.getElementById("dnsValue").textContent = dnsValue;
      document.getElementById("dnsSection").classList.remove("d-none");

      // Store the code and domain for verification
      generateDnsBtn.dataset.code = code;
      generateDnsBtn.dataset.domain = domainInput.value.trim();
    });
  }

  // Domain (DNS TXT) - Verify Button
  const verifyDnsBtn = document.getElementById("verifyDnsBtn");
  if (verifyDnsBtn) {
    verifyDnsBtn.addEventListener("click", () => {
      const code = generateDnsBtn?.dataset.code;
      const domain = generateDnsBtn?.dataset.domain;

      if (!code || !domain) {
        alert("Please generate a DNS record first.");
        return;
      }

      // Simulate verification success
      alert("Verification successful! Domain property added to Google Search Console.");

      // Add new property to data
      const newProperty = {
        id: Date.now().toString(),
        label: domain,
        type: "Domain property",
        icon: "images/logo_search_console.svg",
        performance: {
          dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
          clicks: [25, 30, 35],
          impressions: [250, 300, 350],
          ctr: [10.0, 10.0, 10.0],
          position: [4.0, 3.8, 3.5]
        },
        indexing: {
          indexed: 150,
          notIndexed: 15,
          chart: {
            dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
            indexed: [135, 140, 150],
            notIndexed: [15, 10, 0]
          }
        },
        experience: {
          cwv: {
            mobile: { good: 85, ni: 10, poor: 5, trend: [80, 82, 85] },
            desktop: { good: 90, ni: 5, poor: 5, trend: [85, 87, 90] }
          },
          https: { good: 98, ni: 1, poor: 1, trend: [95, 96, 98] }
        },
        shopping: {
          product: { valid: 95, invalid: 5, trend: [90, 92, 95] },
          merchant: { valid: 98, invalid: 2, trend: [95, 96, 98] }
        },
        enhancements: {
          breadcrumbs: { valid: 85, invalid: 15, trend: [80, 82, 85] },
          faq: { valid: 75, invalid: 25, trend: [70, 72, 75] },
          sitelinks: { valid: 90, invalid: 10, trend: [85, 87, 90] },
          products: { valid: 80, invalid: 20, trend: [75, 77, 80] },
          mobile_usability: { valid: 95, invalid: 5, trend: [90, 92, 95] }
        }
      };

      gscData.properties.push(newProperty);

      // Update property dropdown
      initPropertyDropdown();

      // Select the new property
      selectProperty(newProperty.id);

      // Reset form
      document.getElementById("domainInput").value = "";
      document.getElementById("dnsSection").classList.add("d-none");
    });
  }
}
