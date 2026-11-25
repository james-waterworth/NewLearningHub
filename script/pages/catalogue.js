(() => {
  const filterForm = document.getElementById("course-filters");
  const nameInput = document.getElementById("course-name");
  const dateFromInput = document.getElementById("date-from");
  const dateToInput = document.getElementById("date-to");
  const topicOptions = document.getElementById("topic-options");
  const courseList = document.getElementById("course-list");
  const courseCount = document.getElementById("course-count");

  if (
    !filterForm ||
    !nameInput ||
    !dateFromInput ||
    !dateToInput ||
    !topicOptions ||
    !courseList ||
    !courseCount
  ) {
    throw new Error("Course catalogue page markup is incomplete.");
  }

  loadCourses();

  filterForm.addEventListener("input", renderCourses);
  filterForm.addEventListener("change", renderCourses);
  filterForm.addEventListener("reset", () => {
    window.setTimeout(renderCourses, 0);
  });

  async function loadCourses() {
    try {
      const response = await fetch("data/courses.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.courses)) {
        throw new Error("The course data file does not contain a courses list.");
      }

      courses = data.courses.map(validateCourse).sort((first, second) =>
        first.date.localeCompare(second.date),
      );
      renderTopicOptions();
      renderCourses();
    } catch (error) {
      console.error("Unable to load the course catalogue.", error);
      topicOptions.replaceChildren();
      courseList.replaceChildren(
        createMessage("Courses could not be loaded. Please try again later.", "catalogue-error"),
      );
      courseCount.textContent = "";
    }
  }

  let courses = [];

  function renderTopicOptions() {
    const topics = [...new Set(courses.map((course) => course.topic))].sort((a, b) =>
      a.localeCompare(b),
    );
    const fragment = document.createDocumentFragment();

    topics.forEach((topic, index) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const labelText = document.createElement("span");

      label.className = "catalogue-topic-option";
      checkbox.type = "checkbox";
      checkbox.name = "topic";
      checkbox.value = topic;
      checkbox.id = `topic-${index}`;
      labelText.textContent = topic;

      label.append(checkbox, labelText);
      fragment.append(label);
    });

    topicOptions.replaceChildren(fragment);
  }

  function renderCourses() {
    const query = nameInput.value.trim().toLocaleLowerCase();
    const selectedTopics = new Set(
      [...topicOptions.querySelectorAll('input[name="topic"]:checked')].map(
        (checkbox) => checkbox.value,
      ),
    );
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      courseCount.textContent = "";
      courseList.replaceChildren(
        createMessage("The start date must be on or before the end date.", "catalogue-empty"),
      );
      return;
    }

    const visibleCourses = courses.filter(
      (course) =>
        (!query || course.name.toLocaleLowerCase().includes(query)) &&
        (selectedTopics.size === 0 || selectedTopics.has(course.topic)) &&
        (!dateFrom || course.date >= dateFrom) &&
        (!dateTo || course.date <= dateTo),
    );

    courseCount.textContent = `Showing ${visibleCourses.length} of ${courses.length} courses`;

    if (visibleCourses.length === 0) {
      courseList.replaceChildren(
        createMessage("No courses match your filters. Try changing or clearing them.", "catalogue-empty"),
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleCourses.forEach((course) => fragment.append(renderCourse(course)));
    courseList.replaceChildren(fragment);
  }

  function renderCourse(course) {
    const article = document.createElement("article");
    const meta = document.createElement("p");
    const heading = document.createElement("h3");
    const link = document.createElement("a");

    article.className = "course-card catalogue-course";
    meta.className = "course-card__meta";
    meta.textContent = `${formatDate(course.date)} · ${course.topic} · ${course.courseType}`;
    heading.textContent = course.name;

    link.className = "course-card__link";
    link.href = course.hyperlink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append("View course ", createArrow());

    article.append(meta, heading, link);
    return article;
  }

  function createArrow() {
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    return arrow;
  }

  function createMessage(text, className) {
    const message = document.createElement("p");
    message.className = className;
    message.textContent = text;
    return message;
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function validateCourse(course) {
    if (
      !course ||
      typeof course.id !== "string" ||
      typeof course.date !== "string" ||
      typeof course.name !== "string" ||
      typeof course.topic !== "string" ||
      typeof course.courseType !== "string" ||
      typeof course.hyperlink !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(course.date)
    ) {
      throw new Error("The course data file contains an invalid course.");
    }

    const [year, month, day] = course.date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new Error(`The course data file contains an invalid date: ${course.date}`);
    }

    const courseUrl = new URL(course.hyperlink, window.location.href);
    if (!["http:", "https:"].includes(courseUrl.protocol)) {
      throw new Error(`The course data file contains an unsafe link: ${course.id}`);
    }

    return { ...course, hyperlink: courseUrl.href };
  }
})();
