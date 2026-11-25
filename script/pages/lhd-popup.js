(() => {
  const trigger = document.querySelector("[data-lhd-popup]");
  const dialog = document.getElementById("lhd-dialog");
  const dateList = document.getElementById("lhd-date-list");
  const closeButton = dialog?.querySelector(".lhd-dialog__close");

  if (!trigger || !dialog || !dateList || !closeButton) {
    throw new Error("Learning Half Day popup markup is incomplete.");
  }

  closeButton.addEventListener("click", () => dialog.close());

  trigger.addEventListener("click", async (event) => {
    event.preventDefault();
    dialog.showModal();
    dateList.textContent = "Loading upcoming dates…";

    try {
      const response = await fetch("data/lhd_dates.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.sessions)) {
        throw new Error("The dates file does not contain a sessions list.");
      }

      const today = getLocalDateString(new Date());
      const sessions = data.sessions
        .map(validateSession)
        .filter((session) => session.date >= today)
        .sort((first, second) => first.date.localeCompare(second.date));

      if (sessions.length === 0) {
        dateList.textContent = "There are no upcoming Learning Half Days.";
        return;
      }

      const list = document.createElement("ul");
      list.className = "lhd-date-list";

      for (const session of sessions) {
        const item = document.createElement("li");
        const date = document.createElement("strong");
        const time = document.createElement("span");

        date.textContent = session.displayDate;
        time.textContent = session.displayTime;
        item.append(date, time);
        list.append(item);
      }

      dateList.replaceChildren(list);
    } catch (error) {
      console.error("Unable to load upcoming Learning Half Days.", error);
      dateList.textContent =
        "Upcoming Learning Half Days could not be loaded. Please try again later.";
    }
  });

  function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function validateSession(session) {
    if (
      !session ||
      typeof session.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(session.date) ||
      typeof session.displayDate !== "string" ||
      typeof session.displayTime !== "string"
    ) {
      throw new Error("The dates file contains an invalid session.");
    }

    const [year, month, day] = session.date.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      throw new Error(`The dates file contains an invalid date: ${session.date}`);
    }

    return session;
  }
})();
