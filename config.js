/**
 * Sprint Review Dashboard - Configuration
 * Upravte tento soubor pro konfiguraci sprintu, API a tymu.
 */

const CONFIG = {
  // Sprint - null = auto-detect aktualni sprint z Azure DevOps
  sprintName: null,
  sprintAutoDetect: true,

  // Azure DevOps
  devops: {
    organization: "GradaBookport",
    project: "CentralniSystem",
    helpDeskParentId: 1513,
    pat: "",
    apiVersion: "7.1",
  },

  // Power Apps Helpdesk
  helpdesk: {
    orgUrl: "https://grada.crm4.dynamics.com",
    viewId: "23c4775e-171d-f111-8341-000d3a2a79f2",
    entityName: "gra_request",
    token: "",
  },

  // Clenove tymu
  teamMembers: [
    { id: "richard.kocsis", devopsName: "Kocsis Richard", name: "Richard Kocsis", color: "#3B82F6", initials: "RK" },
    { id: "pavel.novak",    devopsName: "Novak Pavel",    name: "Pavel Novak",    color: "#10B981", initials: "PN" },
    { id: "martin.svitak",  devopsName: "Svitak Martin",  name: "Martin Svitak",  color: "#F59E0B", initials: "MS" },
    { id: "jan.vins",       devopsName: "Vins Jan",       name: "Jan Vins",       color: "#EF4444", initials: "JV" },
  ],

  // SLA (dny)
  sla: { critical: 1, high: 3, normal: 7, low: 14 },

  // UI
  ui: {
    title: "Sprint Review Dashboard",
    subtitle: "Azure DevOps x Power Apps Helpdesk",
    refreshIntervalMinutes: 30,
  },

  // Priority
  priorities: {
    1: { label: "Kriticka", color: "#EF4444", sla: 1 },
    2: { label: "Vysoka",   color: "#F59E0B", sla: 3 },
    3: { label: "Normalni", color: "#3B82F6", sla: 7 },
    4: { label: "Nizka",    color: "#6B7280", sla: 14 },
  },

  // Stav Helpdesk
  statusMap: {
    "Prirazeno":  { label: "Prirazeno",  group: "todo",       color: "#6B7280" },
    "Probihá":    { label: "Probíhá",    group: "inprogress", color: "#3B82F6" },
    "Vyreseno":   { label: "Vyreseno",   group: "done",       color: "#10B981" },
    "Uzavreno":   { label: "Uzavreno",   group: "done",       color: "#059669" },
    "Zruseno":    { label: "Zruseno",    group: "cancelled",  color: "#EF4444" },
  },
};
