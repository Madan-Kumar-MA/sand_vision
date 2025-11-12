document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  const contentArea = document.getElementById("content-area");

  // Load Home page by default
  loadPage("home.html");

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const page = link.getAttribute("data-page");
      loadPage(page);
    });
  });

  function loadPage(page) {
    fetch(`pages/${page}`)
      .then(res => res.text())
      .then(data => (contentArea.innerHTML = data))
      .catch(() => (contentArea.innerHTML = "<p>Page not found.</p>"));
  }
});
