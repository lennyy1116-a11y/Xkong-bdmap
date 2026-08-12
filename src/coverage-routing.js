(()=>{
const COVERAGE_MODES=Object.freeze({
  straight_1:Object.freeze({id:'straight_1',label:'直线1km',limitKm:1,prefilterKm:1,travelMode:'STRAIGHT'}),
  walking_1:Object.freeze({id:'walking_1',label:'步行1km',limitKm:1,prefilterKm:1.8,travelMode:'WALKING'}),
  walking_4:Object.freeze({id:'walking_4',label:'步行4km',limitKm:4,prefilterKm:6,travelMode:'WALKING'})
});
function getCoverageMode(id){return COVERAGE_MODES[id]||COVERAGE_MODES.straight_1}
function haversineKm(lat1,lng1,lat2,lng2){const R=6371,dLat=(Number(lat2)-Number(lat1))*Math.PI/180,dLng=(Number(lng2)-Number(lng1))*Math.PI/180,a=Math.sin(dLat/2)**2+Math.cos(Number(lat1)*Math.PI/180)*Math.cos(Number(lat2)*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function prefilterCoverageCandidates(center,rows,modeId){const mode=getCoverageMode(modeId);return(rows||[]).filter(row=>Number.isFinite(Number(row.lat))&&Number.isFinite(Number(row.lng))&&haversineKm(center.lat,center.lng,row.lat,row.lng)<=mode.prefilterKm)}
function walkingCacheKey(origin,destination){return`walking|${Number(origin.lat).toFixed(5)},${Number(origin.lng).toFixed(5)}|${Number(destination.lat).toFixed(5)},${Number(destination.lng).toFixed(5)}`}
async function sha256Hex(value){const bytes=new TextEncoder().encode(String(value||'')),digest=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
function walkingSharedCacheDocId(cacheKey){return sha256Hex(cacheKey)}
function walkingUsageDocId(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
function canReserveWalkingElements(used,requested,limit){const current=Math.max(0,Number(used)||0),next=Math.max(0,Number(requested)||0),cap=Math.max(0,Number(limit)||0);return next>0&&cap>0&&current+next<=cap}
function applyWalkingMatrixResults(candidates,matrixResults,modeId){const mode=getCoverageMode(modeId),included=[],excluded=[],pending=[];(candidates||[]).forEach((candidate,index)=>{const result=(matrixResults||[])[index]||{};if(result.status!=='OK'||!Number.isFinite(Number(result.distanceMeters))){pending.push({...candidate,walkingStatus:result.status||'ERROR'});return}const row={...candidate,_walkingDistanceKm:Number(result.distanceMeters)/1000,_walkingDurationMin:Number.isFinite(Number(result.durationSeconds))?Math.round(Number(result.durationSeconds)/60):null,walkingStatus:'OK'};(row._walkingDistanceKm<=mode.limitKm?included:excluded).push(row)});included.sort((a,b)=>a._walkingDistanceKm-b._walkingDistanceKm);return{included,excluded,pending}}
window.BDMapCoverageRouting={COVERAGE_MODES,getCoverageMode,haversineKm,prefilterCoverageCandidates,walkingCacheKey,sha256Hex,walkingSharedCacheDocId,walkingUsageDocId,canReserveWalkingElements,applyWalkingMatrixResults};
})();
