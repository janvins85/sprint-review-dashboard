export default async function handler(req, res) {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";

  const helpdeskAreaKeywords = ["helpdesk", "pa projekty", "editorial"];
  const debugTicketIds = [1984];

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
              AND [System.WorkItemType] <> ''
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

    const idsFromWiql = (wiqlData.workItems || []).map(item => item.id);
    const ids = Array.from(new Set([...debugTicketIds, ...idsFromWiql]));

    if (ids.length === 0) {
      return res.status(200).json({
        count: 0,
        workItems: [],
        helpdesk: [],
        planningItems: []
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
            fields
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

      const parentId = f["System.Parent"] ? Number(f["System.Parent"]) : null;

      const areaPath = f["System.AreaPath"] || "";
      const areaPathLower = areaPath.toLowerCase();

      const tags = f["System.Tags"] || "";
      const tagsLower = tags.toLowerCase();

      const title = f["System.Title"] || "";
      const titleLower = title.toLowerCase();

      const type = f["System.WorkItemType"] || "";

      const isHelpdesk =
        helpdeskAreaKeywords.some(keyword => areaPathLower.includes(keyword)) ||
        tagsLower.includes("helpdesk") ||
        tagsLower.includes("powerapps") ||
        tagsLower.includes("power apps") ||
        titleLower.includes("helpdesk") ||
        titleLower.includes("hd") ||
        titleLower.includes("b2c") ||
        titleLower.includes("navi");

      const assignedTo =
        f["System.AssignedTo"]?.displayName ||
        f["System.AssignedTo"]?.uniqueName ||
        "Nepřiřazeno";

      const closedDate = f["Microsoft.VSTS.Common.ClosedDate"] || null;
      const createdDate = f["System.CreatedDate"] || null;

      return {
        id: item.id,
        url: item.url,

        parentId,
        isHelpdesk,

        title,
        state: f["System.State"] || "",
        type,

        assignedTo,
        assignee: assignedTo,

        priority: f["Microsoft.VSTS.Common.Priority"] || null,
        tags,

        createdDate,
        changedDate: f["System.ChangedDate"] || null,

        devOpsClosedDate: closedDate,
        closedDate,

        helpdeskResolvedDate: isHelpdesk ? closedDate : null,
        resolvedDate: isHelpdesk ? closedDate : null,

        iterationPath: f["System.IterationPath"] || "",
        areaPath,

        originalEstimate: f["Microsoft.VSTS.Scheduling.OriginalEstimate"] || 0,
        completedWork: f["Microsoft.VSTS.Scheduling.CompletedWork"] || 0,
        remainingWork: f["Microsoft.VSTS.Scheduling.RemainingWork"] || 0,

        estimatedHours: f["Microsoft.VSTS.Scheduling.OriginalEstimate"] ?? null,
        completedHours: f["Microsoft.VSTS.Scheduling.CompletedWork"] || 0,
        remainingHours: f["Microsoft.VSTS.Scheduling.RemainingWork"] || 0,

        owner: assignedTo,
        devopsId: item.id
      };
    });

    const helpdesk = workItems
      .filter(item => item.isHelpdesk)
      .map(item => ({
        devopsId: item.id,
        id: item.id,
        title: item.title,
        priority: item.priority,
        status: item.state,
        owner: item.assignee,
        createdDate: item.createdDate,
        resolvedDate: item.resolvedDate,
        closedDate: item.closedDate,
        iterationPath: item.iterationPath,
        areaPath: item.areaPath,
        tags: item.tags
      }));

    const planningItems = workItems.filter(item => !item.isHelpdesk);

    return res.status(200).json({
      count: workItems.length,
      debug: {
        loadedIds: ids.length,
        containsTicket1984: workItems.some(item => item.id === 1984),
        ticket1984: workItems.find(item => item.id === 1984) || null
      },
      workItems,
      helpdesk,
      planningItems
    });

  } catch (error) {
    return res.status(500).json({
      error: "Neočekávaná chyba při načítání Azure DevOps dat.",
      detail: error.message
    });
  }
}
