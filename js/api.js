/**
 * DataSource wrapper pro Sprint Review Dashboard
 * Frontend volá pouze vlastní Vercel endpointy /api/...
 *
 * Pravidla:
 * - Helpdesk = parentId 1513 / isHelpdesk = true.
 * - Vše ostatní = ručně založené / plánovací DevOps tickety.
 * - Výchozí zobrazení = aktuální sprint podle dnešního data v názvu sprintu.
 */

const DataSource = {
  async requestLocal(path, options = {}) {
    const resp = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      throw new Error(
        data?.error ||
        data?.detail ||
        "Chyba při načítání dat z interního API."
      );
    }

    return data;
  },

  sprintShortName(iterationPath) {
    if (!iterationPath) return "Bez sprintu";
    return String(iterationPath).split("\\").pop() || "Bez sprintu";
  },

  parseSprintDateRange(text) {
    if (!text) return null;

    const normalized = String(text).replace(/\s+/g, " ");
    const match = normalized.match(/(\d{1,2})\.(\d{1,2})\.?\s*-\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);

    if (!match) return null;

    const [, sd, sm, ed, em, year] = match;

    const start = new Date(Number(year), Number(sm) - 1, Number(sd));
    const end = new Date(Number(year), Number(em) - 1, Number(ed), 23, 59, 59, 999);

    if (isNaN(start) || isNaN(end)) return null;

    return { start, end };
  },

  getSprintSortDate(sprint) {
    const range = this.parseSprintDateRange(sprint.name) || this.parseSprintDateRange(sprint.fullPath);
    if (range) return range.start.getTime();

    if (sprint.latestChangedDate) return new Date(sprint.latestChangedDate).getTime();

    return 0;
  },

  isCurrentSprintByDate(sprint) {
    const range = this.parseSprintDateRange(sprint.name) || this.parseSprintDateRange(sprint.fullPath);
    if (!range) return false;

    const now = new Date();
    return now >= range.start && now <= range.end;
  },

  normalizeWorkItem(item) {
    const id = Number(item.id || item.devopsId);
    const parentId =
      item.parentId !== undefined && item.parentId !== null
        ? Number(item.parentId)
        : null;

    const isHelpdesk =
      item.isHelpdesk === true ||
      parentId === 1513;

    const assignee =
      item.assignee ||
      item.assignedTo ||
      item.owner ||
      "Nepřiřazeno";

    const closedDate =
      item.closedDate ||
      item.devOpsClosedDate ||
      item.resolvedDate ||
      item.helpdeskResolvedDate ||
      null;

    const iterationPath = item.iterationPath || "";

    return {
      id,
      devopsId: id,
      url: item.url || "",

      parentId,
      isHelpdesk,

      title: item.title || "",
      state: item.state || item.status || "",
      type: item.type || "",

      assignee,
      assignedTo: assignee,
      owner: item.owner || assignee,

      createdDate: item.createdDate || null,
      changedDate: item.changedDate || null,
      closedDate,
      devOpsClosedDate: item.devOpsClosedDate || closedDate,
      resolvedDate: closedDate,

      iterationPath,
      sprintName: this.sprintShortName(iterationPath),

      areaPath: item.areaPath || "",
      priority: item.priority || null,
      tags: item.tags || "",

      estimatedHours:
        item.estimatedHours ??
        item.originalEstimate ??
        null,

      completedHours:
        item.completedHours ??
        item.completedWork ??
        0,

      remainingHours:
        item.remainingHours ??
        item.remainingWork ??
        0,

      originalEstimate:
        item.originalEstimate ??
        item.estimatedHours ??
        null,

      completedWork:
        item.completedWork ??
        item.completedHours ??
        0,

      remainingWork:
        item.remainingWork ??
        item.remainingHours ??
        0,
    };
  },

  normalizeHelpdeskItem(item) {
    const x = this.normalizeWorkItem(item);

    return {
      ...x,
      id: x.id,
      devopsId: x.id,
      title: x.title,
      priority: x.priority,
      status: x.state,
      owner: x.assignee,
      createdDate: x.createdDate,
      resolvedDate: x.closedDate,
      closedDate: x.closedDate,
      isHelpdesk: true,
    };
  },

  sortWorkItems(items) {
    return [...items].sort((a, b) => {
      const stateWeight = {
        Active: 1,
        New: 2,
        Resolved: 3,
        Closed: 4,
      };

      const aw = stateWeight[a.state] || 9;
      const bw = stateWeight[b.state] || 9;

      if (aw !== bw) return aw - bw;

      const ad = new Date(a.closedDate || a.changedDate || a.createdDate || 0).getTime();
      const bd = new Date(b.closedDate || b.changedDate || b.createdDate || 0).getTime();

      return bd - ad;
    });
  },

  async getSprints() {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.id);

    const sprintMap = new Map();

    allWorkItems.forEach(item => {
      const id = item.iterationPath || "no-sprint";
      const name = item.iterationPath ? item.sprintName : "Bez sprintu";

      if (!sprintMap.has(id)) {
        sprintMap.set(id, {
          id,
          name,
          fullPath: item.iterationPath,
          startDate: null,
          endDate: null,
          isCurrent: false,
          count: 0,
          latestChangedDate: null,
        });
      }

      const sprint = sprintMap.get(id);
      sprint.count += 1;

      if (
        item.changedDate &&
        (!sprint.latestChangedDate ||
          new Date(item.changedDate) > new Date(sprint.latestChangedDate))
      ) {
        sprint.latestChangedDate = item.changedDate;
      }
    });

    let sprintList = Array.from(sprintMap.values());

    sprintList = sprintList.map(sprint => ({
      ...sprint,
      isCurrent: this.isCurrentSprintByDate(sprint),
      sortDate: this.getSprintSortDate(sprint),
    }));

    const currentSprint = sprintList.find(s => s.isCurrent);

    sprintList.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return (b.sortDate || 0) - (a.sortDate || 0);
    });

    const allOption = {
      id: "all",
      name: "Všechny tickety",
      fullPath: "",
      startDate: null,
      endDate: null,
      isCurrent: !currentSprint,
      count: allWorkItems.length,
      sortDate: Number.MAX_SAFE_INTEGER,
    };

    return currentSprint
      ? [sprintList[0], allOption, ...sprintList.slice(1)]
      : [allOption, ...sprintList];
  },

  async getSprintData(sprintId = null) {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.id);

    const sprints = await this.getSprints();

    const currentSprint =
      sprints.find(s => sprintId && (s.id === sprintId || s.fullPath === sprintId)) ||
      sprints.find(s => s.isCurrent) ||
      sprints[0] ||
      {
        id: "all",
        name: "Všechny tickety",
        fullPath: "",
        startDate: null,
        endDate: null,
        isCurrent: true,
      };

    const selectedWorkItems =
      currentSprint.id === "all"
        ? allWorkItems
        : allWorkItems.filter(item =>
            item.iterationPath === currentSprint.fullPath ||
            item.iterationPath === currentSprint.id
          );

    const sortedSelected = this.sortWorkItems(selectedWorkItems);

    const helpdesk = this.sortWorkItems(
      sortedSelected
        .filter(item => item.isHelpdesk)
        .map(item => this.normalizeHelpdeskItem(item))
    );

    const planningItems = this.sortWorkItems(
      sortedSelected.filter(item => !item.isHelpdesk)
    );

    return {
      sprint: currentSprint,
      workItems: sortedSelected,
      helpdesk,
      planningItems,
      debug: {
        ...(data.debug || {}),
        allCount: allWorkItems.length,
        selectedCount: sortedSelected.length,
        helpdeskCount: helpdesk.length,
        planningCount: planningItems.length,
        currentSprint: currentSprint.name,
        contains1983: allWorkItems.some(item => item.id === 1983),
        contains1984: allWorkItems.some(item => item.id === 1984),
      },
    };
  },

  async getWorkItemsBatch(ids) {
    const data = await this.requestLocal("/api/devops/workitems");

    const allItems = (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.id);

    if (!ids || !ids.length) return this.sortWorkItems(allItems);

    const idSet = new Set(ids.map(Number));
    return this.sortWorkItems(allItems.filter(item => idSet.has(Number(item.id))));
  },

  async getHelpdeskData() {
    const data = await this.requestLocal("/api/devops/workitems");

    return this.sortWorkItems(
      (data.workItems || [])
        .map(item => this.normalizeWorkItem(item))
        .filter(item => item.isHelpdesk)
        .map(item => this.normalizeHelpdeskItem(item))
    );
  },
};

const DevOpsAPI = DataSource;
