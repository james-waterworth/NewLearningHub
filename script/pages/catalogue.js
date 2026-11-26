(() => {
  const filterForm = document.getElementById("course-filters");
  const nameInput = document.getElementById("course-name");
  const dateFromInput = document.getElementById("date-from");
  const dateToInput = document.getElementById("date-to");
  const itemTypeInput = document.getElementById("item-type");
  const topicOptions = document.getElementById("topic-options");
  const courseList = document.getElementById("course-list");
  const courseCalendar = document.getElementById("course-calendar");
  const calendarMessage = document.getElementById("calendar-message");
  const courseCount = document.getElementById("course-count");
  let courses = [];
  let calendar = null;

  if (
    (!courseCalendar &&
      (!filterForm ||
        !nameInput ||
        !dateFromInput ||
        !dateToInput ||
        !itemTypeInput ||
        !topicOptions ||
        !courseList)) ||
    !courseCount ||
    (courseCalendar && !calendarMessage)
  ) {
    throw new Error("Learning catalogue or calendar page markup is incomplete.");
  }

  loadCourses();

  if (filterForm) {
    filterForm.addEventListener("input", renderCourses);
    filterForm.addEventListener("change", renderCourses);
    filterForm.addEventListener("reset", () => {
      window.setTimeout(renderCourses, 0);
    });
  }

  async function loadCourses() {
    try {
      if (courseCalendar) {
        if (!window.FullCalendar || typeof window.FullCalendar.Calendar !== "function") {
          throw new Error("The calendar library could not be loaded.");
        }

        calendar = new window.FullCalendar.Calendar(courseCalendar, {
          initialView: "dayGridMonth",
          height: "auto",
          dayMaxEvents: true,
          eventClick(info) {
            if (!info.event.url) {
              return;
            }

            info.jsEvent.preventDefault();
            window.open(info.event.url, "_blank", "noopener,noreferrer");
          },
        });
        calendar.render();
      }

      const response = await fetch("data/courses.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        throw new Error("The course data file does not contain an items list.");
      }

      courses = data.items.map(validateCourse).sort((first, second) =>
        first.date.localeCompare(second.date),
      );
      if (calendar && courses.length > 0) {
        calendar.gotoDate(courses[0].date);
      }

      renderItemTypeOptions();
      if (topicOptions) {
        renderTopicOptions();
      }
      renderCourses();
    } catch (error) {
      console.error("Unable to load learning items.", error);
      if (itemTypeInput) {
        itemTypeInput.replaceChildren(new Option("All item types", ""));
      }
      if (topicOptions) {
        topicOptions.replaceChildren();
      }
      if (calendar) {
        calendar.destroy();
        calendar = null;
      }
      if (calendarMessage) {
        calendarMessage.className = "catalogue-error calendar-message";
        calendarMessage.textContent = "Learning items could not be loaded. Please try again later.";
        calendarMessage.hidden = false;
      }
      if (courseList) {
        courseList.replaceChildren(
          createMessage("Courses could not be loaded. Please try again later.", "catalogue-error"),
        );
      }
      courseCount.textContent = "";
    }
  }

  function renderItemTypeOptions() {
    if (!itemTypeInput) {
      return;
    }

    const itemTypes = [...new Set(courses.map((course) => course.itemType))].sort((a, b) =>
      a.localeCompare(b),
    );
    const fragment = document.createDocumentFragment();
    fragment.append(new Option("All item types", ""));

    itemTypes.forEach((itemType) => {
      const option = document.createElement("option");
      option.value = itemType;
      option.textContent = itemType;
      fragment.append(option);
    });

    itemTypeInput.replaceChildren(fragment);
  }

  function renderTopicOptions() {
    if (!topicOptions) {
      return;
    }

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
    const query = nameInput?.value.trim().toLocaleLowerCase() || "";
    const selectedTopics = new Set(
      [...(topicOptions?.querySelectorAll('input[name="topic"]:checked') || [])].map(
        (checkbox) => checkbox.value,
      ),
    );
    const selectedItemType = itemTypeInput?.value || "";
    const dateFrom = dateFromInput?.value || "";
    const dateTo = dateToInput?.value || "";

    if (dateFrom && dateTo && dateFrom > dateTo) {
      courseCount.textContent = "";
      if (courseCalendar) {
        if (calendar) {
          calendar.removeAllEvents();
        }
        calendarMessage.textContent = "The start date must be on or before the end date.";
        calendarMessage.hidden = false;
        return;
      }
      courseList.replaceChildren(
        createMessage("The start date must be on or before the end date.", "catalogue-empty"),
      );
      return;
    }

    const visibleCourses = courses.filter(
      (course) =>
        (!query || course.name.toLocaleLowerCase().includes(query)) &&
        (selectedTopics.size === 0 || selectedTopics.has(course.topic)) &&
        (!selectedItemType || course.itemType === selectedItemType) &&
        (!dateFrom || course.date >= dateFrom) &&
        (!dateTo || course.date <= dateTo),
    );

    courseCount.textContent = courseCalendar
      ? `Showing ${visibleCourses.length} of ${courses.length} learning items`
      : `Showing ${visibleCourses.length} of ${courses.length} courses`;

    if (courseCalendar) {
      calendarMessage.textContent =
        visibleCourses.length === 0
          ? "No learning items match your filters. Try changing or clearing them."
          : "";
      calendarMessage.hidden = visibleCourses.length > 0;
      if (calendar) {
        calendar.removeAllEvents();
        visibleCourses.forEach((course) => {
          calendar.addEvent({
            id: course.id,
            title: course.name,
            start: course.date,
            url: course.hyperlink,
          });
        });
      }
      return;
    }

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
    const description = document.createElement("p");
    const link = document.createElement("a");

    article.className = "course-card catalogue-course";
    if (course.itemType === "Video") {
      article.classList.add("course-card--video");
    }
    if (course.itemType === "Course") {
      article.classList.add("course-card--course");
    }
    if (course.itemType === "Quality Improvement") {
      article.classList.add("course-card--quality-improvement");
    }
    meta.className = "course-card__meta";
    meta.textContent = `${formatDate(course.date)} · ${course.topic} · ${course.courseType}`;
    heading.textContent = course.name;
    description.className = "course-card__description";
    description.textContent = course.description;

    link.className = "course-card__link";
    link.href = course.hyperlink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append("View course ", createArrow());

    article.append(meta, heading, description, link);
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
      typeof course.description !== "string" ||
      typeof course.itemType !== "string" ||
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
