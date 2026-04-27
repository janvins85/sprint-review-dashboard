/**
 * DataSource wrapper pro Sprint Review Dashboard
 * Frontend volá pouze vlastní Vercel endpointy /api/...
 * Token není nikdy ve frontendu ani v config.js.
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
    if (!iterationPath) return "Aktuální sprint";
    return String(iterationPath).split("\\").pop();
  },

  normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  },

  normalizeWorkItem(item) {
    const assignee = item.assignee || item.assignedTo || "Nepřiřazeno";
    const closedDate = item.closedDate || item.devOpsClosedDate || null;
    const isHelpdesk = Boolean(item.isHelpdesk);

    return {
      id: Number(item.id),
      url: item.url,

      parentId: item.parentId ?? null,
      isHelpdesk,

      title: item.title || "",
      state: item.state || "",
      type: item.type || "",

      assignee,
      assignedTo: assignee,
      owner: item.owner || assignee,

      createdDate: item.createdDate || null,
      changedDate: item.changedDate || null,
      closedDate,

      devOpsClosedDate: item.devOpsClosedDate || closedDate,
      resolvedDate: item.resolvedDate || item.helpdeskResolvedDate || closedDate,

      iterationPath: item.iterationPath || "",
      sprintName: this.sprintShortName(item.iterationPath),

      areaPath: item.areaPath || "",
      priority: item.priority || null,
      tags: item.tags || "",

      estimatedHours: item.estimatedHours ?? item.originalEstimate ?? null,
      completedHours: item.completedHours ?? item.completedWork ?? 0,
      remainingHours: item.remainingHours ?? item.remainingWork ?? 0,

      originalEstimate: item.originalEstimate ?? item.estimatedHours ?? null,
      completedWork: item.completedWork ?? item.completedHours ?? 0,
      remainingWork: item.remainingWork ?? item.remainingHours ?? 0,

      devopsId: Number(item.devopsId || item.id),
    };
  },

  normalizeHelpdeskItem(item) {
    const normalized = this.normalizeWorkItem(item);

    return {
      devopsId: normalized.id,
      id: normalized.id,
      title: normalized.title,
      priority: normalized.priority,
      status: normalized.state,
      owner: normalized.assignee,
      createdDate: normalized.createdDate,
      resolvedDate: normalized.resolvedDate,
      closedDate: normalized.closedDate,
      iterationPath: normalized.iterationPath,
      areaPath: normalized.areaPath,
      tags: normalized.tags,
      isHelpdesk: true,
    };
  },

  async getSprints() {
    try {
      const data = await this.requestLocal("/api/devops/workitems");
      const workItems = (data.workItems || []).map(item =>
        this.normalizeWorkItem(item)
      );

      const sprintMap = new Map();

      workItems.forEach(item => {
        if (!item.iterationPath) return;

        const name = item.sprintName;
        const id = item.iterationPath;

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

      const sprints = Array.from(sprintMap.values())
        .sort((a, b) => new Date(b.latestChangedDate || 0) - new Date(a.latestChangedDate || 0));

      if (!sprints.length) {
        return [{
          id: "all",
          name: "Všechny tickety",
          fullPath: "",
          startDate: null,
          endDate: null,
          isCurrent: true,
          count: workItems.length,
        }];
      }

      sprints[0].isCurrent = true;
      return sprints;
    } catch (error) {
      console.warn("Sprints fallback:", error.message);

      return [{
        id: "all",
        name: "Všechny tickety",
        fullPath: "",
        startDate: null,
        endDate: null,
        isCurrent: true,
      }];
    }
  },

  async getSprintData(sprintId = null) {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || []).map(item =>
      this.normalizeWorkItem(item)
    );

    const sprints = await this.getSprints();

    const currentSprint =
      sprints.find(s => sprintId && (s.id === sprintId || s.fullPath === sprintId)) ||
      sprints.find(s => s.isCurrent) ||
      this.detectSprintFromWorkItems(allWorkItems);

    const sprintWorkItems = this.filterBySprint(allWorkItems, currentSprint);

    const helpdesk =
      (data.helpdesk && data.helpdesk.length)
        ? data.helpdesk.map(item => this.normalizeHelpdeskItem(item))
            .filter(item => this.belongsToSprint(item, currentSprint))
        : sprintWorkItems
            .filter(item => item.isHelpdesk)
            .map(item => this.normalizeHelpdeskItem(item));

    const helpdeskIds = new Set(helpdesk.map(h => Number(h.devopsId)));

    const planningItems =
      (data.planningItems && data.planningItems.length)
        ? data.planningItems.map(item => this.normalizeWorkItem(item))
            .filter(item => this.belongsToSprint(item, currentSprint))
        : sprintWorkItems.filter(item => !helpdeskIds.has(Number(item.id)));

    return {
      sprint: currentSprint,
      workItems: sprintWorkItems,
      helpdesk,
      planningItems,
      debug: data.debug || null,
    };
  },

  filterBySprint(workItems, sprint) {
    if (!sprint || !sprint.id || sprint.id === "all") return workItems;

    return workItems.filter(item => this.belongsToSprint(item, sprint));
  },

  belongsToSprint(item, sprint) {
    if (!sprint || !sprint.id || sprint.id === "all") return true;

    const itemPath = this.normalizeText(item.iterationPath);
    const itemSprint = this.normalizeText(item.sprintName);
    const sprintId = this.normalizeText(sprint.id);
    const sprintName = this.normalizeText(sprint.name);
    const sprintFullPath = this.normalizeText(sprint.fullPath);

    return (
      itemPath === sprintId ||
      itemPath === sprintFullPath ||
      itemPath.includes(sprintId) ||
      itemPath.includes(sprintName) ||
      itemSprint === sprintName
    );
  },

  detectSprintFromWorkItems(workItems) {
    const sprintCounts = {};

    workItems.forEach(item => {
      if (!item.iterationPath) return;
      sprintCounts[item.iterationPath] = (sprintCounts[item.iterationPath] || 0) + 1;
    });

    const mostCommonSprint = Object.entries(sprintCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const fullPath = mostCommonSprint ? mostCommonSprint[0] : "";

    return {
      id: fullPath || "all",
      name: this.sprintShortName(fullPath),
      fullPath,
      startDate: null,
      endDate: null,
      isCurrent: true,
    };
  },

  async getWorkItemsBatch(ids) {
    const data = await this.requestLocal("/api/devops/workitems");
    const allItems = (data.workItems || []).map(item =>
      this.normalizeWorkItem(item)
    );

    if (!ids || !ids.length) return allItems;

    const idSet = new Set(ids.map(Number));
    return allItems.filter(item => idSet.has(Number(item.id)));
  },

  async getHelpdeskData() {
    const data = await this.requestLocal("/api/devops/workitems");

    if (data.helpdesk && data.helpdesk.length) {
      return data.helpdesk.map(item => this.normalizeHelpdeskItem(item));
    }

    return (data.workItems || [])
      .map(item => this.normalizeWorkItem(item))
      .filter(item => item.isHelpdesk)
      .map(item => this.normalizeHelpdeskItem(item));
  },
};

const DevOpsAPI = DataSource;
