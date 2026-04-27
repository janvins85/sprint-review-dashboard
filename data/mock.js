/**
 * Mock Data - Sprint Review Dashboard
 * Oddelena od logiky. Pro produkcni data nahradte api.js.
 * Tento soubor simuluje data Azure DevOps + Power Apps Helpdesk.
 */

// ─── Mock Sprint Data ──────────────────────────────────────────────────────────
const MOCK_SPRINT = {
  id: "26Q2_01",
  name: "26Q2 - Sprint 01 (20.4. - 3.5.2026)",
  startDate: "2026-04-20T00:00:00Z",
  endDate: "2026-05-03T23:59:59Z",
  isCurrent: true,
};

const MOCK_SPRINTS = [
  { id: "26Q1_04", name: "26Q1 - Sprint 04 (23.3. - 19.4.2026)", isCurrent: false },
  { id: "26Q2_01", name: "26Q2 - Sprint 01 (20.4. - 3.5.2026)", isCurrent: true },
];

// ─── Mock Work Items (Azure DevOps) ────────────────────────────────────────────
const MOCK_WORK_ITEMS = [
  {id:1976, type:"Bug",       title:"Nelze exportovat PDF faktury",                 state:"New",      assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-20"},
  {id:1974, type:"Bug",       title:"Power BI - chybna data v reportu prodeje",     state:"Active",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-19"},
  {id:1979, type:"UserStory", title:"Duplikace KV - % Licence nezduplikovano",      state:"New",      assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-21"},
  {id:1969, type:"Bug",       title:"Chyba pri nacitani dokladoveho ceniku",        state:"Active",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-18"},
  {id:1968, type:"Bug",       title:"Nefunkcni prihlaseni pres SSO",                state:"Resolved", assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-15"},
  {id:1967, type:"Task",      title:"Aktualizace dokumentace API",                  state:"Active",   assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1966, type:"Bug",       title:"Chybne zobrazeni grafu na mobilnich zarizeních",state:"Resolved",assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-14"},
  {id:1933, type:"Bug",       title:"Pomalay import Excel souboru",                 state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-10"},
  {id:1928, type:"Bug",       title:"Nefunkcni POWER BI - zkusebni lhuta",         state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-08"},
  {id:1927, type:"Bug",       title:"Chyba v tisku objednavky - logo chybi",       state:"Closed",   assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-09"},
  {id:1925, type:"Task",      title:"Migrace dat z legacy systemu",                 state:"Active",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-20"},
  {id:1920, type:"Bug",       title:"Neodpovida REST API pri velkem requestu",      state:"Active",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-17"},
  {id:1916, type:"Task",      title:"Integrace Salesforce - faze 2",               state:"New",      assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1912, type:"Bug",       title:"Duplicitni zaznamy v DB po importu",          state:"Resolved", assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-16"},
  {id:1911, type:"Bug",       title:"Chybny vypocet DPH u dobropisů",             state:"Closed",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-12"},
  {id:1907, type:"Task",      title:"Performance test - load balancer",            state:"Active",   assignee:"Svitak Martin",  priority:3, createdDate:"2026-04-20"},
  {id:1905, type:"Bug",       title:"Prihlaseni timeout po 15 minutach",           state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-11"},
  {id:1904, type:"UserStory", title:"Nova komponenta pro vyhledavani zakazniku",   state:"New",      assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1903, type:"Bug",       title:"Chyba exportu do XLS - prazdny soubor",       state:"Resolved", assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-13"},
  {id:1896, type:"Task",      title:"Optimalizace SQL dotazu - reports",           state:"Closed",   assignee:"Kocsis Richard", priority:3, createdDate:"2026-04-07"},
  {id:1887, type:"Bug",       title:"Nekorektni razeni v tabulce objednavek",      state:"Closed",   assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-06"},
  {id:1886, type:"Task",      title:"Nasazeni verze 4.2.1 na produkci",           state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-08"},
  {id:1880, type:"Bug",       title:"Chyba generovani PDF - znaky UTF-8",         state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-05"},
  {id:1874, type:"Task",      title:"Upgrade Node.js na verzi 20 LTS",            state:"Closed",   assignee:"Kocsis Richard", priority:3, createdDate:"2026-04-03"},
  {id:1868, type:"Bug",       title:"Neodpovida webhook po 100 pozadavcich",      state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-02"},
  {id:1864, type:"Task",      title:"Zaverecna dokumentace sprintu",              state:"Active",   assignee:"Vins Jan",       priority:4, createdDate:"2026-04-20"},
  {id:1840, type:"Bug",       title:"Layout prasknuty na iOS 17",                 state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-03-28"},
  {id:1839, type:"Bug",       title:"Neodeslani e-mailu pri zmene stavu",         state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-03-27"},
  {id:1835, type:"Task",      title:"Testovani integrace platebni brany",         state:"Closed",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-03-25"},
  {id:1832, type:"Bug",       title:"Chyba v kalkulaci marze pro export",         state:"Closed",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-03-24"},
  {id:1831, type:"Bug",       title:"Race condition pri soubehem importu",        state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-03-23"},
  {id:1804, type:"Bug",       title:"Nefunkcni pristup do BI pres Teamsy",        state:"Closed",   assignee:"Vins Jan",       priority:2, createdDate:"2026-03-20"},
  {id:1803, type:"Task",      title:"Sprint planning - priprava backlogu",        state:"Closed",   assignee:"Vins Jan",       priority:4, createdDate:"2026-03-19"},
  {id:1795, type:"Bug",       title:"Chyba pri tisku faktury - format A4",        state:"Active",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-03-18"},
];

// ─── Mock Helpdesk Data (Power Apps) ───────────────────────────────────────────
const MOCK_HELPDESK = [
  {devopsId:1976, title:"Nelze exportovat PDF faktury",          priority:2, status:"Prirazeno", owner:"Martin Svitak",  createdDate:"2026-04-20", resolvedDate:null},
  {devopsId:1974, title:"Power BI - chybna data",               priority:1, status:"Probihá",   owner:"Pavel Novak",    createdDate:"2026-04-19", resolvedDate:null},
  {devopsId:1969, title:"Chyba pri nacitani ceniku",            priority:2, status:"Probihá",   owner:"Richard Kocsis", createdDate:"2026-04-18", resolvedDate:null},
  {devopsId:1968, title:"Nefunkcni SSO",                        priority:1, status:"Vyreseno",  owner:"Pavel Novak",    createdDate:"2026-04-15", resolvedDate:"2026-04-22"},
  {devopsId:1966, title:"Graf na mobilu - chybne zobrazeni",    priority:3, status:"Vyreseno",  owner:"Pavel Novak",    createdDate:"2026-04-14", resolvedDate:"2026-04-23"},
  {devopsId:1933, title:"Pomalay Excel import",                 priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-10", resolvedDate:"2026-04-18"},
  {devopsId:1928, title:"POWER BI - zkusebni lhuta vyprsela",   priority:2, status:"Uzavreno",  owner:"Martin Svitak",  createdDate:"2026-04-08", resolvedDate:"2026-04-23"},
  {devopsId:1927, title:"Tisk objednavky - chybi logo",         priority:3, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-09", resolvedDate:"2026-04-20"},
  {devopsId:1920, title:"REST API timeout",                     priority:1, status:"Probihá",   owner:"Pavel Novak",    createdDate:"2026-04-17", resolvedDate:null},
  {devopsId:1912, title:"Duplicitni zaznamy po importu",        priority:2, status:"Vyreseno",  owner:"Richard Kocsis", createdDate:"2026-04-16", resolvedDate:"2026-04-24"},
  {devopsId:1911, title:"Chybny vypocet DPH",                   priority:1, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-12", resolvedDate:"2026-04-15"},
  {devopsId:1905, title:"Prihlaseni timeout",                   priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-11", resolvedDate:"2026-04-16"},
  {devopsId:1903, title:"Export XLS prazdny",                   priority:2, status:"Vyreseno",  owner:"Pavel Novak",    createdDate:"2026-04-13", resolvedDate:"2026-04-22"},
  {devopsId:1896, title:"SQL optimalizace reportu",             priority:3, status:"Uzavreno",  owner:"Richard Kocsis", createdDate:"2026-04-07", resolvedDate:"2026-04-14"},
  {devopsId:1887, title:"Razeni v tabulce objednavek",          priority:3, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-06", resolvedDate:"2026-04-12"},
  {devopsId:1880, title:"PDF generovani UTF-8",                 priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-05", resolvedDate:"2026-04-10"},
  {devopsId:1868, title:"Webhook timeout",                      priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-02", resolvedDate:"2026-04-09"},
  {devopsId:1840, title:"iOS 17 layout",                        priority:2, status:"Uzavreno",  owner:"Martin Svitak",  createdDate:"2026-03-28", resolvedDate:"2026-04-05"},
  {devopsId:1839, title:"E-mail notifikace",                    priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-03-27", resolvedDate:"2026-04-03"},
  {devopsId:1835, title:"Platebni brana - testovani",           priority:2, status:"Uzavreno",  owner:"Richard Kocsis", createdDate:"2026-03-25", resolvedDate:"2026-04-01"},
  {devopsId:1832, title:"Kalkulace marze - export",             priority:1, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-03-24", resolvedDate:"2026-03-28"},
  {devopsId:1831, title:"Race condition import",                priority:2, status:"Uzavreno",  owner:"Martin Svitak",  createdDate:"2026-03-23", resolvedDate:"2026-03-30"},
  {devopsId:1804, title:"BI pristup pres Teams",                priority:2, status:"Uzavreno",  owner:"Jan Vins",       createdDate:"2026-03-20", resolvedDate:"2026-04-23"},
  {devopsId:1803, title:"Sprint planning",                      priority:4, status:"Uzavreno",  owner:"Jan Vins",       createdDate:"2026-03-19", resolvedDate:"2026-03-22"},
  {devopsId:1795, title:"Tisk faktury format A4",               priority:2, status:"Probihá",   owner:"Pavel Novak",    createdDate:"2026-03-18", resolvedDate:null},
];

// ─── Mock Planning/Manual DevOps Tickets ───────────────────────────────────────
// Tickety zalozene primo v DevOps bez vazby na Helpdesk Power Apps
// Planovaci, analyticke, technicke a rozvojove polozky
const MOCK_PLANNING_ITEMS = [
  {
    id: 1980, type: "Task", title: "Sprint planning 26Q2 - priprava backlogu a kapacit",
    state: "Closed", assignee: "Vins Jan",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Management",
    createdDate: "2026-04-19", closedDate: "2026-04-20",
    estimatedHours: 4, completedHours: 3.5, remainingHours: 0,
  },
  {
    id: 1978, type: "Task", title: "Architektura nove vyhledavaci komponenty - navrh",
    state: "Closed", assignee: "Kocsis Richard",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Architektura",
    createdDate: "2026-04-20", closedDate: "2026-04-24",
    estimatedHours: 8, completedHours: 10, remainingHours: 0,
  },
  {
    id: 1975, type: "UserStory", title: "Redesign modulu objednavek - faze 1 analyza",
    state: "Active", assignee: "Svitak Martin",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\UX",
    createdDate: "2026-04-20", closedDate: null,
    estimatedHours: 16, completedHours: 8, remainingHours: 6,
  },
  {
    id: 1973, type: "Task", title: "Technicka analyza migrace na .NET 8",
    state: "Closed", assignee: "Novak Pavel",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Infrastruktura",
    createdDate: "2026-04-20", closedDate: "2026-04-26",
    estimatedHours: 12, completedHours: 14, remainingHours: 0,
  },
  {
    id: 1971, type: "Task", title: "CI/CD pipeline - optimalizace build casu",
    state: "Active", assignee: "Kocsis Richard",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\DevOps",
    createdDate: "2026-04-21", closedDate: null,
    estimatedHours: 6, completedHours: 4, remainingHours: 3,
  },
  {
    id: 1965, type: "Task", title: "Code review - PR #342 integrace platebni brany",
    state: "Closed", assignee: "Vins Jan",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Vyvoj",
    createdDate: "2026-04-21", closedDate: "2026-04-22",
    estimatedHours: 2, completedHours: 2.5, remainingHours: 0,
  },
  {
    id: 1963, type: "Task", title: "Bezpecnostni audit - OWASP checklist",
    state: "Active", assignee: "Novak Pavel",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Bezpecnost",
    createdDate: "2026-04-22", closedDate: null,
    estimatedHours: 8, completedHours: 3, remainingHours: 5,
  },
  {
    id: 1960, type: "UserStory", title: "Implementace dark mode pro Power BI embedding",
    state: "New", assignee: "Svitak Martin",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\BI",
    createdDate: "2026-04-22", closedDate: null,
    estimatedHours: null, completedHours: 0, remainingHours: null,
  },
  {
    id: 1958, type: "Task", title: "Aktualizace NuGet balicku - security patches",
    state: "Closed", assignee: "Kocsis Richard",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Infrastruktura",
    createdDate: "2026-04-22", closedDate: "2026-04-24",
    estimatedHours: 3, completedHours: 2, remainingHours: 0,
  },
  {
    id: 1955, type: "Task", title: "Dokumentace API v3 - OpenAPI spec aktualizace",
    state: "Active", assignee: "Vins Jan",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Dokumentace",
    createdDate: "2026-04-23", closedDate: null,
    estimatedHours: 6, completedHours: 2, remainingHours: 4,
  },
  {
    id: 1952, type: "Task", title: "Nastaveni monitoring alertu - produkce",
    state: "Closed", assignee: "Novak Pavel",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Infrastruktura",
    createdDate: "2026-04-23", closedDate: "2026-04-27",
    estimatedHours: 4, completedHours: 5, remainingHours: 0,
  },
  {
    id: 1948, type: "UserStory", title: "Refaktoring modulu fakturace - tech debt",
    state: "New", assignee: "Svitak Martin",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Vyvoj",
    createdDate: "2026-04-24", closedDate: null,
    estimatedHours: null, completedHours: 0, remainingHours: null,
  },
  {
    id: 1945, type: "Task", title: "Sprint review prezentace - priprava podkladu",
    state: "Active", assignee: "Vins Jan",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Management",
    createdDate: "2026-04-24", closedDate: null,
    estimatedHours: 3, completedHours: 1, remainingHours: 2,
  },
  {
    id: 1942, type: "Task", title: "Load testing - simulace 500 soubeznach uzivatelu",
    state: "Closed", assignee: "Kocsis Richard",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\QA",
    createdDate: "2026-04-24", closedDate: "2026-04-28",
    estimatedHours: 8, completedHours: 7, remainingHours: 0,
  },
  {
    id: 1938, type: "UserStory", title: "POC: integrace MS Copilot do backoffice",
    state: "Active", assignee: "Novak Pavel",
    iterationPath: "CentralniSystem\26Q2\01", areaPath: "CentralniSystem\Inovace",
    createdDate: "2026-04-25", closedDate: null,
    estimatedHours: 16, completedHours: 6, remainingHours: 10,
  },
];

// ─── DataSource - abstrakce nad daty ───────────────────────────────────────────
// Pokud je CONFIG.devops.pat vyplneno, pouzije se API.
// Jinak se pouziji MOCK data.
const DataSource = {
  async getSprints() {
    if (CONFIG.devops.pat) {
      return await DevOpsAPI.getSprints();
    }
    return MOCK_SPRINTS;
  },

  async getSprintData(sprintId) {
    if (CONFIG.devops.pat) {
      return await DevOpsAPI.getSprintData(sprintId);
    }
    // Return mock data
    return {
      sprint: MOCK_SPRINT,
      workItems: MOCK_WORK_ITEMS,
      helpdesk: MOCK_HELPDESK,
      planningItems: MOCK_PLANNING_ITEMS,
    };
  },
};
