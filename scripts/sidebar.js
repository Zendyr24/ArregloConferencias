export function initializeSidebar() {
  // Get DOM elements
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.appendChild(overlay);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    console.log("muestra");
    sidebar.classList.toggle("show");
    overlay.classList.toggle("show");
    document.body.style.overflow = sidebar.classList.contains("show")
      ? "hidden"
      : "";
  };

  // Close sidebar when clicking on overlay
  overlay.addEventListener("click", () => {
    if (sidebar.classList.contains("show")) {
      toggleSidebar();
    }
  });

  // Toggle sidebar when clicking the toggle button
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Set active navigation item based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Map of page names to their corresponding navigation item IDs
  const pageToNavMap = {
    "index.html": "nav-home",
    "congregaciones.html": "nav-congregaciones",
    "oradores.html": "nav-oradores",
    "bosquejos.html": "nav-bosquejos",
    "arreglos.html": "nav-arreglos",
    "asignaciones.html": "nav-asignaciones",
    "informes.html": "nav-informes",
    "ajustes.html": "nav-ajustes",
  };

  // Set active navigation item
  const activeLinkId = pageToNavMap[currentPage] || "nav-home";

  // Remove active class from all nav items
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.parentElement.classList.remove("active");
  });

  // Add active class to current nav item
  const activeNavItem = document.getElementById(activeLinkId);
  if (activeNavItem) {
    activeNavItem.parentElement.classList.add("active");
  }

  // Close sidebar when clicking on a nav link (for mobile)
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) {
        toggleSidebar();
      }
    });
  });

  // Handle window resize
  const handleResize = () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    }
  };

  window.addEventListener("resize", handleResize);

  // Cleanup event listeners when component is unmounted
  return () => {
    window.removeEventListener("resize", handleResize);
    if (sidebarToggle) {
      sidebarToggle.removeEventListener("click", toggleSidebar);
    }
    overlay.removeEventListener("click", toggleSidebar);
  };
}
