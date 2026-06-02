import { requireAuth } from '../_auth.js';

export default async function handler(req, res) {
      if (!requireAuth(req, res)) return;

  const pat = process.env.AZURE_DEVOPS_PAT;
      const org = process.env.AZURE_DEVOPS_ORG;
      const project = process.env.AZURE_DEVOPS_PROJECT;
      const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";
      const helpDeskParentId = Number(process.env.AZURE_DEVOPS_HELPDESK_PARENT_ID || 1513);
          const team = process.env.AZURE_DEVOPS_TEAM || "PowerApps 2026";

  if (!pat || !org || !project) {
          return res.status(500).json({ error: "Chybí konfigurace Azure DevOps ve Vercel Environment Variables." });
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
            .replace(/^[\s:\u2013\u2014-]+/, "")
            .replace(/[\s.;,]+$/, "")
            .trim()
            .slice(0, 120);
  }

  // Parse HD fields from reproSteps text
  // Format: HD_REQUESTER: Name, HD_CATEGORY: Cat, HD_TYPE: Type, HD_URGENCY: Low, HD_STATUS: Assigned, HD_ID: guid
  function parseHdField(text, fieldName) {
          if (!text) return null;
          const clean = stripHtml(text);
          const regex = new RegExp(fieldName + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i");
          const match = clean.match(regex);
          if (!match || !match[1]) return null;
          const val = match[1].trim();
          return val || null;
  }

  function parseAllHdFields(reproStepsRaw = "") {
          const clean = stripHtml(reproStepsRaw);
          return {
                    hdId: parseHdField(clean, "HD_ID"),
                    hdRequester: cleanPersonName(parseHdField(clean, "HD_REQUESTER") || ""),
                    hdOwner: cleanPersonName(parseHdField(clean, "HD_OWNER") || ""),
                    hdCategory: parseHdField(clean, "HD_CATEGORY"),
                    hdType: parseHdField(clean, "HD_TYPE"),
                    hdUrgency: parseHdField(clean, "HD_URGENCY"),
                    hdStatus: parseHdField(clean, "HD_STATUS"),
                    hdCreated: parseHdField(clean, "HD_CREATED"),
                    hdResolved: parseHdField(clean, "HD_RESOLVED"),
          };
  }

  function normalizeHdCategory(raw) {
          if (!raw) return null;
          const r = raw.trim();
          // Normalize known category names to short form
        if (/redak/i.test(r)) return "Int.aplik.\u2013Redakce";
          if (/\bhr\b/i.test(r) || /human.resource/i.test(r) || /personali/i.test(r)) return "Int.aplik.\u2013HR";
          if (/\bkv\b/i.test(r) || /kalkulac/i.test(r)) return "Int.aplik.\u2013KV";
          if (/ostatn/i.test(r) && /aplik/i.test(r)) return "Int.aplik.\u2013Ostatn\u00ed";
          if (/chyba.*(dat|v daten)/i.test(r) || /data.*error/i.test(r)) return "Chyba v datech";
          if (/software/i.test(r)) return "Software";
          if (/p\u0159\u00edstupy|p\u0159\u00edstup|access/i.test(r)) return "P\u0159\u00edstupy";
          if (/navision|navi\b/i.test(r)) return "Navision";
          if (/hardware/i.test(r)) return "Hardware";
          if (/ostatn/i.test(r)) return "Ostatn\u00ed";
          return r;
  }

  function normalizeHdType(raw) {
          if (!raw) return null;
          const r = raw.trim().toLowerCase();
          if (r.includes("new request") || r.includes("nov\u00fd po\u017eadavek")) return "Nov\u00fd po\u017eadavek";
          if (r.includes("issue") || r.includes("chyba") || r.includes("bug")) return "Chyba/Issue";
          if (r.includes("query") || r.includes("dotaz")) return "Dotaz";
          if (r.includes("other") || r.includes("ostatn")) return "Ostatn\u00ed";
          // Pass through capitalised
        return raw.trim();
  }

  function normalizeHdUrgency(raw) {
          if (!raw) return null;
          const r = raw.trim().toLowerCase();
          if (r === "critical" || r === "kriticka" || r === "kritick\u00e1") return "Kritick\u00e1";
          if (r === "high" || r === "vysoka" || r === "vysok\u00e1") return "Vysok\u00e1";
          if (r === "normal" || r === "normalni" || r === "norm\u00e1ln\u00ed" || r === "medium") return "Norm\u00e1ln\u00ed";
          if (r === "low" || r === "nizka" || r === "n\u00edzk\u00e1") return "N\u00edzk\u00e1";
          return raw.trim();
  }

  function normalizeHdStatus(raw) {
          if (!raw) return null;
          const r = raw.trim().toLowerCase();
          if (r === "assigned" || r === "p\u0159i\u0159azeno" || r === "prirazeno") return "P\u0159i\u0159azeno";
          if (r === "in progress" || r === "prob\u00edh\u00e1" || r === "probíhá") return "Prob\u00edh\u00e1";
          if (r === "resolved" || r === "vy\u0159e\u0161eno") return "Vy\u0159e\u0161eno";
          if (r === "closed" || r === "uzav\u0159eno") return "Uzav\u0159eno";
          if (r === "cancelled" || r === "zru\u0161eno") return "Zru\u0161eno";
          return raw.trim();
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
                                                                                          AND [System.IterationPath] UNDER '${project}\\${team}'
                                                                                        ORDER BY [System.ChangedDate] DESC
                                                                                                  `
                          }),
              }
                  );

        if (!wiqlResponse.ok) {
                  const text = await wiqlResponse.text();
                  return res.status(wiqlResponse.status).json({ error: "Nep\u0159i\u0161lo se na\u010d\u00edst seznam work item\u016f z Azure DevOps.", detail: text });
        }

        const wiqlData = await wiqlResponse.json();
          const ids = Array.from(new Set((wiqlData.workItems || []).map(item => item.id)));

        if (!ids.length) {
                  return res.status(200).json({ count: 0, workItems: [], helpdesk: [], planningItems: [] });
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
                                      body: JSON.stringify({ ids: batchIds, fields, errorPolicy: "Omit" }),
                        }
                              );

            if (!detailsResponse.ok) {
                        const text = await detailsResponse.text();
                        return res.status(detailsResponse.status).json({ error: "Nep\u0159i\u0161lo se na\u010d\u00edst detailn\u00ed data work item\u016f z Azure DevOps.", detail: text });
            }

            const detailsData = await detailsResponse.json();
                    allDetails.push(...(detailsData.value || []));
          }

        const workItems = allDetails.map(item => {
                  const f = item.fields || {};
                  const parentId = f["System.Parent"] !== undefined && f["System.Parent"] !== null
                    ? Number(f["System.Parent"])
                              : null;

                                               const assignedTo = f["System.AssignedTo"]?.displayName || f["System.AssignedTo"]?.uniqueName || "Nep\u0159i\u0159azeno";
                  const createdBy = f["System.CreatedBy"]?.displayName || f["System.CreatedBy"]?.uniqueName || "Nezn\u00e1m\u00fd autor";

                                               const reproStepsRaw = f["Microsoft.VSTS.TCM.ReproSteps"] || "";
                  const descriptionRaw = f["System.Description"] || "";
                  const description = stripHtml(descriptionRaw);
                  const reproSteps = stripHtml(reproStepsRaw);

                                               // Parse all HD_ fields from reproSteps
                                               const hd = parseAllHdFields(reproStepsRaw);

                                               // Requester: prefer HD_REQUESTER, fallback to vytvořil pattern, then "Neznámý zadavatel"
                                               let requester = null;
                  if (hd.hdRequester && hd.hdRequester.length > 1) {
                              requester = hd.hdRequester;
                  } else {
                              // Fallback: try to find "vytvořil: Name" pattern
                    const cleanRepr = stripHtml(reproStepsRaw);
                              const m = cleanRepr.match(/vytvo\u0159il\s*[:\-]\s*([^\n\r;]+)/i)
                                || cleanRepr.match(/vytvoril\s*[:\-]\s*([^\n\r;]+)/i);
                              if (m && m[1]) requester = cleanPersonName(m[1]);
                  }
                  if (!requester) requester = "Nezn\u00e1m\u00fd zadavatel";

                                               const areaPath = f["System.AreaPath"] || "";
                  const tags = f["System.Tags"] || "";
                  const isHelpdesk = detectHelpdesk({ parentId, areaPath });

                                               const closedDate = f["Microsoft.VSTS.Common.ClosedDate"] || null;
                  const createdDate = f["System.CreatedDate"] || null;
                  const originalEstimate = f["Microsoft.VSTS.Scheduling.OriginalEstimate"];
                  const completedWork = f["Microsoft.VSTS.Scheduling.CompletedWork"];
                  const remainingWork = f["Microsoft.VSTS.Scheduling.RemainingWork"];

                                               // Normalize HD-specific fields
                                               const hdCategory = normalizeHdCategory(hd.hdCategory);
                  const hdType = normalizeHdType(hd.hdType);
                  const hdUrgency = normalizeHdUrgency(hd.hdUrgency);
                  const hdStatus = normalizeHdStatus(hd.hdStatus);

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
                                                           createdBy,
                                                           createdByName: createdBy,
                                                           requester,
                                                           requestedBy: requester,
                                                           author: requester,
                                                           parsedRequester: hd.hdRequester || null,
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
                                                           // HD-specific parsed fields
                                                           hdId: hd.hdId,
                                                           hdRequester: hd.hdRequester || null,
                                                           hdOwner: hd.hdOwner || null,
                                                           hdCategory,
                                                           hdType,
                                                           hdUrgency,
                                                           hdStatus,
                                                           hdCreated: hd.hdCreated || null,
                                                           hdResolved: hd.hdResolved || null,
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
                              helpdeskCount: helpdesk.length,
                              planningCount: planningItems.length,
                              hdFieldCoverage: helpdesk.length
                                ? Math.round(helpdesk.filter(x => x.hdCategory).length / helpdesk.length * 100) + "%"
                                            : "0%",
                  },
                  workItems,
                  helpdesk,
                  planningItems,
        });

  } catch (error) {
          return res.status(500).json({ error: "Neo\u010dek\u00e1van\u00e1 chyba p\u0159i na\u010d\u00edt\u00e1n\u00ed Azure DevOps dat.", detail: error.message });
  }
}
