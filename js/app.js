(function () {
  "use strict";

  /* Personal Dashboard – app.js */

  /* =========================================================
   * StorageUtil
   * Wraps localStorage with JSON serialisation and safe error
   * handling. All widgets use this object for persistence.
   * ========================================================= */
  var StorageUtil = {
    keys: {
      theme: "pd_theme",
      name: "pd_name",
      tasks: "pd_tasks",
      links: "pd_links"
    },

    /**
     * Retrieve and JSON-parse a value from localStorage.
     * Returns null when the key is absent, the JSON is corrupt,
     * or localStorage is unavailable.
     * @param {string} key
     * @returns {*|null}
     */
    get: function (key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) {
          return null;
        }
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    /**
     * JSON-stringify a value and write it to localStorage.
     * Returns true on success; returns false when localStorage
     * is unavailable or a quota error is thrown.
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Remove a key from localStorage.
     * @param {string} key
     */
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Storage unavailable – nothing to remove.
      }
    }
  };

  /* =========================================================
   * ThemeManager
   * Manages the light/dark theme: reads from StorageUtil,
   * applies the data-theme attribute to <html>, and wires
   * the toggle button.
   *
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8
   * ========================================================= */

  var ThemeManager = {
    /** @type {'light'|'dark'} */
    _theme: "light",

    /**
     * Read saved theme from storage, apply it to <html>, and
     * attach the click listener to the toggle button.
     * Defaults to 'light' when storage returns null or any
     * value that is neither 'light' nor 'dark'.
     */
    init: function () {
      var stored = StorageUtil.get(StorageUtil.keys.theme);
      this._theme = stored === "dark" || stored === "light" ? stored : "light";
      document.documentElement.setAttribute("data-theme", this._theme);

      var btn =
        document.getElementById("theme-toggle") ||
        document.querySelector('[data-action="toggle-theme"]');
      if (btn) {
        btn.addEventListener("click", function () {
          ThemeManager.toggle();
        });
      }
    },

    /**
     * Flip the current theme between 'light' and 'dark',
     * persist the new value via StorageUtil (silently skips
     * persistence when set() returns false), and update the
     * data-theme attribute on <html>.
     */
    toggle: function () {
      this._theme = this._theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", this._theme);
      StorageUtil.set(StorageUtil.keys.theme, this._theme);
    },

    /**
     * Return the in-memory theme string.
     * @returns {'light'|'dark'}
     */
    current: function () {
      return this._theme;
    }
  };

  /* =========================================================
   * GreetingWidget
   * Displays the current time, date, and a time-of-day
   * salutation that optionally includes the stored user name.
   * Updates every second via setInterval.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
   * ========================================================= */
  var GreetingWidget = {
    /**
     * Map a local hour (0–23) to one of four salutation strings.
     * @param {number} hour
     * @returns {string}
     */
    _getSalutation: function (hour) {
      if (hour >= 5 && hour <= 11) {
        return "Good Morning";
      }
      if (hour >= 12 && hour <= 17) {
        return "Good Afternoon";
      }
      if (hour >= 18 && hour <= 20) {
        return "Good Evening";
      }
      // hours 21–23 and 0–4
      return "Good Night";
    },

    /**
     * Return the time portion of a Date as a zero-padded HH:MM string
     * using the browser's local timezone.
     * @param {Date} date
     * @returns {string}
     */
    _formatTime: function (date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      return (
        (hours < 10 ? "0" : "") +
        hours +
        ":" +
        (minutes < 10 ? "0" : "") +
        minutes
      );
    },

    /**
     * Return the date portion of a Date as "Day, DD Month YYYY"
     * (e.g., "Monday, 19 November 2026") in the browser's local timezone.
     * @param {Date} date
     * @returns {string}
     */
    _formatDate: function (date) {
      var days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      var months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      var dayName = days[date.getDay()];
      var dd = date.getDate();
      var monthName = months[date.getMonth()];
      var yyyy = date.getFullYear();
      return (
        dayName +
        ", " +
        (dd < 10 ? "0" : "") +
        dd +
        " " +
        monthName +
        " " +
        yyyy
      );
    },

    /**
     * Read the current time and stored name, then update the
     * three greeting DOM nodes in-place (no full re-render).
     * Appends the stored name to the salutation when the name
     * is between 1 and 50 characters inclusive.
     */
    refresh: function () {
      var now = new Date();
      var salutation = this._getSalutation(now.getHours());
      var name = StorageUtil.get("pd_name");

      // Append name only when it is a string of 1–50 characters.
      if (typeof name === "string" && name.length >= 1 && name.length <= 50) {
        salutation = salutation + ", " + name;
      }

      var elSalutation = document.getElementById("greeting-salutation");
      var elTime = document.getElementById("greeting-time");
      var elDate = document.getElementById("greeting-date");

      if (elSalutation) {
        elSalutation.textContent = salutation;
      }
      if (elTime) {
        elTime.textContent = this._formatTime(now);
      }
      if (elDate) {
        elDate.textContent = this._formatDate(now);
      }
    },

    /**
     * Perform an immediate refresh and schedule subsequent
     * refreshes every 1000 ms.
     */
    init: function () {
      this.refresh();
      setInterval(function () {
        GreetingWidget.refresh();
      }, 1000);
    }
  };

  /* =========================================================
   * TodoWidget
   * Manages the to-do list: add, edit, complete, and delete
   * tasks. Persists all state to localStorage via StorageUtil.
   *
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8,
   *               4.9, 4.10, 4.11, 4.12
   * ========================================================= */
  var TodoWidget = {
    /** @type {Array<{id: string, name: string, done: boolean, createdAt: number}>} */
    _tasks: [],

    /**
     * Generate a unique ID using crypto.randomUUID() when available,
     * falling back to a Date.now() + Math.random() string.
     * @returns {string}
     */
    _generateId: function () {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
      return Date.now().toString() + Math.random();
    },

    /**
     * Load the task array from StorageUtil.
     * Returns an empty array when the stored value is null,
     * not an array, or otherwise corrupt.
     * @returns {Array<{id: string, name: string, done: boolean, createdAt: number}>}
     */
    _loadTasks: function () {
      var data = StorageUtil.get(StorageUtil.keys.tasks);
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    },

    /**
     * Persist the in-memory _tasks array to localStorage.
     * Silently skips when StorageUtil.set returns false
     * (storage unavailable or quota exceeded).
     */
    _saveTasks: function () {
      StorageUtil.set(StorageUtil.keys.tasks, this._tasks);
    },

    /**
     * Rebuild the full #todo-list DOM from the in-memory _tasks
     * array sorted by createdAt ascending (insertion order).
     *
     * Each task row contains:
     *   - A complete-toggle checkbox button
     *   - A <span> with the task name (adds class task--done when done)
     *   - An edit button
     *   - A delete button
     *
     * Completed tasks receive the CSS class task--done on the row
     * element and their name span, providing visual distinction
     * (e.g. strikethrough via CSS).
     */
    _renderList: function () {
      var list = document.getElementById("todo-list");
      if (!list) {
        return;
      }

      // Sort a copy by createdAt ascending; keep _tasks in its own order.
      var sorted = this._tasks.slice().sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });

      // Clear existing rows.
      list.innerHTML = "";

      var self = this;
      sorted.forEach(function (task) {
        var li = document.createElement("li");
        li.setAttribute("data-id", task.id);
        if (task.done) {
          li.classList.add("task--done");
        }

        // Complete-toggle button
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "task-toggle";
        toggleBtn.setAttribute(
          "aria-label",
          task.done ? "Mark incomplete" : "Mark complete"
        );
        toggleBtn.textContent = task.done ? "✓" : "○";
        toggleBtn.addEventListener("click", function () {
          self._toggleComplete(task.id);
        });

        // Task name span
        var nameSpan = document.createElement("span");
        nameSpan.className = "task-name" + (task.done ? " task--done" : "");
        nameSpan.textContent = task.name;

        // Edit button
        var editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "task-edit";
        editBtn.setAttribute("aria-label", "Edit task");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () {
          self._beginEdit(task.id);
        });

        // Delete button
        var deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "task-delete";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", function () {
          self._deleteTask(task.id);
        });

        li.appendChild(toggleBtn);
        li.appendChild(nameSpan);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    },

    /**
     * Check whether a task with the same name (trimmed, lowercased)
     * already exists in _tasks. When excludeId is supplied, the task
     * with that id is skipped (used during edits so a task is not
     * compared against itself).
     *
     * @param {string} name      - The name to test (will be trimmed + lowercased).
     * @param {string} [excludeId] - Optional id of the task to skip.
     * @returns {boolean}
     *
     * Requirements: 4.3
     */
    _isDuplicate: function (name, excludeId) {
      var normalized = name.trim().toLowerCase();
      for (var i = 0; i < this._tasks.length; i++) {
        var task = this._tasks[i];
        if (excludeId !== undefined && task.id === excludeId) {
          continue;
        }
        if (task.name.trim().toLowerCase() === normalized) {
          return true;
        }
      }
      return false;
    },

    /**
     * Validate and add a new task from the add-task input field.
     *
     * Validation order (Requirements 4.1, 4.2, 4.3):
     *   1. Trim the name.
     *   2. If trimmed is empty/whitespace-only → clear the input, no error, return.
     *   3. If trimmed exceeds 200 characters → show inline error, reject.
     *   4. If _isDuplicate(trimmedName) → show inline error, reject.
     *   5. Otherwise: create task, push to _tasks, save, render, clear input.
     *
     * @param {string} name - The raw value from the input field.
     *
     * Requirements: 4.1, 4.2, 4.3
     */
    _addTask: function (name) {
      var input = document.getElementById("todo-input");
      var errorEl = document.getElementById("todo-error");

      var trimmed = name.trim();

      // Step 2: empty or whitespace-only → clear input silently.
      if (trimmed === "") {
        if (input) {
          input.value = "";
        }
        return;
      }

      // Step 3: exceeds 200 characters.
      if (trimmed.length > 200) {
        if (errorEl) {
          errorEl.textContent = "Task name must be 200 characters or fewer.";
        }
        return;
      }

      // Step 4: duplicate check.
      if (this._isDuplicate(trimmed)) {
        if (errorEl) {
          errorEl.textContent = "A task with this name already exists.";
        }
        return;
      }

      // Step 5: create and persist the task.
      var task = {
        id: this._generateId(),
        name: trimmed,
        done: false,
        createdAt: Date.now()
      };
      this._tasks.push(task);
      this._saveTasks();
      this._renderList();

      if (input) {
        input.value = "";
      }
      if (errorEl) {
        errorEl.textContent = "";
      }
    },

    /**
     * Flip the done boolean on the matching task, persist the change,
     * and re-render the list.
     *
     * @param {string} id - The id of the task to toggle.
     *
     * Requirements: 4.4, 4.5
     */
    _toggleComplete: function (id) {
      for (var i = 0; i < this._tasks.length; i++) {
        if (this._tasks[i].id === id) {
          this._tasks[i].done = !this._tasks[i].done;
          break;
        }
      }
      this._saveTasks();
      this._renderList();
    },

    /**
     * Remove the matching task from _tasks, persist the change,
     * and re-render the list.
     *
     * @param {string} id - The id of the task to delete.
     *
     * Requirements: 4.6
     */
    _deleteTask: function (id) {
      this._tasks = this._tasks.filter(function (task) {
        return task.id !== id;
      });
      this._saveTasks();
      this._renderList();
    },

    /**
     * Switch the named task's row into inline edit mode.
     * Calls _renderList() first to ensure at most one task is
     * in edit mode at a time, then locates the row by data-id,
     * replaces the name <span> with a pre-filled <input>, and
     * swaps the Edit/Delete buttons for Confirm/Discard buttons.
     *
     * @param {string} id - The id of the task to edit.
     *
     * Requirements: 4.7
     */
    _beginEdit: function (id) {
      // Re-render first so any previously open edit row is closed.
      this._renderList();

      var list = document.getElementById("todo-list");
      if (!list) {
        return;
      }

      // Find the task object so we can pre-fill the input.
      var task = null;
      for (var i = 0; i < this._tasks.length; i++) {
        if (this._tasks[i].id === id) {
          task = this._tasks[i];
          break;
        }
      }
      if (!task) {
        return;
      }

      // Locate the rendered <li> for this task.
      var li = list.querySelector('li[data-id="' + id + '"]');
      if (!li) {
        return;
      }

      // Remove the name <span>.
      var nameSpan = li.querySelector(".task-name");
      if (nameSpan) {
        li.removeChild(nameSpan);
      }

      // Create the edit <input> pre-filled with the current name.
      var editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "task-edit-input";
      editInput.value = task.name;
      editInput.setAttribute("aria-label", "Edit task name");
      editInput.maxLength = 200;

      // Inline error span for edit validation feedback.
      var editError = document.createElement("span");
      editError.className = "task-edit-error";
      editError.setAttribute("aria-live", "polite");
      editError.textContent = "";

      // Clear error as the user types.
      var self = this;
      editInput.addEventListener("input", function () {
        editError.textContent = "";
      });

      // Create Confirm button.
      var confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "task-confirm";
      confirmBtn.setAttribute("aria-label", "Confirm edit");
      confirmBtn.textContent = "Confirm";
      confirmBtn.addEventListener("click", function () {
        self._confirmEdit(id, editInput.value);
      });

      // Allow Enter key to confirm.
      editInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          self._confirmEdit(id, editInput.value);
        }
        if (e.key === "Escape") {
          self._discardEdit(id);
        }
      });

      // Create Discard button.
      var discardBtn = document.createElement("button");
      discardBtn.type = "button";
      discardBtn.className = "task-discard";
      discardBtn.setAttribute("aria-label", "Discard edit");
      discardBtn.textContent = "Discard";
      discardBtn.addEventListener("click", function () {
        self._discardEdit(id);
      });

      // Hide the existing Edit and Delete buttons.
      var editBtn = li.querySelector(".task-edit");
      var deleteBtn = li.querySelector(".task-delete");
      if (editBtn) {
        editBtn.style.display = "none";
      }
      if (deleteBtn) {
        deleteBtn.style.display = "none";
      }

      // Insert the input, error span, and new buttons after the toggle button.
      var toggleBtn = li.querySelector(".task-toggle");
      if (toggleBtn && toggleBtn.nextSibling) {
        li.insertBefore(editInput, toggleBtn.nextSibling);
        li.insertBefore(editError, editInput.nextSibling);
        li.insertBefore(confirmBtn, editError.nextSibling);
        li.insertBefore(discardBtn, confirmBtn.nextSibling);
      } else {
        li.appendChild(editInput);
        li.appendChild(editError);
        li.appendChild(confirmBtn);
        li.appendChild(discardBtn);
      }

      // Focus the input so the user can start typing immediately.
      editInput.focus();
    },

    /**
     * Validate the new name with the same rules as _addTask, excluding
     * the task being edited from the duplicate check. On success, update
     * the task's name, persist, and re-render. On failure, show an inline
     * error inside the edit row without touching storage.
     *
     * @param {string} id   - The id of the task being edited.
     * @param {string} name - The raw value from the edit input.
     *
     * Requirements: 4.9, 4.10
     */
    _confirmEdit: function (id, name) {
      var list = document.getElementById("todo-list");
      var editError = list
        ? list.querySelector('li[data-id="' + id + '"] .task-edit-error')
        : null;

      var trimmed = name.trim();

      // Empty / whitespace-only: treat the same as _addTask — silently discard.
      if (trimmed === "") {
        if (editError) {
          editError.textContent = "Task name cannot be empty.";
        }
        return;
      }

      // Exceeds 200 characters.
      if (trimmed.length > 200) {
        if (editError) {
          editError.textContent = "Task name must be 200 characters or fewer.";
        }
        return;
      }

      // Duplicate check — exclude the task being edited.
      if (this._isDuplicate(trimmed, id)) {
        if (editError) {
          editError.textContent = "A task with this name already exists.";
        }
        return;
      }

      // All validation passed — apply the update.
      for (var i = 0; i < this._tasks.length; i++) {
        if (this._tasks[i].id === id) {
          this._tasks[i].name = trimmed;
          break;
        }
      }
      this._saveTasks();
      this._renderList();
    },

    /**
     * Discard the in-progress edit by re-rendering the list from the
     * unchanged _tasks array. Does not modify storage.
     *
     * @param {string} id - The id of the task whose edit is being discarded.
     *
     * Requirements: 4.8
     */
    _discardEdit: function (id) {
      this._renderList();
    },

    /**
     * Load persisted tasks, render the list, and wire up the
     * add-task form (submit event covers both button click and
     * Enter key on the input).
     * Also clears the inline error whenever the user edits the input.
     *
     * Requirements: 4.1, 4.2, 4.3
     */
    init: function () {
      this._tasks = this._loadTasks();
      this._renderList();

      var form = document.getElementById("todo-form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var input = document.getElementById("todo-input");
          TodoWidget._addTask(input ? input.value : "");
        });
      }

      var input = document.getElementById("todo-input");
      var errorEl = document.getElementById("todo-error");
      if (input && errorEl) {
        input.addEventListener("input", function () {
          errorEl.textContent = "";
        });
      }
    }
  };

  /* =========================================================
   * FocusTimerWidget
   * Implements a 25-minute Pomodoro countdown timer with a
   * four-state machine: Idle → Running → Paused → Done.
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7,
   *               3.8, 3.9, 3.10, 3.11
   * ========================================================= */
  var FocusTimerWidget = {
    /** @type {'Idle'|'Running'|'Paused'|'Done'} */
    _state: "Idle",

    /** Remaining seconds (default 25 × 60 = 1500). */
    _remaining: 1500,

    /** setInterval handle; null when no interval is active. */
    _intervalId: null,

    /** Default page title captured at init time. */
    _defaultTitle: "",

    /**
     * Sets state to Idle, remaining to 1500, renders 25:00,
     * and attaches event listeners to the Start, Stop, and
     * Reset buttons.
     */
    init: function () {
      var displayEl = document.getElementById("timer-display");
      if (!displayEl) {
        return; // DOM node absent – no-op.
      }

      this._state = "Idle";
      this._remaining = 1500;
      this._defaultTitle = document.title;
      this._updateDisplay();

      var startBtn = document.getElementById("timer-start");
      var stopBtn = document.getElementById("timer-stop");
      var resetBtn = document.getElementById("timer-reset");

      if (startBtn) {
        startBtn.addEventListener("click", function () {
          FocusTimerWidget.start();
        });
      }
      if (stopBtn) {
        stopBtn.addEventListener("click", function () {
          FocusTimerWidget.stop();
        });
      }
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          FocusTimerWidget.reset();
        });
      }
    },

    /**
     * Transitions from Idle, Paused, or Done to Running.
     * When called from Done, resets remaining to 1500 first.
     * No-op when already Running (Req 3.8).
     */
    start: function () {
      if (this._state === "Running") {
        return; // Req 3.8 – ignore double-start.
      }

      if (this._state === "Done") {
        this._remaining = 1500; // Req 3.9 – new session resets timer.
      }

      this._state = "Running";

      // Remove completion styling if re-starting after Done.
      var container = document.getElementById("timer-section");
      if (container) {
        container.classList.remove("timer--complete");
      }

      this._intervalId = setInterval(function () {
        FocusTimerWidget._tick();
      }, 1000);
    },

    /**
     * Pauses the countdown and retains the current remaining
     * time (Req 3.4). No-op when state is not Running.
     */
    stop: function () {
      if (this._state !== "Running") {
        return;
      }
      this._state = "Paused";
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._updateDisplay(); // Keep title updated for Paused state.
    },

    /**
     * Clears any active interval, resets state to Idle and
     * remaining to 1500, then refreshes the display (Req 3.5).
     */
    reset: function () {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._state = "Idle";
      this._remaining = 1500;

      var container = document.getElementById("timer-section");
      if (container) {
        container.classList.remove("timer--complete");
      }

      this._updateDisplay();
    },

    /**
     * Called by setInterval every second while Running.
     * Decrements remaining, updates display, and triggers
     * completion when remaining reaches 0.
     */
    _tick: function () {
      this._remaining -= 1;
      this._updateDisplay();
      if (this._remaining <= 0) {
        this._onComplete();
      }
    },

    /**
     * Writes the current remaining time to the timer display
     * in MM:SS format (Req 3.10).
     * Updates document.title while Running or Paused (Req 3.11).
     * Restores the default title when Idle or Done.
     */
    _updateDisplay: function () {
      var displayEl = document.getElementById("timer-display");
      if (!displayEl) {
        return;
      }

      var total = Math.max(0, this._remaining);
      var minutes = Math.floor(total / 60);
      var seconds = total % 60;
      var mm = minutes < 10 ? "0" + minutes : String(minutes);
      var ss = seconds < 10 ? "0" + seconds : String(seconds);
      var formatted = mm + ":" + ss;

      displayEl.textContent = formatted;

      if (this._state === "Running" || this._state === "Paused") {
        document.title = formatted + " – Personal Dashboard";
      } else {
        document.title = this._defaultTitle;
      }
    },

    /**
     * Handles countdown completion (Req 3.6):
     * - Stops the interval and transitions to Done.
     * - Sets display to 00:00.
     * - Adds CSS class timer--complete to the timer container.
     * - Creates and plays a 440 Hz tone via AudioContext; falls
     *   back silently when AudioContext is unavailable.
     * - Restores document.title to the default page title.
     */
    _onComplete: function () {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._state = "Done";
      this._remaining = 0;

      var displayEl = document.getElementById("timer-display");
      if (displayEl) {
        displayEl.textContent = "00:00";
      }

      var container = document.getElementById("timer-section");
      if (container) {
        container.classList.add("timer--complete");
      }

      document.title = this._defaultTitle;

      // Play a 440 Hz beep via Web Audio API; fail silently.
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext || null;
        if (AudioCtx) {
          var ctx = new AudioCtx();
          var oscillator = ctx.createOscillator();
          var gainNode = ctx.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + 1.5
          );

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 1.5);
        }
      } catch (e) {
        // AudioContext unavailable or restricted – skip audio.
      }
    }
  };

  /* =========================================================
   * QuickLinksWidget
   * Manages user-defined shortcut buttons to external URLs.
   * Each Link is a plain object { id, label, url } stored in
   * localStorage under the key 'pd_links'.
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.8, 5.9
   * ========================================================= */
  var QuickLinksWidget = {
    /** @type {Array<{id: string, label: string, url: string}>} */
    _links: [],

    /* -------------------------------------------------------
     * _newId()
     * Generate a unique ID for a new Link.
     * Uses crypto.randomUUID() when available; falls back to
     * a Date.now() + Math.random() string.
     * @returns {string}
     * ------------------------------------------------------- */
    _newId: function () {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
      return Date.now().toString() + Math.random();
    },

    /* -------------------------------------------------------
     * _loadLinks()
     * Read the links array from localStorage via StorageUtil.
     * Returns [] when the stored value is null, not an array,
     * or the JSON was corrupt (StorageUtil.get handles the
     * JSON parse failure and returns null in that case).
     *
     * Requirements: 5.8, 5.9
     * @returns {Array<{id: string, label: string, url: string}>}
     * ------------------------------------------------------- */
    _loadLinks: function () {
      var stored = StorageUtil.get(StorageUtil.keys.links);
      if (!Array.isArray(stored)) {
        return [];
      }
      return stored;
    },

    /* -------------------------------------------------------
     * _saveLinks()
     * Persist the in-memory _links array to localStorage via
     * StorageUtil. Silently skips when StorageUtil.set returns
     * false (storage unavailable or quota exceeded).
     *
     * Requirements: 5.1, 5.9
     * ------------------------------------------------------- */
    _saveLinks: function () {
      StorageUtil.set(StorageUtil.keys.links, this._links);
    },

    /* -------------------------------------------------------
     * _validateLabel(label)
     * Validate the link label before saving.
     *
     * Returns an error string when:
     *   - label is empty or whitespace-only  (Req 5.2)
     *   - label exceeds 50 characters        (Req 5.4)
     * Returns null when the label is valid.
     *
     * @param {string} label
     * @returns {string|null}
     * ------------------------------------------------------- */
    _validateLabel: function (label) {
      if (typeof label !== "string" || label.trim().length === 0) {
        return "Label is required.";
      }
      if (label.length > 50) {
        return "Label must be 50 characters or fewer.";
      }
      return null;
    },

    /* -------------------------------------------------------
     * _validateUrl(url)
     * Validate the URL field before saving.
     *
     * Returns an error string when:
     *   - url is empty or whitespace-only    (Req 5.3)
     * Returns null otherwise. URL format normalisation
     * (prepending https://) is handled in _addLink() after
     * all validation passes — it is not rejected here.
     *
     * @param {string} url
     * @returns {string|null}
     * ------------------------------------------------------- */
    _validateUrl: function (url) {
      if (typeof url !== "string" || url.trim().length === 0) {
        return "URL is required.";
      }
      return null;
    },

    /* -------------------------------------------------------
     * _renderLinks()
     * Rebuild the #links-list container from the in-memory
     * _links array. Each entry renders as:
     *   - An <a target="_blank" rel="noopener noreferrer">
     *     anchor with the label as its text, used as the
     *     shortcut button that opens the URL (Req 5.6).
     *   - A <button> delete control (Req 5.7).
     *
     * Both are wrapped in a <div class="link-item">.
     *
     * Requirements: 5.6, 5.7, 5.8
     * ------------------------------------------------------- */
    _renderLinks: function () {
      var container = document.getElementById("links-list");
      if (!container) {
        return; // DOM node absent – no-op.
      }

      // Clear existing content.
      container.innerHTML = "";

      this._links.forEach(function (link) {
        // Wrapper for a single link row.
        var item = document.createElement("div");
        item.className = "link-item";
        item.setAttribute("data-id", link.id);

        // Shortcut anchor styled as a button (Req 5.6).
        var anchor = document.createElement("a");
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = link.label;
        anchor.className = "link-anchor";

        // Delete button (Req 5.7).
        var deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "link-delete";
        deleteBtn.setAttribute("aria-label", "Delete link: " + link.label);
        deleteBtn.setAttribute("data-id", link.id);
        deleteBtn.addEventListener("click", function () {
          QuickLinksWidget._deleteLink(link.id);
        });

        item.appendChild(anchor);
        item.appendChild(deleteBtn);
        container.appendChild(item);
      });
    },

    /* -------------------------------------------------------
     * _addLink(label, url)
     * Validate label and URL; on success normalise the URL and
     * append the new Link to the list.
     *
     * Validation order:
     *   1. Run _validateLabel — show inline label error and
     *      return when it returns a non-null string (Req 5.2, 5.4).
     *   2. Run _validateUrl — show inline URL error and return
     *      when it returns a non-null string (Req 5.3).
     *   3. Prepend 'https://' when the URL does not already
     *      start with 'http://' or 'https://' (Req 5.5).
     *   4. Create a Link object, push to _links, persist, render
     *      (Req 5.1).
     *
     * Requirements: 5.1, 5.5
     * ------------------------------------------------------- */
    _addLink: function (label, url) {
      var labelError = document.getElementById("link-label-error");
      var urlError = document.getElementById("link-url-error");

      // Clear previous errors before re-validating.
      if (labelError) {
        labelError.textContent = "";
      }
      if (urlError) {
        urlError.textContent = "";
      }

      // Step 1: validate label.
      var labelMsg = this._validateLabel(label);
      if (labelMsg !== null) {
        if (labelError) {
          labelError.textContent = labelMsg;
        }
        return;
      }

      // Step 2: validate URL.
      var urlMsg = this._validateUrl(url);
      if (urlMsg !== null) {
        if (urlError) {
          urlError.textContent = urlMsg;
        }
        return;
      }

      // Step 3: normalise URL — prepend https:// when no scheme is present (Req 5.5).
      var normalizedUrl = url.trim();
      if (
        normalizedUrl.indexOf("http://") !== 0 &&
        normalizedUrl.indexOf("https://") !== 0
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      // Step 4: create Link, push, persist, render (Req 5.1).
      var newLink = {
        id: this._newId(),
        label: label.trim(),
        url: normalizedUrl
      };

      this._links.push(newLink);
      this._saveLinks();
      this._renderLinks();
    },

    /* -------------------------------------------------------
     * _deleteLink(id)
     * Remove the Link with the given id from the in-memory
     * array, persist the change, and re-render the list.
     *
     * Requirements: 5.7
     * ------------------------------------------------------- */
    _deleteLink: function (id) {
      this._links = this._links.filter(function (link) {
        return link.id !== id;
      });
      this._saveLinks();
      this._renderLinks();
    },

    /* -------------------------------------------------------
     * init()
     * Load persisted links, render them, and wire the add-link
     * form submit listener. Clears per-field error spans when
     * the user edits either input field.
     *
     * Requirements: 5.1, 5.8
     * ------------------------------------------------------- */
    init: function () {
      var section = document.getElementById("links-section");
      if (!section) {
        return; // DOM node absent – no-op.
      }

      // Load links from storage and render.
      this._links = this._loadLinks();
      this._renderLinks();

      // Wire the form submit event (covers both button click and Enter key).
      var form = document.getElementById("links-form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var labelInput = document.getElementById("link-label-input");
          var urlInput = document.getElementById("link-url-input");
          var labelVal = labelInput ? labelInput.value : "";
          var urlVal = urlInput ? urlInput.value : "";
          QuickLinksWidget._addLink(labelVal, urlVal);
          // Clear inputs on successful add: the inputs are cleared only when
          // _addLink does not display an error. We detect success by checking
          // that both error spans are still empty after the call.
          var labelError = document.getElementById("link-label-error");
          var urlError = document.getElementById("link-url-error");
          var hasError =
            (labelError && labelError.textContent !== "") ||
            (urlError && urlError.textContent !== "");
          if (!hasError) {
            if (labelInput) {
              labelInput.value = "";
            }
            if (urlInput) {
              urlInput.value = "";
            }
          }
        });
      }

      // Clear per-field errors as the user types in each input.
      var labelInput = document.getElementById("link-label-input");
      var urlInput = document.getElementById("link-url-input");
      var labelError = document.getElementById("link-label-error");
      var urlError = document.getElementById("link-url-error");

      if (labelInput && labelError) {
        labelInput.addEventListener("input", function () {
          labelError.textContent = "";
        });
      }
      if (urlInput && urlError) {
        urlInput.addEventListener("input", function () {
          urlError.textContent = "";
        });
      }
    }
  };

  /* =========================================================
   * NameWidget
   * Manages the name input form. Validates user input, persists
   * the name via StorageUtil, and triggers GreetingWidget.refresh()
   * on success.
   *
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
   * ========================================================= */
  var NameWidget = {
    /** @type {HTMLInputElement|null} */
    _input: null,
    /** @type {HTMLSpanElement|null} */
    _error: null,

    /**
     * Pre-populate the name input from storage and attach
     * event listeners for form submit and input editing.
     * Req 2.6: pre-populates the field with the stored name on page load.
     * Req 2.2: handles both button click and Enter key via the form submit
     *           event (the Save button is type="submit").
     */
    init: function () {
      this._input = document.getElementById("name-input");
      this._error = document.getElementById("name-error");

      if (!this._input) {
        return;
      }

      // Req 2.6: pre-populate from storage on page load
      var stored = StorageUtil.get(StorageUtil.keys.name);
      if (stored && typeof stored === "string") {
        this._input.value = stored;
      }

      var form = document.getElementById("name-form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          NameWidget._onSubmit();
        });
      }

      // Clear any error when the user edits the field
      this._input.addEventListener("input", function () {
        NameWidget._clearError();
      });
    },

    /**
     * Validate and persist the input value.
     * Validation order:
     *   1. Trim the value.
     *   2. If trimmed is empty → ignore (Req 2.3).
     *   3. If original length > 100 → reject with error (Req 2.4).
     *   4. StorageUtil.set returns false → storage error (Req 2.8).
     *   5. Success → call GreetingWidget.refresh() (Req 2.5).
     */
    _onSubmit: function () {
      if (!this._input) {
        return;
      }

      var original = this._input.value;
      var trimmed = original.trim();

      // Step 2: ignore empty submissions, keep stored name (Req 2.3)
      if (trimmed === "") {
        return;
      }

      // Step 3: reject names exceeding 100 characters based on original pre-trim value (Req 2.4)
      if (original.length > 100) {
        this._showError("Name must be 100 characters or fewer.");
        return;
      }

      // Step 4: attempt to persist (Req 2.7)
      var saved = StorageUtil.set(StorageUtil.keys.name, trimmed);
      if (!saved) {
        // Req 2.8: show storage error; retain submitted text (already in field)
        this._showError(
          "Your name could not be saved. Storage is unavailable."
        );
        return;
      }

      // Step 5: success — update field to trimmed value and refresh greeting (Req 2.2, 2.5)
      this._clearError();
      this._input.value = trimmed;
      GreetingWidget.refresh();
    },

    /**
     * Display an error message inline next to the name input.
     * @param {string} msg
     */
    _showError: function (msg) {
      if (this._error) {
        this._error.textContent = msg;
      }
    },

    /**
     * Clear any displayed error message.
     * Called when the user edits the field.
     */
    _clearError: function () {
      if (this._error) {
        this._error.textContent = "";
      }
    }
  };

  /* =========================================================
   * Bootstrap
   * Initialise all widgets once the DOM is ready.
   * Boot order:
   *   1. ThemeManager      – applies saved theme before any paint.
   *   2. GreetingWidget    – starts the clock immediately.
   *   3. NameWidget        – pre-populates name field; calls
   *                          GreetingWidget.refresh() on save (Req 2.5).
   *   4. FocusTimerWidget  – wires timer controls.
   *   5. TodoWidget        – loads and renders persisted tasks.
   *   6. QuickLinksWidget  – loads and renders persisted links.
   *
   * Requirements: 1.1, 2.5, 7.4, 7.6
   * ========================================================= */
  document.addEventListener("DOMContentLoaded", function () {
    ThemeManager.init();
    GreetingWidget.init();
    NameWidget.init();
    FocusTimerWidget.init();
    TodoWidget.init();
    QuickLinksWidget.init();
  });
})();
