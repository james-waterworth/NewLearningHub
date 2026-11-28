(() => {
  const itemList = document.getElementById("quality-improvement-list");
  const itemCount = document.getElementById("quality-improvement-count");

  if (!itemList || !itemCount) {
    throw new Error("Quality Improvement page markup is incomplete.");
  }

  loadItems();

  async function loadItems() {
    try {
      const response = await fetch("data/courses.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        throw new Error("The course data file does not contain an items list.");
      }

      const items = data.items
        .filter((item) => item?.itemType === "Quality Improvement")
        .map(validateItem)
        .sort((first, second) => first.date.localeCompare(second.date));

      itemCount.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
      if (items.length === 0) {
        itemList.replaceChildren(
          createMessage("No Quality Improvement items are available yet.", "catalogue-empty"),
        );
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((item) => fragment.append(renderItem(item)));
      itemList.replaceChildren(fragment);
    } catch (error) {
      console.error("Unable to load Quality Improvement items.", error);
      itemCount.textContent = "";
      itemList.replaceChildren(
        createMessage(
          "Quality Improvement items could not be loaded. Please try again later.",
          "catalogue-error",
        ),
      );
    }
  }

  function renderItem(item) {
    const article = document.createElement("article");
    const meta = document.createElement("p");
    const heading = document.createElement("h3");
    const description = document.createElement("p");
    const link = document.createElement("a");
    const arrow = document.createElement("span");

    article.className = "course-card course-card--quality-improvement";
    meta.className = "course-card__meta";
    meta.textContent = `${formatDate(item.date)} · ${item.topic} · ${item.courseType}`;
    heading.textContent = item.name;
    description.textContent = item.description;

    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.className = "course-card__link";
    link.href = item.hyperlink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append("View item ", arrow);

    article.append(meta, heading, description, link);
    return article;
  }

  function validateItem(item) {
    if (
      !item ||
      typeof item.date !== "string" ||
      typeof item.name !== "string" ||
      typeof item.description !== "string" ||
      typeof item.topic !== "string" ||
      typeof item.courseType !== "string" ||
      typeof item.hyperlink !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
    ) {
      throw new Error("The course data file contains an invalid Quality Improvement item.");
    }

    const [year, month, day] = item.date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new Error(`The course data file contains an invalid date: ${item.date}`);
    }

    const itemUrl = new URL(item.hyperlink, window.location.href);
    if (!["http:", "https:"].includes(itemUrl.protocol)) {
      throw new Error(`The course data file contains an unsafe link: ${item.id}`);
    }

    return { ...item, hyperlink: itemUrl.href };
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

  function createMessage(text, className) {
    const message = document.createElement("p");
    message.className = className;
    message.textContent = text;
    return message;
  }
})();
