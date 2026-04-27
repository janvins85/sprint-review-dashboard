export default async function handler(req, res) {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";

  const helpDeskParentId = Number(process.env.AZURE_DEVOPS_HELPDESK_PARENT_ID || 1513);

  if (!pat || !org || !project) {
    return res.status(500).json({
      error: "Chybí konfigurace Azure DevOps ve Vercel Environment Variables."
    });
  }

  const auth = Buffer.from(":" + pat).toString("base64");
export default async function handler(req, res) {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";

  const helpDeskParentId = Number(process.env.AZURE_DEVOPS_HELPDESK_PARENT_ID || 1513);

  if (!pat || !org || !project) {
    return res.status(500).json({
      error: "Chybí konfigurace Azure DevOps ve Vercel Environment Variables."
    });
  }

  const auth = Buffer.from(":" + pat).toString("base64");

  try {
    const wiqlResponse = await fetch(
      `https://dev.azure.com/${org}/${project}/_apis/wit/wiql?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            SELECT [System.Id]
            FROM WorkItems
            WHERE [System.TeamProject] = '${project}'
            ORDER BY [System.ChangedDate] DESC
          `
        }),
      }
    );

    if (!wiqlResponse.ok) {
      const text = await wiqlResponse.text();
      return res.status(wiqlResponse.status).json({
        error: "Nepodařilo se načíst seznam work itemů z Azure DevOps.",
        detail: text
      });
    }

    const wiqlData = await wiqlResponse.json();
    const ids = Array.from(
      new Set((wiqlData.workItems || []).map(item => item.id))
    );

    if (!ids.length) {
      return res.status(200).json({
        count: 0,
        workItems: [],
        helpdesk: [],
        planningItems: [],
      });
    }

    const fields = [
      "System.Id",
      "System.Parent",
      "System.Title",
      "System.State",
      "System.AssignedTo",
      "System.WorkItemType",
      "System.CreatedDate",
      "System.ChangedDate",
      "Microsoft.VSTS.Common.ClosedDate",
      "Microsoft.VSTS.Common.Priority",
      "System.Tags",
      "System.IterationPath",
      "System.AreaPath",
      "Microsoft.VSTS.Scheduling.OriginalEstimate",
      "Microsoft.VSTS.Scheduling.CompletedWork",
      "Microsoft.VSTS.Scheduling.RemainingWork"
    ];

    const allDetails = [];

    for (let i = 0; i < ids.length; i += 200) {
      const batchIds = ids.slice(i, i + 200);

      const detailsResponse = await fetch(
        `https://dev.azure.com/${org}/${project}/_apis/wit/workitemsbatch?api-version=${apiVersion}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: batchIds,
            fields,
            errorPolicy: "Omit",
          }),
        }
      );

      if (!detailsResponse.ok) {
        const text = await detailsResponse.text();
        return res.status(detailsResponse.status).json({
          error: "Nepodařilo se načíst detailní data work itemů z Azure DevOps.",
          detail: text
        });
      }

      const detailsData = await detailsResponse.json();
      allDetails.push(...(detailsData.value || []));
    }

    const workItems = allDetails.map(item => {
      const f = item.fields || {};

      const parentId =
        f["System.Parent"] !== undefined && f["System.Parent"] !== null
          ? Number(f["System.Parent"])
          : null;

      // Jediné správné pravidlo:
      // Helpdesk ticket = pouze ticket s parentem 1513.
      // Vše ostatní = ručně založený / plánovací DevOps ticket.
      const isHelpdesk = parentId === helpDeskParentId;

      const assignedTo =
        f["System.AssignedTo"]?.displayName ||
        f["System.AssignedTo"]?.uniqueName ||
        "Nepřiřazeno";

      const closedDate = f["Microsoft.VSTS.Common.ClosedDate"] || null;
      const createdDate = f["System.CreatedDate"] || null;
      const originalEstimate = f["Microsoft.VSTS.Scheduling.OriginalEstimate"];
      const completedWork = f["Microsoft.VSTS.Scheduling.CompletedWork"];
      const remainingWork = f["Microsoft.VSTS.Scheduling.RemainingWork"];

      return {
        id: Number(item.id),
        devopsId: Number(item.id),
        url: item.url,

        parentId,
        isHelpdesk,

        title: f["System.Title"] || "",
        state: f["System.State"] || "",
        type: f["System.WorkItemType"] || "",

        assignedTo,
        assignee: assignedTo,
        owner: assignedTo,

        priority: f["Microsoft.VSTS.Common.Priority"] || null,
        tags: f["System.Tags"] || "",

        createdDate,
        changedDate: f["System.ChangedDate"] || null,
        closedDate,
        devOpsClosedDate: closedDate,

        resolvedDate: isHelpdesk ? closedDate : null,
        helpdeskResolvedDate: isHelpdesk ? closedDate : null,

        iterationPath: f["System.IterationPath"] || "",
        areaPath: f["System.AreaPath"] || "",

        originalEstimate: originalEstimate ?? null,
        completedWork: completedWork ?? 0,
        remainingWork: remainingWork ?? 0,

        estimatedHours: originalEstimate ?? null,
        completedHours: completedWork ?? 0,
        remainingHours: remainingWork ?? 0,
      };
    });

    const helpdesk = workItems
      .filter(item => item.isHelpdesk)
      .map(item => ({
        ...item,
        status: item.state,
        owner: item.assignee,
        resolvedDate: item.closedDate,
      }));

    const planningItems = workItems.filter(item => !item.isHelpdesk);

    return res.status(200).json({
      count: workItems.length,
      helpDeskParentId,
      debug: {
        loadedIds: ids.length,
        containsTicket1983: workItems.some(item => item.id === 1983),
        containsTicket1984: workItems.some(item => item.id === 1984),
        ticket1983: workItems.find(item => item.id === 1983) || null,
        ticket1984: workItems.find(item => item.id === 1984) || null,
        helpdeskCount: helpdesk.length,
        planningCount: planningItems.length,
      },
      workItems,
      helpdesk,
      planningItems,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Neočekávaná chyba při načítání Azure DevOps dat.",
      detail: error.message
    });
  }
}
  try {
    const wiqlResponse = await fetch(
      `https://dev.azure.com/${org}/${project}/_apis/wit/wiql?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            SELECT [System.Id]
            FROM WorkItems
            WHERE [System.TeamProject] = '${project}'
            ORDER BY [System.ChangedDate] DESC
          `
        }),
      }
    );

    if (!wiqlResponse.ok) {
      const text = await wiqlResponse.text();
      return res.status(wiqlResponse.status).json({
        error: "Nepodařilo se načíst seznam work itemů z Azure DevOps.",
        detail: text
      });
    }

    const wiqlData = await wiqlResponse.json();
    const ids = Array.from(
      new Set((wiqlData.workItems || []).map(item => item.id))
    );

    if (!ids.length) {
      return res.status(200).json({
        count: 0,
        workItems: [],
        helpdesk: [],
        planningItems: [],
      });
    }

    const fields = [
      "System.Id",
      "System.Parent",
      "System.Title",
      "System.State",
      "System.AssignedTo",
      "System.WorkItemType",
      "System.CreatedDate",
      "System.ChangedDate",
      "Microsoft.VSTS.Common.ClosedDate",
      "Microsoft.VSTS.Common.Priority",
      "System.Tags",
      "System.IterationPath",
      "System.AreaPath",
      "Microsoft.VSTS.Scheduling.OriginalEstimate",
      "Microsoft.VSTS.Scheduling.CompletedWork",
      "Microsoft.VSTS.Scheduling.RemainingWork"
    ];

    const allDetails = [];

    for (let i = 0; i < ids.length; i += 200) {
      const batchIds = ids.slice(i, i + 200);

      const detailsResponse = await fetch(
        `https://dev.azure.com/${org}/${project}/_apis/wit/workitemsbatch?api-version=${apiVersion}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: batchIds,
            fields,
            errorPolicy: "Omit",
          }),
        }
      );

      if (!detailsResponse.ok) {
        const text = await detailsResponse.text();
        return res.status(detailsResponse.status).json({
          error: "Nepodařilo se načíst detailní data work itemů z Azure DevOps.",
          detail: text
        });
      }

      const detailsData = await detailsResponse.json();
      allDetails.push(...(detailsData.value || []));
    }

    const workItems = allDetails.map(item => {
      const f = item.fields || {};

      const parentId =
        f["System.Parent"] !== undefined && f["System.Parent"] !== null
          ? Number(f["System.Parent"])
          : null;

      // Jediné správné pravidlo:
      // Helpdesk ticket = pouze ticket s parentem 1513.
      // Vše ostatní = ručně založený / plánovací DevOps ticket.
      const isHelpdesk = parentId === helpDeskParentId;

      const assignedTo =
        f["System.AssignedTo"]?.displayName ||
        f["System.AssignedTo"]?.uniqueName ||
        "Nepřiřazeno";

      const closedDate = f["Microsoft.VSTS.Common.ClosedDate"] || null;
      const createdDate = f["System.CreatedDate"] || null;
      const originalEstimate = f["Microsoft.VSTS.Scheduling.OriginalEstimate"];
      const completedWork = f["Microsoft.VSTS.Scheduling.CompletedWork"];
      const remainingWork = f["Microsoft.VSTS.Scheduling.RemainingWork"];

      return {
        id: Number(item.id),
        devopsId: Number(item.id),
        url: item.url,

        parentId,
        isHelpdesk,

        title: f["System.Title"] || "",
        state: f["System.State"] || "",
        type: f["System.WorkItemType"] || "",

        assignedTo,
        assignee: assignedTo,
        owner: assignedTo,

        priority: f["Microsoft.VSTS.Common.Priority"] || null,
        tags: f["System.Tags"] || "",

        createdDate,
        changedDate: f["System.ChangedDate"] || null,
        closedDate,
        devOpsClosedDate: closedDate,

        resolvedDate: isHelpdesk ? closedDate : null,
        helpdeskResolvedDate: isHelpdesk ? closedDate : null,

        iterationPath: f["System.IterationPath"] || "",
        areaPath: f["System.AreaPath"] || "",

        originalEstimate: originalEstimate ?? null,
        completedWork: completedWork ?? 0,
        remainingWork: remainingWork ?? 0,

        estimatedHours: originalEstimate ?? null,
        completedHours: completedWork ?? 0,
        remainingHours: remainingWork ?? 0,
      };
    });

    const helpdesk = workItems
      .filter(item => item.isHelpdesk)
      .map(item => ({
        ...item,
        status: item.state,
        owner: item.assignee,
        resolvedDate: item.closedDate,
      }));

    const planningItems = workItems.filter(item => !item.isHelpdesk);

    return res.status(200).json({
      count: workItems.length,
      helpDeskParentId,
      debug: {
        loadedIds: ids.length,
        containsTicket1983: workItems.some(item => item.id === 1983),
        containsTicket1984: workItems.some(item => item.id === 1984),
        ticket1983: workItems.find(item => item.id === 1983) || null,
        ticket1984: workItems.find(item => item.id === 1984) || null,
        helpdeskCount: helpdesk.length,
        planningCount: planningItems.length,
      },
      workItems,
      helpdesk,
      planningItems,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Neočekávaná chyba při načítání Azure DevOps dat.",
      detail: error.message
    });
  }
}
