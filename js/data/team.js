/* Mock team activity feed and per-analyst stats. */
const TEAM_FEED = [
  {time:'23:52',text:'<b>Sulaiman</b> closed SOC-00421'},
  {time:'23:49',text:'<b>Ahmed</b> escalated SOC-00437'},
  {time:'23:45',text:'<b>Mohammed</b> took ownership of SOC-00445'},
  {time:'23:42',text:'<b>Sulaiman</b> added a note to SOC-00451'},
  {time:'23:38',text:'<b>Ahmed</b> reassigned SOC-00449 to himself'},
  {time:'23:31',text:'<b>Mohammed</b> escalated SOC-00448 to Team Leader'}
];

const TEAM_STATS = {
  sulaiman:{assigned:7,investigating:3,closedToday:12,escalated:2,avgResponse:'3m 41s'},
  ahmed:{assigned:5,investigating:2,closedToday:9,escalated:1,avgResponse:'4m 18s'},
  mohammed:{assigned:4,investigating:1,closedToday:11,escalated:3,avgResponse:'3m 55s'},
};
