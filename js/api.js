/**
 * Azure DevOps API Wrapper
 * Bezpečná varianta: frontend NEVOLÁ Azure DevOps přímo.
 * Frontend volá pouze vlastní Vercel endpointy /api/...
 */

const DevOpsAPI = {
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

  async getSprints() {
    try {
      const data = await this.requestLocal("/api/devops/sprints");
      return data.sprints || data.value || [];
    } catch (error) {
      console.warn("Sprints endpoint zatím není dostupný:", error.message);
      return [];
    }
  },

  async getSprintData(sprintId = null) {
    const data = await this.requestLocal("/api/devops/workitems");

    const workItems = data.workItems || [];

    const sprints = await this.getSprints();
    const sprint =
      sprints.find(s => s.id === sprintId || s.isCurrent) ||
      this.detectSprintFromWorkItems(workItems);

    return {
      sprint,
      workItems,
      helpdesk: [],
    };
  },

  detectSprintFromWorkItems(workItems) {
    const currentItem =
      workItems.find(w => w.iterationPath && w.iterationPath.includes("Sprint")) ||
      workItems[0];

    return {
      id: "auto-detected",
      name: currentItem?.iterationPath || "Aktuální sprint",
      startDate: null,
      endDate: null,
      isCurrent: true,
    };
  },

  async getWorkItemsBatch(ids) {
    const data = await this.requestLocal("/api/devops/workitems");
    const allItems = data.workItems || [];

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
