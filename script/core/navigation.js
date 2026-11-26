(() => {
  const mount = document.getElementById("primary-nav-mount");

  if (!mount) {
    throw new Error('Navigation mount point "#primary-nav-mount" was not found.');
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const links = [
    { href: "index.html", label: "Home" },
    { href: "catalogue.html", label: "Find learning" },
    { href: "quality-improvement.html", label: "Quality improvement" },
    { href: "learner.html", label: "Learner" },
    { href: "educator.html", label: "Educator" },
    { href: "volunteer.html", label: "Volunteer"},
    { href: "faqs.html", label: "Help and support" }
  ];

  mount.innerHTML = `
    <nav class="primary-nav" aria-label="Main navigation">
      <div class="new-page-container">
        <ul class="primary-nav__list">
          ${links
            .map(
              ({ href, label }) => `
                <li>
                  <a href="${href}"${href === currentPage ? ' aria-current="page"' : ""}>${label}</a>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </nav>
  `;
})();
