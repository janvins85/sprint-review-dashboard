/**
 * Mock Data - Sprint Review Dashboard
 * Oddelena od logiky. Pro produkcni data nahradte api.js.
 * Tento soubor simuluje data Azure DevOps + Power Apps Helpdesk.
 */

// ─── Mock Sprint Data ────────────────────────────────────────────────────────
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

// ─── Mock Work Items (Azure DevOps) ──────────────────────────────────────────
const MOCK_WORK_ITEMS = [
  {id:1976, type:"Bug",      title:"Nelze exportovat PDF faktury",                   state:"New",      assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-20"},
  {id:1974, type:"Bug",      title:"Power BI - chybna data v reportu prodeje",       state:"Active",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-19"},
  {id:1979, type:"UserStory",title:"Duplikace KV - % Licence nezduplikovano",        state:"New",      assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-21"},
  {id:1969, type:"Bug",      title:"Chyba pri nacitani dokladoveho ceniku",          state:"Active",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-18"},
  {id:1968, type:"Bug",      title:"Nefunkcni prihlaseni pres SSO",                  state:"Resolved", assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-15"},
  {id:1967, type:"Task",     title:"Aktualizace dokumentace API",                    state:"Active",   assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1966, type:"Bug",      title:"Chybne zobrazeni grafu na mobilnich zarizeních", state:"Resolved", assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-14"},
  {id:1933, type:"Bug",      title:"Pomalay import Excel souboru",                   state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-10"},
  {id:1928, type:"Bug",      title:"Nefunkcni POWER BI - zkusebni lhuta",           state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-08"},
  {id:1927, type:"Bug",      title:"Chyba v tisku objednavky - logo chybi",          state:"Closed",   assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-09"},
  {id:1925, type:"Task",     title:"Migrace dat z legacy systemu",                   state:"Active",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-20"},
  {id:1920, type:"Bug",      title:"Neodpovida REST API pri velkem requestu",        state:"Active",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-17"},
  {id:1916, type:"Task",     title:"Integrace Salesforce - faze 2",                  state:"New",      assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1912, type:"Bug",      title:"Duplicitni zaznamy v DB po importu",             state:"Resolved", assignee:"Kocsis Richard", priority:2, createdDate:"2026-04-16"},
  {id:1911, type:"Bug",      title:"Chybny vypocet DPH u dobropisů",                 state:"Closed",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-04-12"},
  {id:1907, type:"Task",     title:"Performance test - load balancer",               state:"Active",   assignee:"Svitak Martin",  priority:3, createdDate:"2026-04-20"},
  {id:1905, type:"Bug",      title:"Prihlaseni timeout po 15 minutach",              state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-11"},
  {id:1904, type:"UserStory",title:"Nova komponenta pro vyhledavani zakazniku",      state:"New",      assignee:"Vins Jan",       priority:3, createdDate:"2026-04-20"},
  {id:1903, type:"Bug",      title:"Chyba exportu do XLS - prazdny soubor",          state:"Resolved", assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-13"},
  {id:1896, type:"Task",     title:"Optimalizace SQL dotazu - reports",               state:"Closed",   assignee:"Kocsis Richard", priority:3, createdDate:"2026-04-07"},
  {id:1887, type:"Bug",      title:"Nekorektni razeni v tabulce objednavek",         state:"Closed",   assignee:"Novak Pavel",    priority:3, createdDate:"2026-04-06"},
  {id:1886, type:"Task",     title:"Nasazeni verze 4.2.1 na produkci",               state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-04-08"},
  {id:1880, type:"Bug",      title:"Chyba generovani PDF - znaky UTF-8",             state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-05"},
  {id:1874, type:"Task",     title:"Upgrade Node.js na verzi 20 LTS",                state:"Closed",   assignee:"Kocsis Richard", priority:3, createdDate:"2026-04-03"},
  {id:1868, type:"Bug",      title:"Neodpovida webhook po 100 pozadavcich",          state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-04-02"},
  {id:1864, type:"Task",     title:"Zaverecna dokumentace sprintu",                  state:"Active",   assignee:"Vins Jan",       priority:4, createdDate:"2026-04-20"},
  {id:1840, type:"Bug",      title:"Layout prasknuty na iOS 17",                     state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-03-28"},
  {id:1839, type:"Bug",      title:"Neodeslani e-mailu pri zmene stavu",             state:"Closed",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-03-27"},
  {id:1835, type:"Task",     title:"Testovani integrace platebni brany",             state:"Closed",   assignee:"Kocsis Richard", priority:2, createdDate:"2026-03-25"},
  {id:1832, type:"Bug",      title:"Chyba v kalkulaci marze pro export",             state:"Closed",   assignee:"Novak Pavel",    priority:1, createdDate:"2026-03-24"},
  {id:1831, type:"Bug",      title:"Race condition pri soubehem importu",            state:"Closed",   assignee:"Svitak Martin",  priority:2, createdDate:"2026-03-23"},
  {id:1804, type:"Bug",      title:"Nefunkcni pristup do BI pres Teamsy",            state:"Closed",   assignee:"Vins Jan",       priority:2, createdDate:"2026-03-20"},
  {id:1803, type:"Task",     title:"Sprint planning - priprava backlogu",            state:"Closed",   assignee:"Vins Jan",       priority:4, createdDate:"2026-03-19"},
  {id:1795, type:"Bug",      title:"Chyba pri tisku faktury - format A4",            state:"Active",   assignee:"Novak Pavel",    priority:2, createdDate:"2026-03-18"},
];

// ─── Mock Helpdesk Data (Power Apps) ─────────────────────────────────────────
const MOCK_HELPDESK = [
  {devopsId:1976, title:"Nelze exportovat PDF faktury",         priority:2, status:"Prirazeno", owner:"Martin Svitak",  createdDate:"2026-04-20", resolvedDate:null},
  {devopsId:1974, title:"Power BI - chybna data",               priority:1, status:"Probihá",   owner:"Pavel Novak",    createdDate:"2026-04-19", resolvedDate:null},
  {devopsId:1969, title:"Chyba pri nacitani ceniku",            priority:2, status:"Probihá",   owner:"Richard Kocsis", createdDate:"2026-04-18", resolvedDate:null},
  {devopsId:1968, title:"Nefunkcni SSO",                        priority:1, status:"Vyreseno",  owner:"Pavel Novak",    createdDate:"2026-04-15", resolvedDate:"2026-04-22"},
  {devopsId:1966, title:"Graf na mobilu - chybne zobrazeni",    priority:3, status:"Vyreseno",  owner:"Pavel Novak",    createdDate:"2026-04-14", resolvedDate:"2026-04-23"},
  {devopsId:1933, title:"Pomalay Excel import",                 priority:2, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-10", resolvedDate:"2026-04-18"},
  {devopsId:1928, title:"POWER BI - zkusebni lhuta vyprsela",  priority:2, status:"Uzavreno",  owner:"Martin Svitak",  createdDate:"2026-04-08", resolvedDate:"2026-04-23"},
  {devopsId:1927, title:"Tisk objednavky - chybi logo",         priority:3, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-09", resolvedDate:"2026-04-20"},
  {devopsId:1920, title:"REST API timeout",                     priority:1, status:"Probihá",   owner:"Pavel Novak",    createdDate:"2026-04-17", resolvedDate:null},
  {devopsId:1912, title:"Duplicitni zaznamy po importu",        priority:2, status:"Vyreseno",  owner:"Richard Kocsis", createdDate:"2026-04-16", resolvedDate:"2026-04-24"},
  {devopsId:1911, title:"Chybny vypocet DPH",                  priority:1, status:"Uzavreno",  owner:"Pavel Novak",    createdDate:"2026-04-12", resolvedDate:"2026-04-15"},
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

// ─── DataSource - abstrakce nad daty ─────────────────────────────────────────
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
    };
  },
};
