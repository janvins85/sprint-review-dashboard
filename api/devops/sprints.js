export default async function handler(req, res) {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const apiVersion = process.env.AZURE_DEVOPS_API_VERSION || "7.1";

  const team = process.env.AZURE_DEVOPS_TEAM || "PowerApps 2026";

  if (!pat || !org || !project) {
    return res.status(500).json({
      error: "Chybí konfigurace Azure DevOps ve Vercel Environment Variables."
    });
  }

  const auth = Buffer.from(":" + pat).toString("base64");

  try {
    const url =
      `https://dev.azure.com/${org}/${project}/${encodeURIComponent(team)}` +
      `/_apis/work/teamsettings/iterations?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Nepodařilo se načíst sprinty z Azure DevOps.",
        detail: text,
        team
      });
    }

    const data = await response.json();

    const sprints = (data.value || []).map(item => ({
      id: item.path,
      name: item.name,
      fullPath: item.path,
      startDate: item.attributes?.startDate || null,
      endDate: item.attributes?.finishDate || null,
      isCurrent: item.attributes?.timeFrame === "current",
      timeFrame: item.attributes?.timeFrame || null,
    }));

    return res.status(200).json({
      team,
      count: sprints.length,
      sprints,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Neočekávaná chyba při načítání sprintů.",
      detail: error.message,
    });
  }
}
