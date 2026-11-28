(() => {
  const searchInput = document.getElementById("search-query");
  const searchSummary = document.getElementById("search-summary");
  const courseResults = document.getElementById("course-results");
  const courseResultsCount = document.getElementById("course-results-count");
  const pageResults = document.getElementById("page-results");
  const pageResultsCount = document.getElementById("page-results-count");
  const query = new URLSearchParams(window.location.search).get("q")?.trim() || "";
  const pages = [
    {
      title: "Home",
      description: "Discover learning, training, and resources across the Learning Hub.",
      keywords: [
        "Learning Half Days protected learning time staff learning mandatory statutory training",
        "upcoming courses training resources educator learner calendar",
      ].join(" "),
      href: "index.html",
    },
    {
      title: "Learning Catalogue",
      description: "Browse available learning and filter courses by date, topic, or course name.",
      keywords: [
        "courses learning sessions videos online classroom Quality Improvement",
        "filter dates topics item types",
      ].join(" "),
      href: "catalogue.html",
    },
    {
      title: "Course calendar",
      description: "View courses, videos, and Quality Improvement sessions by date.",
      keywords: "scheduled learning sessions month view dates courses videos quality improvement",
      href: "calendar.html",
    },
    {
      title: "Educator Toolkit",
      description: "Resources for trainers, educators, and line managers planning Learning Half Day sessions.",
      keywords: "facilitator support ESR submission form class session record learners planning",
      href: "educator.html",
    },
    {
      title: "Quality Improvement",
      description: "Explore Quality Improvement learning and projects in the RDaSH Learning Hub.",
      keywords: "QI methods methodology PDSA projects data measures service improvement",
      href: "quality-improvement.html",
    },
  ];

  if (
    !searchInput ||
    !searchSummary ||
    !courseResults ||
    !courseResultsCount ||
    !pageResults ||
    !pageResultsCount
  ) {
    throw new Error("Search results page markup is incomplete.");
  }

  searchInput.value = query;

  if (!query) {
    searchSummary.textContent = "Enter a search term to find courses and pages.";
    courseResults.replaceChildren(
      createMessage("Search for a course or learning resource.", "catalogue-empty"),
    );
    pageResults.replaceChildren(
      createMessage("Search for a page on the Learning Hub.", "catalogue-empty"),
    );
    return;
  }

  searchSummary.textContent = `Search results for "${query}"`;
  renderPageResults(query);
  courseResults.replaceChildren(createMessage("Loading courses and learning…", "catalogue-empty"));
  loadCourses(query);

  async function loadCourses(searchQuery) {
    try {
      const response = await fetch("data/courses.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        throw new Error("The course data file does not contain an items list.");
      }

      const matchingCourses = data.items
        .map(validateCourse)
        .filter((course) =>
          matchesQuery(searchQuery, [
            course.name,
            course.description,
            course.itemType,
            course.topic,
            course.courseType,
          ]),
        );

        courseResultsCount.textContent =
          `${matchingCourses.length} result${matchingCourses.length === 1 ? "" : "s"}`;
      if (matchingCourses.length === 0) {
        courseResults.replaceChildren(
          createMessage("No courses or learning resources match your search.", "catalogue-empty"),
        );
        return;
      }

      const fragment = document.createDocumentFragment();
      matchingCourses.forEach((course) => fragment.append(renderCourse(course)));
      courseResults.replaceChildren(fragment);
    } catch (error) {
      console.error("Unable to load search results.", error);
      courseResultsCount.textContent = "";
      courseResults.replaceChildren(
        createMessage(
          "Courses and learning resources could not be loaded. Please try again later.",
          "catalogue-error",
        ),
      );
    }
  }

  function renderPageResults(searchQuery) {
    const matchingPages = pages.filter((page) =>
      matchesQuery(searchQuery, [page.title, page.description, page.keywords]),
    );

    pageResultsCount.textContent =
      `${matchingPages.length} result${matchingPages.length === 1 ? "" : "s"}`;
    if (matchingPages.length === 0) {
      pageResults.replaceChildren(
        createMessage("No website pages match your search.", "catalogue-empty"),
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    matchingPages.forEach((page) => fragment.append(renderPage(page)));
    pageResults.replaceChildren(fragment);
  }

  function renderCourse(course) {
    const article = document.createElement("article");
    const type = document.createElement("p");
    const heading = document.createElement("h3");
    const link = document.createElement("a");
    const description = document.createElement("p");

    article.className = "search-result search-result--course";
    if (course.itemType === "Video") {
      article.classList.add("course-card--video");
    }
    if (course.itemType === "Course") {
      article.classList.add("course-card--course");
    }
    if (course.itemType === "Quality Improvement") {
      article.classList.add("course-card--quality-improvement");
    }
    type.className = "search-result__type";
    type.textContent = `${course.itemType} · ${course.topic} · ${course.courseType}`;
    heading.className = "search-result__title";
    link.href = course.hyperlink;
    link.textContent = course.name;
    description.className = "search-result__description";
    description.textContent = course.description;

    heading.append(link);
    article.append(type, heading, description);
    return article;
  }

  function renderPage(page) {
    const article = document.createElement("article");
    const type = document.createElement("p");
    const heading = document.createElement("h3");
    const link = document.createElement("a");
    const description = document.createElement("p");

    article.className = "search-result search-result--page";
    type.className = "search-result__type";
    type.textContent = "Website page";
    heading.className = "search-result__title";
    link.href = page.href;
    link.textContent = page.title;
    description.className = "search-result__description";
    description.textContent = page.description;

    heading.append(link);
    article.append(type, heading, description);
    return article;
  }

  function matchesQuery(searchQuery, values) {
    const searchableText = values.join(" ").toLocaleLowerCase();
    return searchQuery
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => searchableText.includes(term));
  }

  function createMessage(text, className) {
    const message = document.createElement("p");
    message.className = className;
    message.textContent = text;
    return message;
  }

  function validateCourse(course) {
    if (
      !course ||
      typeof course.name !== "string" ||
      typeof course.description !== "string" ||
      typeof course.itemType !== "string" ||
      typeof course.topic !== "string" ||
      typeof course.courseType !== "string" ||
      typeof course.hyperlink !== "string"
    ) {
      throw new Error("The course data file contains an invalid learning item.");
    }

    const courseUrl = new URL(course.hyperlink, window.location.href);
    if (!["http:", "https:"].includes(courseUrl.protocol)) {
      throw new Error(`The course data file contains an unsafe link: ${course.name}`);
    }

    return { ...course, hyperlink: courseUrl.href };
  }
})();
