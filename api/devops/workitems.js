export default async function handler(req, res) {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";

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
    const ids = (wiqlData.workItems || []).map(item => item.id).slice(0, 200);

    if (ids.length === 0) {
      return res.status(200).json({
        count: 0,
        workItems: []
      });
    }

    const detailsResponse = await fetch(
      `https://dev.azure.com/${org}/${project}/_apis/wit/workitemsbatch?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids,
          fields: [
            "System.Id",
            "System.Title",
            "System.State",
            "System.AssignedTo",
            "System.WorkItemType",
            "System.CreatedDate",
            "System.ChangedDate",
            "Microsoft.VSTS.Common.ClosedDate",
            "System.IterationPath",
            "System.AreaPath",
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            "Microsoft.VSTS.Scheduling.CompletedWork",
            "Microsoft.VSTS.Scheduling.RemainingWork"
          ]
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

    const workItems = (detailsData.value || []).map(item => {
      const f = item.fields || {};

      return {
        id: item.id,
        url: item.url,

        title: f["System.Title"] || "",
        state: f["System.State"] || "",
        type: f["System.WorkItemType"] || "",

        assignedTo:
          f["System.AssignedTo"]?.displayName ||
          f["System.AssignedTo"]?.uniqueName ||
          "Nepřiřazeno",

        createdDate: f["System.CreatedDate"] || null,
        changedDate: f["System.ChangedDate"] || null,

        // Datum uzavření DevOps ticketu
        devOpsClosedDate: f["Microsoft.VSTS.Common.ClosedDate"] || null,

        // Datum vyřešení / uzavření z Helpdesku se doplní později z PowerApps podle DevOps ID
        helpdeskResolvedDate: null,

        iterationPath: f["System.IterationPath"] || "",
        areaPath: f["System.AreaPath"] || "",

        originalEstimate: f["Microsoft.VSTS.Scheduling.OriginalEstimate"] || 0,
        completedWork: f["Microsoft.VSTS.Scheduling.CompletedWork"] || 0,
        remainingWork: f["Microsoft.VSTS.Scheduling.RemainingWork"] || 0
      };
    });

    return res.status(200).json({
      count: workItems.length,
      workItems
    });

  } catch (error) {
    return res.status(500).json({
      error: "Neočekávaná chyba při načítání Azure DevOps dat.",
      detail: error.message
    });
  }
}
