(() => {
  const mount = document.getElementById("header-mount");

  if (!mount) {
    throw new Error('Header mount point "#header-mount" was not found.');
  }

  mount.innerHTML = `
    <header class="trust-header">
      <div class="new-page-container trust-header__inner">
        <a class="trust-brand" href="index.html" aria-label="RDaSH Learning Hub home">
          <img class="rdash-logo" src="Assets/learning_hub_logo.svg" alt="Rotherham Doncaster and South Humber NHS Foundation Trust Logo">
        </a>
        <img
          class="trust-header__logo"
          src="Assets/rdashwhite.PNG"
          alt="Rotherham Doncaster and South Humber NHS Foundation Trust"
        >
      </div>
    </header>
  `;
})();
