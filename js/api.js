import{CONFIG}from'./config.js';
export async function saveRemote(payload){if(CONFIG.apiUrl.startsWith('PASTE_'))return{ok:false,pending:true};const response=await fetch(CONFIG.apiUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'saveCalculation',...payload})});if(!response.ok)throw new Error('API tidak tersedia');return response.json()}
