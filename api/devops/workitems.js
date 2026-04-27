import { requireAuth } from '../_auth.js';
export default async function handler(req, res) {
    if (!requireAuth(req, res)) return;
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

  function stripHtml(value = "") {
    return String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();
  }

  function normalizeText(value = "") {
    return stripHtml(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function cleanPersonName(value = "") {
    return String(value)
      .replace(/\s+/g, " ")
      .replace(/^[\s:–—-]+/, "")
      .replace(/[\s.;,]+$/, "")
      .trim()
      .slice(0, 120);
  }

  function extractRequesterFromReproSteps(reproStepsRaw = "") {
    const clean = stripHtml(reproStepsRaw);

    const match = clean.match(/vytvořil\s*[:\-]\s*([^\n\r;]+)/i)
      || clean.match(/vytvoril\s*[:\-]\s*([^\n\r;]+)/i);

    if (!match || !match[1]) {
      return null;
    }

    return cleanPersonName(match[1]);
  }

  function detectHelpdesk({ parentId, areaPath }) {
    const area = normalizeText(areaPath || "");
    return parentId === helpDeskParentId || area.includes("helpdesk");
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
    const ids = Array.from(new Set((wiqlData.workItems || []).map(item => item.id)));

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
      "System.CreatedBy",
      "System.WorkItemType",
      "System.CreatedDate",
      "System.ChangedDate",
      "System.Description",
      "Microsoft.VSTS.TCM.ReproSteps",
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

      const assignedTo =
        f["System.AssignedTo"]?.displayName ||
        f["System.AssignedTo"]?.uniqueName ||
        "Nepřiřazeno";

      const createdBy =
        f["System.CreatedBy"]?.displayName ||
        f["System.CreatedBy"]?.uniqueName ||
        "Neznámý autor";

      const descriptionRaw = f["System.Description"] || "";
      const reproStepsRaw = f["Microsoft.VSTS.TCM.ReproSteps"] || "";

      const description = stripHtml(descriptionRaw);
      const reproSteps = stripHtml(reproStepsRaw);

      const parsedRequester = extractRequesterFromReproSteps(reproStepsRaw);
      const requester = parsedRequester || "Neznámý zadavatel";

      const title = f["System.Title"] || "";
      const areaPath = f["System.AreaPath"] || "";
      const tags = f["System.Tags"] || "";

      const isHelpdesk = detectHelpdesk({ parentId, areaPath });

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

        title,
        state: f["System.State"] || "",
        type: f["System.WorkItemType"] || "",

        assignedTo,
        assignee: assignedTo,
        owner: assignedTo,

        createdBy,
        createdByName: createdBy,

        requester,
        requestedBy: requester,
        author: requester,
        parsedRequester,

        priority: f["Microsoft.VSTS.Common.Priority"] || null,
        tags,

        description,
        reproSteps,

        createdDate,
        changedDate: f["System.ChangedDate"] || null,
        closedDate,
        devOpsClosedDate: closedDate,

        resolvedDate: isHelpdesk ? closedDate : null,
        helpdeskResolvedDate: isHelpdesk ? closedDate : null,

        iterationPath: f["System.IterationPath"] || "",
        areaPath,

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
        requester: item.requester,
        requestedBy: item.requester,
        author: item.requester,
        resolvedDate: item.closedDate,
      }));

    const planningItems = workItems.filter(item => !item.isHelpdesk);

    return res.status(200).json({
      count: workItems.length,
      helpDeskParentId,
      debug: {
        loadedIds: ids.length,
        containsTicket1986: workItems.some(item => item.id === 1986),
        containsTicket1987: workItems.some(item => item.id === 1987),
        ticket1986: workItems.find(item => item.id === 1986) || null,
        ticket1987: workItems.find(item => item.id === 1987) || null,
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
