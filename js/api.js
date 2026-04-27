/**
 * DataSource wrapper pro Sprint Review Dashboard
 * Frontend volá pouze vlastní Vercel endpointy /api/...
 * Token není nikdy ve frontendu ani v config.js.
 *
 * Zásadní pravidlo:
 * - Review zobrazuje VŠECHNY tickety z API.
 * - Helpdesk = pouze tickety s parentId 1513 / isHelpdesk = true.
 * - Vše ostatní = ručně založené / plánovací DevOps tickety.
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

  async getSprints() {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.id);

    const sprintMap = new Map();

    allWorkItems.forEach(item => {
      const id = item.iterationPath || "all";
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

    const sprintList = Array.from(sprintMap.values())
      .sort((a, b) => new Date(b.latestChangedDate || 0) - new Date(a.latestChangedDate || 0));

    return [
      {
        id: "all",
        name: "Všechny tickety",
        fullPath: "",
        startDate: null,
        endDate: null,
        isCurrent: true,
        count: allWorkItems.length,
      },
      ...sprintList.map(s => ({ ...s, isCurrent: false })),
    ];
  },

  async getSprintData(sprintId = "all") {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.id);

    const sprints = await this.getSprints();

    const currentSprint =
      sprints.find(s => s.id === sprintId || s.fullPath === sprintId) ||
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
        : allWorkItems.filter(item => item.iterationPath === currentSprint.fullPath || item.iterationPath === currentSprint.id);

    const helpdesk = selectedWorkItems
      .filter(item => item.isHelpdesk)
      .map(item => this.normalizeHelpdeskItem(item));

    const planningItems = selectedWorkItems
      .filter(item => !item.isHelpdesk);

    return {
      sprint: currentSprint,
      workItems: selectedWorkItems,
      helpdesk,
      planningItems,
      debug: {
        ...(data.debug || {}),
        allCount: allWorkItems.length,
        selectedCount: selectedWorkItems.length,
        helpdeskCount: helpdesk.length,
        planningCount: planningItems.length,
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

    if (!ids || !ids.length) return allItems;

    const idSet = new Set(ids.map(Number));
    return allItems.filter(item => idSet.has(Number(item.id)));
  },

  async getHelpdeskData() {
    const data = await this.requestLocal("/api/devops/workitems");

    return (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.isHelpdesk)
      .map(item => this.normalizeHelpdeskItem(item));
  },
};

const DevOpsAPI = DataSource;
