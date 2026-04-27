/**
 * DataSource wrapper pro Sprint Review Dashboard
 * Frontend volá pouze vlastní Vercel endpointy /api/...
 * Token není nikdy ve frontendu ani v config.js.
 */

const DataSource = {
  async requestLocal(path, options = {}) {
    const resp = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
      },
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

  normalizeWorkItem(item) {
    return {
      id: item.id,
      url: item.url,

      title: item.title || "",
      state: item.state || "",
      type: item.type || "",

      // index.html očekává assignee
      assignee: item.assignee || item.assignedTo || "Nepřiřazeno",

      createdDate: item.createdDate || null,
      changedDate: item.changedDate || null,

      // index.html očekává closedDate
      closedDate: item.closedDate || item.devOpsClosedDate || null,

      iterationPath: item.iterationPath || "",
      areaPath: item.areaPath || "",

      // index.html očekává estimatedHours / completedHours / remainingHours
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

      priority: item.priority || null,
    };
  },

  async getSprints() {
    try {
      const data = await this.requestLocal("/api/devops/sprints");

      const sprints = data.sprints || data.value || [];

      if (!sprints.length) {
        return [
          {
            id: "auto",
            name: "Aktuální sprint",
            startDate: null,
            endDate: null,
            isCurrent: true,
          },
        ];
      }

      return sprints;
    } catch (error) {
      console.warn("Sprints endpoint není dostupný, použije se auto-detekce:", error.message);

      return [
        {
          id: "auto",
          name: "Aktuální sprint",
          startDate: null,
          endDate: null,
          isCurrent: true,
        },
      ];
    }
  },

  async getSprintData(sprintId = null) {
    const data = await this.requestLocal("/api/devops/workitems");

    const allWorkItems = (data.workItems || []).map(item =>
      this.normalizeWorkItem(item)
    );

    const currentSprint = this.detectSprintFromWorkItems(allWorkItems, sprintId);

    const sprintName = currentSprint?.name || currentSprint?.iterationPath || "";

    const sprintWorkItems = sprintName && sprintName !== "Aktuální sprint"
      ? allWorkItems.filter(item => item.iterationPath === sprintName || item.iterationPath.includes(sprintName))
      : allWorkItems;

    // Zatím nemáme PowerApps endpoint, takže Helpdesk necháme prázdný.
    const helpdesk = [];

    // Vše bez Helpdesk vazby bereme jako DevOps-only / plánovací práci.
    const helpdeskIds = new Set(helpdesk.map(h => Number(h.devopsId)));

    const planningItems = sprintWorkItems.filter(item =>
      !helpdeskIds.has(Number(item.id))
    );

    return {
      sprint: currentSprint,
      workItems: sprintWorkItems,
      helpdesk,
      planningItems,
    };
  },

  detectSprintFromWorkItems(workItems, sprintId = null) {
    const sprintCounts = {};

    workItems.forEach(item => {
      if (!item.iterationPath) return;
      sprintCounts[item.iterationPath] = (sprintCounts[item.iterationPath] || 0) + 1;
    });

    const mostCommonSprint = Object.entries(sprintCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const name = mostCommonSprint ? mostCommonSprint[0] : "Aktuální sprint";

    return {
      id: sprintId || "auto-detected",
      name,
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

    if (!ids || !ids.length) {
      return allItems;
    }

    return allItems.filter(item => ids.includes(item.id));
  },

  async getHelpdeskData() {
    try {
      const data = await this.requestLocal("/api/helpdesk/requests");
      return data.helpdesk || data.requests || [];
    } catch (error) {
      console.warn("Helpdesk endpoint zatím není dostupný:", error.message);
      return [];
    }
  },
};

// Kompatibilita, kdyby někde ve starším kódu zůstalo DevOpsAPI
const DevOpsAPI = DataSource;
