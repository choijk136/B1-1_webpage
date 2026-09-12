const GITHUB_USERNAME = "choijk136";
const SCROLL_TOP_THRESHOLD = 300;
const HEADER_THRESHOLD = 60;

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const scrollTopButton = document.querySelector(".scroll-top");
const projectStatus = document.querySelector(".project-status");
const projectGrid = document.querySelector(".project-grid");
const contactForm = document.querySelector(".contact-form");
const formSuccess = document.querySelector(".form-success");

const state = {
  theme: localStorage.getItem("theme") || "light",
  projects: [],
  projectStatus: "idle",
  formErrors: {}
};

const renderTheme = () => {
  document.documentElement.dataset.theme = state.theme;
  const isDark = state.theme === "dark";
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
};

const closeMenu = () => {
  navMenu.classList.remove("active");
  menuToggle.classList.remove("active");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "메뉴 열기");
};

menuToggle.addEventListener("click", () => {
  const isActive = navMenu.classList.toggle("active");
  menuToggle.classList.toggle("active");
  document.body.classList.toggle("menu-open", isActive);
  menuToggle.setAttribute("aria-expanded", String(isActive));
  menuToggle.setAttribute("aria-label", isActive ? "메뉴 닫기" : "메뉴 열기");
});

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  renderTheme();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    closeMenu();
  });
});

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY >= HEADER_THRESHOLD);
  scrollTopButton.classList.toggle("visible", window.scrollY >= SCROLL_TOP_THRESHOLD);
}, { passive: true });

scrollTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const escapeHTML = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatDate = (dateString) => new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric"
}).format(new Date(dateString));

const renderProjects = () => {
  projectGrid.innerHTML = "";

  if (state.projectStatus === "loading") {
    projectStatus.innerHTML = '<div class="status-panel"><span class="spinner" aria-hidden="true"></span><p>프로젝트를 불러오는 중입니다...</p></div>';
    return;
  }

  if (state.projectStatus === "error") {
    projectStatus.innerHTML = '<div class="status-panel"><p>프로젝트를 불러올 수 없습니다.</p><button class="retry-button" type="button">다시 시도</button></div>';
    document.querySelector(".retry-button").addEventListener("click", fetchProjects);
    return;
  }

  if (state.projectStatus === "empty") {
    projectStatus.innerHTML = '<div class="status-panel"><p>표시할 프로젝트가 없습니다.</p></div>';
    return;
  }

  projectStatus.innerHTML = "";
  projectGrid.innerHTML = state.projects.map((project) => {
    const { name, description, html_url: url, language, stargazers_count: stars, forks_count: forks, updated_at: updatedAt } = project;
    return `
      <article class="project-card">
        <div class="project-card-top">
          <h3><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)}</a></h3>
          <span class="repo-icon" aria-hidden="true">↗</span>
        </div>
        <p class="project-description">${escapeHTML(description || "설명이 등록되지 않은 프로젝트입니다.")}</p>
        <ul class="project-meta" aria-label="저장소 정보">
          ${language ? `<li><span class="language-dot"></span>${escapeHTML(language)}</li>` : ""}
          <li>★ ${stars}</li>
          <li>⑂ ${forks}</li>
          <li>${formatDate(updatedAt)}</li>
        </ul>
      </article>`;
  }).join("");
};

async function fetchProjects() {
  state.projectStatus = "loading";
  renderProjects();

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=owner`);
    if (!response.ok) {
      throw new Error(response.status === 403 ? "GitHub API rate limit exceeded" : `GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    state.projects = data;
    state.projectStatus = data.length ? "success" : "empty";
  } catch (error) {
    console.error(error);
    state.projectStatus = "error";
  }

  renderProjects();
}

const validateField = (field) => {
  const value = field.value.trim();
  let message = "";

  if (!value) {
    message = `${field.labels[0].textContent}: 필수 입력 항목입니다.`;
  } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    message = "올바른 이메일 형식으로 입력해 주세요.";
  }

  state.formErrors[field.name] = message;
  const fieldGroup = field.closest(".field");
  const errorElement = document.querySelector(`#${field.id}-error`);
  fieldGroup.classList.toggle("has-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  errorElement.textContent = message;
  return !message;
};

contactForm.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    validateField(field);
    formSuccess.textContent = "";
  });
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = [...contactForm.querySelectorAll("input, textarea")];
  const isValid = fields.map(validateField).every(Boolean);

  if (!isValid) {
    formSuccess.textContent = "";
    contactForm.querySelector('[aria-invalid="true"]').focus();
    return;
  }

  const [nameField] = fields;
  formSuccess.textContent = `${nameField.value.trim()}님, 입력 내용이 확인되었습니다.`;
  contactForm.reset();
  state.formErrors = {};
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
document.querySelector("#current-year").textContent = new Date().getFullYear();

renderTheme();
fetchProjects();
