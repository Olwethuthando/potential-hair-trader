document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", () => header.classList.toggle("open"));
    document.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => header.classList.remove("open"))
    );
  }
});
