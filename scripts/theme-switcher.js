export function initializeThemeSwitcher() {
  const themeSwitcher = document.getElementById("theme-switcher");
  if (!themeSwitcher) return;

  themeSwitcher.addEventListener("click", () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme");

    if (currentTheme === "dark") {
      root.removeAttribute("data-theme");
      themeSwitcher.textContent = "🌙";
    } else {
      root.setAttribute("data-theme", "dark");
      themeSwitcher.textContent = "☀️";
    }
  });
}
