/**
 * Navigation - Sidebar navigation controller
 */

export class Navigation {
  constructor(navElement, contentElement, onNavigate) {
    this.navElement = navElement;
    this.contentElement = contentElement;
    this.onNavigate = onNavigate;

    this.currentSection = "services";
    this.sections = ["services", "about", "work", "contact"];
    this.navItems = [];

    this.init();
  }

  /**
   * Initialize navigation
   */
  init() {
    // Get all nav items
    this.navItems = this.navElement.querySelectorAll(".nav-item");

    // Set up click handlers
    this.navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.getAttribute("href").replace("#", "");
        this.navigateTo(section);
      });
    });

    // Keyboard navigation
    this.navElement.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });
  }

  /**
   * Show the navigation
   */
  show() {
    this.navElement.classList.remove("hidden");
    this.navElement.classList.add("visible");

    this.contentElement.classList.remove("hidden");
    this.contentElement.classList.add("visible");
  }

  /**
   * Hide the navigation
   */
  hide() {
    this.navElement.classList.remove("visible");
    this.navElement.classList.add("hidden");

    this.contentElement.classList.remove("visible");
    this.contentElement.classList.add("hidden");
  }

  /**
   * Navigate to a section
   */
  navigateTo(sectionId) {
    if (sectionId === this.currentSection) return;
    if (!this.sections.includes(sectionId)) return;

    const previousSection = this.currentSection;
    this.currentSection = sectionId;

    // Update nav items
    this.navItems.forEach((item) => {
      const itemSection = item.getAttribute("href").replace("#", "");
      if (itemSection === sectionId) {
        item.classList.add("active");
        item.setAttribute("aria-current", "page");
      } else {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      }
    });

    // Update content sections
    const sections = this.contentElement.querySelectorAll(".section");
    sections.forEach((section) => {
      if (section.id === sectionId) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // Callback
    this.onNavigate?.(sectionId, previousSection);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(e) {
    const currentIndex = this.sections.indexOf(this.currentSection);

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % this.sections.length;
        this.navigateTo(this.sections[nextIndex]);
        this.focusNavItem(nextIndex);
        break;

      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        const prevIndex =
          (currentIndex - 1 + this.sections.length) % this.sections.length;
        this.navigateTo(this.sections[prevIndex]);
        this.focusNavItem(prevIndex);
        break;

      case "Home":
        e.preventDefault();
        this.navigateTo(this.sections[0]);
        this.focusNavItem(0);
        break;

      case "End":
        e.preventDefault();
        this.navigateTo(this.sections[this.sections.length - 1]);
        this.focusNavItem(this.sections.length - 1);
        break;
    }
  }

  /**
   * Focus a nav item by index
   */
  focusNavItem(index) {
    this.navItems[index]?.focus();
  }

  /**
   * Get current section
   */
  getCurrentSection() {
    return this.currentSection;
  }
}
