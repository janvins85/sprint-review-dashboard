/** * DataSource wrapper pro Sprint Review Dashboard * Frontend volá pouze vlastní Vercel endpointy /api/... */
const DataSource = {
  async requestLocal(path, options = {}) {
    const resp = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) throw new Error(data?.error || data?.detail || "Chyba při načítání dat z interního API.");
    return data;
  },

  sprintShortName(iterationPath) {
    if (!iterationPath) return "Bez sprintu";
    return String(iterationPath).split("\\").pop() || "Bez sprintu";
  },

  sprintQuarter(iterationPath) {
    const parts = String(iterationPath || "").split("\\").filter(Boolean);
    return parts.find(p => /^26Q\d$/i.test(p)) || "";
  },

  stripHtml(value = "") {
    return String(value)
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim();
  },

  normalizeText(value = "") {
    return this.stripHtml(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  cleanPersonName(value = "") {
    return String(value).replace(/\s+/g, " ").replace(/^[\s:–—-]+/, "").replace(/[\s.;,]+$/, "").trim().slice(0, 120);
  },

  // Pass through HD_ fields as-is from API response (already parsed server-side)
  normalizeWorkItem(item) {
    const id = Number(item.id || item.devopsId);
    const parentId = item.parentId !== undefined && item.parentId !== null ? Number(item.parentId) : null;
    const areaPath = item.areaPath || "";
    const isHelpdesk = item.isHelpdesk === true || parentId === 1513 || String(areaPath).toLowerCase().includes("helpdesk");
    const assignee = item.assignee || item.assignedTo || item.owner || "Nepřiřazeno";

    // HD_ fields - passed through from server-side parsing
    const hdRequester = item.hdRequester || null;
    const hdCategory = item.hdCategory || null;
    const hdType = item.hdType || null;
    const hdUrgency = item.hdUrgency || null;
    const hdStatus = item.hdStatus || null;

    // Requester: prefer hdRequester (from HD_REQUESTER field), then fallback
    const requester = hdRequester
      || item.requester || item.requestedBy || item.author || item.parsedRequester
      || "Neznámý zadavatel";

    const closedDate = item.closedDate || item.devOpsClosedDate || item.resolvedDate || null;
    const iterationPath = item.iterationPath || "";

    return {
      id, devopsId: id,
      url: item.url || "",
      parentId, isHelpdesk,
      title: item.title || "",
      state: item.state || item.status || "",
      type: item.type || "",
      assignee, assignedTo: assignee, owner: item.owner || assignee,
      requester, requestedBy: requester, author: requester,
      parsedRequester: item.parsedRequester || hdRequester,
      createdBy: item.createdBy || item.createdByName || null,
      createdByName: item.createdByName || item.createdBy || null,
      createdDate: item.createdDate || null,
      changedDate: item.changedDate || null,
      closedDate, devOpsClosedDate: item.devOpsClosedDate || closedDate,
      resolvedDate: closedDate,
      iterationPath,
      sprintName: this.sprintShortName(iterationPath),
      sprintQuarter: this.sprintQuarter(iterationPath),
      areaPath,
      priority: item.priority || null,
      tags: item.tags || "",
      description: item.description || "",
      reproSteps: item.reproSteps || "",
      estimatedHours: item.estimatedHours ?? item.originalEstimate ?? null,
      completedHours: item.completedHours ?? item.completedWork ?? 0,
      remainingHours: item.remainingHours ?? item.remainingWork ?? 0,
      originalEstimate: item.originalEstimate ?? item.estimatedHours ?? null,
      completedWork: item.completedWork ?? item.completedHours ?? 0,
      remainingWork: item.remainingWork ?? item.remainingHours ?? 0,
      // HD-specific fields (from server-side parsing of reproSteps)
      hdId: item.hdId || null,
      hdRequester,
      hdOwner: item.hdOwner || null,
      hdCategory,
      hdType,
      hdUrgency,
      hdStatus,
      hdCreated: item.hdCreated || null,
      hdResolved: item.hdResolved || null,
    };
  },

  normalizeHelpdeskItem(item) {
    const x = this.normalizeWorkItem(item);
    return {
      ...x,
      status: x.state,
      owner: x.assignee,
      requester: x.requester,
      requestedBy: x.requester,
      author: x.requester,
      resolvedDate: x.closedDate,
    };
  },

  sortWorkItems(items) {
    return [...items].sort((a, b) => {
      const w = { Active: 1, New: 2, Resolved: 3, Closed: 4 };
      const aw = w[a.state] || 9, bw = w[b.state] || 9;
      if (aw !== bw) return aw - bw;
      const ad = new Date(a.closedDate || a.changedDate || a.createdDate || 0).getTime();
      const bd = new Date(b.closedDate || b.changedDate || b.createdDate || 0).getTime();
      return bd - ad;
    });
  },

  async getSprints() {
    const sprintData = await this.requestLocal("/api/devops/sprints");
    const workData = await this.requestLocal("/api/devops/workitems");
    const allWorkItems = (workData.workItems || []).map(item => this.normalizeWorkItem(item)).filter(item => item.id);
    const sprintsRaw = sprintData.sprints || [];
    const realSprints = sprintsRaw.filter(s => /\b\d{1,2}\s*-\s*sprint\b/i.test(this.normalizeText(s.name)));
    const sprintList = realSprints.map(sprint => ({
      id: sprint.fullPath || sprint.id,
      name: sprint.name, displayName: sprint.name,
      fullPath: sprint.fullPath || sprint.id,
      startDate: sprint.startDate, endDate: sprint.endDate,
      isCurrent: sprint.isCurrent === true || sprint.timeFrame === "current",
      timeFrame: sprint.timeFrame || null,
      count: allWorkItems.filter(item => item.iterationPath === (sprint.fullPath || sprint.id)).length,
      sortDate: new Date(sprint.startDate || 0).getTime(),
    }));
    sprintList.sort((a, b) => a.sortDate - b.sortDate);
    const currentSprint = sprintList.find(s => s.isCurrent);
    const allOption = { id: "all", name: "Všechny PowerApps tickety", displayName: "Všechny PowerApps tickety", fullPath: "", startDate: null, endDate: null, isCurrent: !currentSprint, timeFrame: null, count: allWorkItems.length, sortDate: Number.MAX_SAFE_INTEGER };
    return currentSprint ? [currentSprint, allOption, ...sprintList.filter(s => s.id !== currentSprint.id)] : [allOption, ...sprintList];
  },

  async getSprintData(sprintId = null) {
    const data = await this.requestLocal("/api/devops/workitems");
    const allWorkItems = (data.workItems || []).map(item => this.normalizeWorkItem(item)).filter(item => item.id);
    const sprints = await this.getSprints();
    const currentSprint = sprints.find(s => sprintId && (s.id === sprintId || s.fullPath === sprintId))
      || sprints.find(s => s.isCurrent) || sprints[0]
      || { id: "all", name: "Všechny PowerApps tickety", fullPath: "", isCurrent: true };
    const selectedWorkItems = currentSprint.id === "all" ? allWorkItems
      : allWorkItems.filter(item => item.iterationPath === currentSprint.fullPath || item.iterationPath === currentSprint.id);
    const sortedSelected = this.sortWorkItems(selectedWorkItems);
    const helpdesk = this.sortWorkItems(sortedSelected.filter(item => item.isHelpdesk).map(item => this.normalizeHelpdeskItem(item)));
    const planningItems = this.sortWorkItems(sortedSelected.filter(item => !item.isHelpdesk));
    return {
      sprint: currentSprint, workItems: sortedSelected, helpdesk, planningItems,
      debug: { ...(data.debug || {}), allCount: allWorkItems.length, selectedCount: sortedSelected.length, helpdeskCount: helpdesk.length, planningCount: planningItems.length, currentSprint: currentSprint.name },
    };
  },

  async getHelpdeskData() {
    const data = await this.requestLocal("/api/devops/workitems");
    return this.sortWorkItems((data.workItems || []).map(item => this.normalizeWorkItem(item)).filter(item => item.isHelpdesk).map(item => this.normalizeHelpdeskItem(item)));
  },
};

const DevOpsAPI = DataSource;
