(() => {
  const mount = document.getElementById("footer-mount");

  if (!mount) {
    throw new Error('Footer mount point "#footer-mount" was not found.');
  }

  mount.innerHTML = `
    <footer class="footer">
      <div class="new-page-container footer__inner">
        <p>© Rotherham Doncaster and South Humber NHS Foundation Trust</p>
        <p>
          <a href="faqs.html">Accessibility</a> &nbsp;·&nbsp;
          <a href="faqs.html">Privacy</a> &nbsp;·&nbsp;
          <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=slTDN7CF9UeyIge0jXdO4wCgmkbDmphKiCw7whYtnEdUQThRNUhJVEpKREsxTDBXRlFITDdONEJWNS4u">Feedback</a>
        </p>
      </div>
    </footer>
  `;
})();
