import './style.css';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

document.querySelector("#app").innerHTML = `
  <main>
    <section class="hero">
      <div class="hero-badge">NASA SPACE EXPLORER</div>

      <h1 class="hero-title">
        BIRTHDAY<br>
        <span>SPACE</span>
      </h1>

      <p class="hero-text">
        Your birthday happened on Earth.<br>
        But what happened in space?
      </p>

      <div class="birthday-search">
        <label for="birthday">WHEN WERE YOU BORN?</label>

        <div class="search-row">
          <input type="date" id="birthday">
          <button id="explore-btn">EXPLORE 🚀</button>
        </div>
      </div>

      <div class="scroll-hint">↓ TODAY IN SPACE</div>
    </section>

    <section class="apod-section">
      <p class="section-label">NASA APOD</p>
      <h2>TODAY IN SPACE</h2>

      <div id="apod">
        <p class="loading">Contacting NASA...</p>
      </div>
    </section>

    <section class="birthday-results" id="birthday-results">
      <p class="section-label">NASA DONKI</p>
      <h2>YOUR BIRTHDAY IN SPACE</h2>

      <div id="birthday-output"></div>
    </section>
  </main>
`;

const apodContainer = document.querySelector("#apod");
const birthdayInput = document.querySelector("#birthday");
const exploreButton = document.querySelector("#explore-btn");
const birthdayResults = document.querySelector("#birthday-results");
const birthdayOutput = document.querySelector("#birthday-output");

birthdayInput.max = new Date().toISOString().split("T")[0];

/* =========================
   APOD
========================= */

async function loadApod() {
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayString = today.toISOString().split("T")[0];
  const yesterdayString = yesterday.toISOString().split("T")[0];

  try {
    let response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${todayString}`
    );

    let usedDate = todayString;

    if (!response.ok) {
      console.warn(
        `Today's APOD failed (${response.status}). Trying yesterday...`
      );

      response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${yesterdayString}`
      );

      usedDate = yesterdayString;
    }

    if (!response.ok) {
      throw new Error(
        `NASA APOD request failed (${response.status})`
      );
    }

    const data = await response.json();

    let media;

    if (data.media_type === "image") {
      media = `
        <img
          class="apod-media"
          src="${data.url}"
          alt="${data.title}"
        />
      `;
    } else if (
      data.url.includes("youtube") ||
      data.url.includes("youtu.be")
    ) {
      media = `
        <iframe
          class="apod-media apod-video"
          src="${data.url}"
          title="${data.title}"
          allowfullscreen>
        </iframe>
      `;
    } else {
      media = `
        <video
          class="apod-media"
          src="${data.url}"
          controls>
        </video>
      `;
    }

    apodContainer.innerHTML = `
      <div class="apod-card">
        ${media}

        <div class="apod-content">
          <p class="apod-date">
            ${data.date}
            ${
              usedDate !== todayString
                ? " · LATEST AVAILABLE"
                : ""
            }
          </p>

          <h3>${data.title}</h3>

          <p class="apod-explanation">
            ${data.explanation}
          </p>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("APOD error:", error);

    apodContainer.innerHTML = `
      <div class="quiet-card">
        <div class="quiet-icon">📡</div>

        <h3>APOD TEMPORARILY UNAVAILABLE</h3>

        <p>
          NASA's Astronomy Picture of the Day
          could not be loaded.
          Please try again later.
        </p>
      </div>
    `;
  }
}

loadApod();

/* =========================
   BIRTHDAY SEARCH
========================= */

exploreButton.addEventListener("click", async () => {
  const date = birthdayInput.value;

  if (!date) {
    birthdayInput.focus();
    return;
  }

  exploreButton.disabled = true;
  exploreButton.textContent = "SEARCHING...";

  birthdayResults.classList.add("visible");

  birthdayOutput.innerHTML = `
    <div class="space-loader">
      <p id="loading-message">
        Searching NASA...
      </p>

      <div class="progress-track">
        <div
          class="progress-bar"
          id="progress-bar"
        ></div>
      </div>

      <p
        class="progress-number"
        id="progress-number"
      >
        0%
      </p>
    </div>
  `;

  birthdayResults.scrollIntoView({
    behavior: "smooth"
  });

  const progressBar =
    document.querySelector("#progress-bar");

  const progressNumber =
    document.querySelector("#progress-number");

  const loadingMessage =
    document.querySelector("#loading-message");

  animateProgress(
    progressBar,
    progressNumber,
    30
  );

  const endpoints = [
    {
      type: "Solar Flare",
      icon: "☀️",
      endpoint: "FLR"
    },
    {
      type: "Coronal Mass Ejection",
      icon: "☄️",
      endpoint: "CME"
    },
    {
      type: "Geomagnetic Storm",
      icon: "🌍",
      endpoint: "GST"
    },
    {
      type: "Solar Energetic Particle",
      icon: "⚡",
      endpoint: "SEP"
    }
  ];

  try {
    loadingMessage.textContent =
      "Fetching space weather data...";

    const requests = endpoints.map(
      async item => {
        const url =
          `https://api.nasa.gov/DONKI/${item.endpoint}` +
          `?startDate=${date}` +
          `&endDate=${date}` +
          `&api_key=${API_KEY}`;

        try {
          const response =
            await fetchWithTimeout(
              url,
              10000
            );

          if (!response.ok) {
            console.warn(
              `${item.type} failed with status ${response.status}`
            );

            return {
              ...item,
              data: []
            };
          }

          const data = await response.json();

          return {
            ...item,
            data
          };

        } catch (error) {
          console.warn(
            `${item.type} failed:`,
            error
          );

          return {
            ...item,
            data: []
          };
        }
      }
    );

    animateProgress(
      progressBar,
      progressNumber,
      60
    );

    const results =
      await Promise.all(requests);

    animateProgress(
      progressBar,
      progressNumber,
      90
    );

    await delay(500);

    loadingMessage.textContent =
      "Complete.";

    animateProgress(
      progressBar,
      progressNumber,
      100
    );

    await delay(450);

    showBirthdayResults(
      date,
      results
    );

  } catch (error) {
    birthdayOutput.innerHTML = `
      <div class="quiet-card">
        <div class="quiet-icon">📡</div>

        <h3>NASA CONNECTION LOST</h3>

        <p>
          We couldn't retrieve
          the space weather data.
        </p>

        <small>
          ${error.message}
        </small>
      </div>
    `;
  } finally {
    exploreButton.disabled = false;
    exploreButton.textContent =
      "EXPLORE 🚀";
  }
});

/* =========================
   SHOW RESULTS
========================= */

function showBirthdayResults(
  date,
  results
) {
  const allEvents = [];

  results.forEach(result => {
    result.data.forEach(event => {
      allEvents.push({
        type: result.type,
        icon: result.icon,
        event
      });
    });
  });

  const formattedDate =
    formatBirthday(date);

  if (allEvents.length === 0) {
    birthdayOutput.innerHTML = `
      <div class="birthday-date">
        ${formattedDate}
      </div>

      <div class="quiet-card">
        <div class="quiet-icon">
          ✦
        </div>

        <h3>
          NOTHING MAJOR WAS RECORDED.
        </h3>

        <p>
          The universe was unusually
          quiet on this day.
        </p>
      </div>

      <p class="universe-ending">
        That was your day in the universe.
      </p>
    `;

    return;
  }

  const eventCards = allEvents
    .map(
      (item, index) =>
        createEventCard(
          item,
          index
        )
    )
    .join("");

  birthdayOutput.innerHTML = `
    <div class="birthday-date">
      ${formattedDate}
    </div>

    <div class="event-summary">
      <span id="event-count">
        0
      </span>

      SPACE WEATHER EVENT${
        allEvents.length === 1
          ? ""
          : "S"
      } FOUND
    </div>

    <div class="event-grid">
      ${eventCards}
    </div>

    <p class="universe-ending">
      That was your day in the universe.
    </p>
  `;

  animateCount(
    allEvents.length
  );
}

/* =========================
   EVENT CARDS
========================= */

function createEventCard(
  item,
  index
) {
  const event = item.event;

  let description = "";
  let details = "";

  if (item.type === "Solar Flare") {
    description = event.classType
      ? `A ${event.classType} solar flare was recorded by NASA.`
      : `A solar flare was recorded by NASA.`;

    details = `
      ${
        event.sourceLocation
          ? `<span>Source: ${event.sourceLocation}</span>`
          : ""
      }

      ${
        event.peakTime
          ? `<span>Peak: ${formatEventTime(event.peakTime)}</span>`
          : ""
      }
    `;

  } else if (
    item.type ===
    "Coronal Mass Ejection"
  ) {
    description =
      "A coronal mass ejection was observed leaving the Sun.";

    details = `
      ${
        event.startTime
          ? `<span>Start: ${formatEventTime(event.startTime)}</span>`
          : ""
      }
    `;

  } else if (
    item.type ===
    "Geomagnetic Storm"
  ) {
    description =
      "Geomagnetic activity was detected around Earth.";

    details = `
      ${
        event.startTime
          ? `<span>Start: ${formatEventTime(event.startTime)}</span>`
          : ""
      }
    `;

  } else if (
    item.type ===
    "Solar Energetic Particle"
  ) {
    description =
      "High-energy particles from the Sun were detected in space.";

    details = `
      ${
        event.eventTime
          ? `<span>Detected: ${formatEventTime(event.eventTime)}</span>`
          : ""
      }
    `;
  }

  return `
    <article
      class="event-card"
      style="animation-delay: ${index * 120}ms"
    >
      <div class="event-icon">
        ${item.icon}
      </div>

      <p class="event-type">
        ${item.type}
      </p>

      <h3>
        ${item.type.toUpperCase()}
      </h3>

      <p class="event-description">
        ${description}
      </p>

      <div class="event-details">
        ${details}
      </div>
    </article>
  `;
}

/* =========================
   DATE FORMATTING
========================= */

function formatBirthday(date) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}

function formatEventTime(time) {
  return new Date(
    time
  ).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

/* =========================
   HELPERS
========================= */

function delay(ms) {
  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}

function animateProgress(
  bar,
  number,
  target
) {
  let current =
    parseInt(number.textContent) || 0;

  const interval =
    setInterval(() => {
      if (current >= target) {
        clearInterval(interval);
        return;
      }

      current++;

      number.textContent =
        `${current}%`;

      bar.style.width =
        `${current}%`;

    }, 12);
}

function animateCount(target) {
  const element =
    document.querySelector(
      "#event-count"
    );

  if (!element) return;

  if (target === 0) {
    element.textContent = "0";
    return;
  }

  let current = 0;

  const interval =
    setInterval(() => {
      current++;

      element.textContent =
        current;

      if (current >= target) {
        clearInterval(interval);
      }
    }, 90);
}

async function fetchWithTimeout(
  url,
  timeout = 10000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );

  try {
    return await fetch(
      url,
      {
        signal: controller.signal
      }
    );
  } finally {
    clearTimeout(timer);
  }
}