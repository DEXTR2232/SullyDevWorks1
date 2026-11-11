/* Mock analysts referenced by the mock alert data.
   CURRENT_USER is set from the database profile after sign-in (js/auth.js). */
const ANALYSTS = {
  sulaiman:{id:'sulaiman',name:'Sulaiman Al-Alawi',initials:'SA',role:'Senior SOC Analyst'},
  ahmed:{id:'ahmed',name:'Ahmed Al-Harthy',initials:'AH',role:'SOC Analyst'},
  mohammed:{id:'mohammed',name:'Mohammed Al-Rashdi',initials:'MR',role:'SOC Analyst'},
  unassigned:{id:'unassigned',name:'Unassigned',initials:'--',role:''}
};
let CURRENT_USER = null;
