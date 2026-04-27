/**
 * Azure DevOps API Wrapper
 * Pouzije se automaticky pokud je v config.js vyplneno CONFIG.devops.pat
 * 
 * CORS POZNAMKA: Azure DevOps API nepodporuje CORS z prohlizece primo.
 * Pro produkcni pouziti doporucujeme:
 *   1. Proxy server (Vercel Edge Function - viz /api/devops.js)
 *   2. Backend API
 *   3. Power Automate flow
 */

const DevOpsAPI = {
  baseUrl() {
    return 'https://dev.azure.com/' + CONFIG.devops.organization + '/' + CONFIG.devops.project;
  },

  headers() {
    const token = btoa(':' + CONFIG.devops.pat);
    return {
      'Authorization': 'Basic ' + token,
      'Content-Type': 'application/json',
    };
  },

  async request(path, options = {}) {
    const url = this.baseUrl() + '/_apis/' + path + '?api-version=' + CONFIG.devops.apiVersion;
    const resp = await fetch(url, {
      headers: this.headers(),
      ...options,
    });
    if (!resp.ok) throw new Error('DevOps API error: ' + resp.status + ' ' + await resp.text());
    return resp.json();
  },

  async wiql(query) {
    const url = this.baseUrl() + '/_apis/wit/wiql?api-version=' + CONFIG.devops.apiVersion;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ query }),
    });
    if (!resp.ok) throw new Error('WIQL error: ' + resp.status);
    return resp.json();
  },

  async getSprints() {
    const data = await this.request('work/teamsettings/iterations');
    return (data.value || []).map(s => ({
      id: s.id,
      name: s.name,
      startDate: s.attributes?.startDate,
      endDate: s.attributes?.finishDate,
      isCurrent: s.attributes?.timeFrame === 'current',
    }));
  },

  async getSprintData(sprintId) {
    // Get current sprint
    const sprints = await this.getSprints();
    const sprint = sprints.find(s => s.id === sprintId || s.isCurrent) || sprints[0];

    // Get work items via WIQL
    const iterationPath = sprint.name;
    const wiqlResult = await this.wiql(
      "SELECT [System.Id] FROM WorkItems WHERE [System.Parent] = " + CONFIG.devops.helpDeskParentId +
      " ORDER BY [System.Id]"
    );

    const ids = (wiqlResult.workItems || []).map(w => w.id);
    const workItems = ids.length ? await this.getWorkItemsBatch(ids) : [];

    // Get helpdesk data (Power Apps) - requires token
    const helpdesk = CONFIG.helpdesk.token ? await this.getHelpdeskData() : [];

    return { sprint, workItems, helpdesk };
  },

  async getWorkItemsBatch(ids) {
    // Fetch in batches of 200
    const results = [];
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200);
      const url = this.baseUrl() + '/_apis/wit/workitems?ids=' + batch.join(',') +
        '&fields=System.Id,System.Title,System.State,System.WorkItemType,System.AssignedTo,Microsoft.VSTS.Common.Priority,System.CreatedDate' +
        '&api-version=' + CONFIG.devops.apiVersion;
      const resp = await fetch(url, { headers: this.headers() });
      const data = await resp.json();
      results.push(...(data.value || []).map(wi => ({
        id: wi.id,
        title: wi.fields['System.Title'],
        state: wi.fields['System.State'],
        type: wi.fields['System.WorkItemType'],
        assignee: wi.fields['System.AssignedTo']?.displayName || '',
        priority: wi.fields['Microsoft.VSTS.Common.Priority'],
        createdDate: wi.fields['System.CreatedDate'],
      })));
    }
    return results;
  },

  async getHelpdeskData() {
    // Power Apps / Dynamics 365 REST API
    const url = CONFIG.helpdesk.orgUrl + '/api/data/v9.2/gra_requests?$select=gra_requestid,gra_name,gra_urgency,gra_status,gra_devopsid,gra_owner,createdon,gra_resolvedon&$top=500';
    const resp = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + CONFIG.helpdesk.token,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
      },
    });
    const data = await resp.json();
    return (data.value || []).map(r => ({
      devopsId: r.gra_devopsid ? parseInt(r.gra_devopsid) : null,
      title: r.gra_name,
      priority: r.gra_urgency,
      status: r.gra_status,
      owner: r.gra_owner,
      createdDate: r.createdon,
      resolvedDate: r.gra_resolvedon,
    }));
  },
};
