/* Mock analysts referenced by the mock alert data.
   CURRENT_USER is set from the database profile after sign-in (js/auth.js). */
const ANALYSTS = {
  omar:{id:'omar',name:'Omar Haddad',initials:'OH',role:'Senior SOC Analyst'},
  rami:{id:'rami',name:'Rami Nasser',initials:'RN',role:'SOC Analyst'},
  yusuf:{id:'yusuf',name:'Yusuf Karimi',initials:'YK',role:'SOC Analyst'},
  unassigned:{id:'unassigned',name:'Unassigned',initials:'--',role:''}
};
let CURRENT_USER = null;
