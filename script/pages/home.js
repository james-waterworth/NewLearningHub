function initHomePage() {
  const upcomingList = document.getElementById("upcomingList");
  if (!upcomingList) {
    throw new Error("Upcoming courses list markup is missing.");
  }

  loadUpcomingCourses(upcomingList);
}

async function loadUpcomingCourses(container) {
  try {
    const response = await fetch("data/courses.json");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.items)) {
      throw new Error("The course data file does not contain an items list.");
    }

    const currentDate = new Date();
    const today = [
      currentDate.getFullYear(),
      String(currentDate.getMonth() + 1).padStart(2, "0"),
      String(currentDate.getDate()).padStart(2, "0"),
    ].join("-");
    const upcomingCourses = data.items
      .filter((item) => item?.itemType === "Course")
      .map(validateUpcomingCourse)
      .filter((course) => course.date >= today)
      .sort((first, second) => first.date.localeCompare(second.date));

    if (upcomingCourses.length === 0) {
      container.replaceChildren(createUpcomingMessage("No upcoming courses are available."));
      return;
    }

    const list = document.createElement("ul");
    list.className = "learning-list";
    upcomingCourses.forEach((course) => list.append(renderUpcomingCourse(course)));
    container.replaceChildren(list);
  } catch (error) {
    console.error("Unable to load upcoming courses.", error);
    container.replaceChildren(
      createUpcomingMessage("Upcoming courses could not be loaded. Please try again later."),
    );
  }
}

function renderUpcomingCourse(course) {
  const listItem = document.createElement("li");
  const item = document.createElement("div");
  const content = document.createElement("div");
  const title = document.createElement("a");
  const date = document.createElement("span");
  const arrow = document.createElement("span");

  item.className = "learning-item";
  title.className = "learning-item__title";
  title.href = course.hyperlink;
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  title.textContent = course.name;
  date.className = "learning-item__detail";
  date.textContent = formatUpcomingDate(course.date);
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  content.append(title, date);
  item.append(content, arrow);
  listItem.append(item);
  return listItem;
}

function validateUpcomingCourse(course) {
  if (
    !course ||
    typeof course.date !== "string" ||
    typeof course.name !== "string" ||
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

function formatUpcomingDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function createUpcomingMessage(text) {
  const message = document.createElement("p");
  message.textContent = text;
  return message;
}
