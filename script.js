document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  const contentArea = document.getElementById("content-area");

  // Load Home by default
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
      .then(res => {
        if (!res.ok) throw new Error("Page not found");
        return res.text();
      })
      .then(data => (contentArea.innerHTML = data))
      .catch(err => (contentArea.innerHTML = `<p style="text-align:center;">${err.message}</p>`));
  }
});
