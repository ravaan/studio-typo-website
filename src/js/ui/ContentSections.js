/**
 * ContentSections - Manages section transitions and animations
 */

export class ContentSections {
  constructor(contentElement) {
    this.container = contentElement;
    this.sections = new Map();
    this.currentSection = null;

    this.init();
  }

  /**
   * Initialize content sections
   */
  init() {
    const sectionElements = this.container.querySelectorAll(".section");

    sectionElements.forEach((section) => {
      this.sections.set(section.id, section);

      if (section.classList.contains("active")) {
        this.currentSection = section.id;
      }
    });
  }

  /**
   * Show a section with animation
   */
  showSection(sectionId) {
    if (sectionId === this.currentSection) return;

    const previousSection = this.sections.get(this.currentSection);
    const nextSection = this.sections.get(sectionId);

    if (!nextSection) return;

    // Hide current
    if (previousSection) {
      previousSection.classList.remove("active");
    }

    // Show next
    nextSection.classList.add("active");
    this.currentSection = sectionId;

    // Scroll to top of section
    this.container.scrollTop = 0;
  }

  /**
   * Get current section ID
   */
  getCurrentSection() {
    return this.currentSection;
  }

  /**
   * Check if a section exists
   */
  hasSection(sectionId) {
    return this.sections.has(sectionId);
  }
}
