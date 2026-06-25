/** Script inline beforeInteractive — même logique que installIosPowerSaveMimic, sans bundle React. */
export function buildIosPowerSaveMimicInlineScript(): string {
  return `(function(){
  try {
    var k="crmslot:lpm";
    var p=new URLSearchParams(location.search);
    var q=p.get("lpm");
    var fps=null;
    if(q==="1"||q==="true"){localStorage.setItem(k,"1");fps=30;}
    else if(q&&/^\\d{1,2}$/.test(q)){var n=parseInt(q,10);if(n>=10&&n<=60){localStorage.setItem(k,String(n));fps=n;}}
  else{var s=localStorage.getItem(k);if(s==="1")fps=30;else if(s&&/^\\d{1,2}$/.test(s)){var m=parseInt(s,10);if(m>=10&&m<=60)fps=m;}}
    if(!fps)return;
    if(window.__crmslotLpmMimic)return;
    window.__crmslotLpmMimic=true;
    document.documentElement.dataset.lpmMimic=String(fps);
    var minMs=1000/fps;
    var nativeRaf=window.requestAnimationFrame.bind(window);
    var nextId=1,live={},queue=[],pump=false,last=0;
    function drain(ts){pump=false;var b=queue;queue=[];for(var i=0;i<b.length;i++){var e=b[i];if(!live[e.id])continue;delete live[e.id];e.cb(ts);}if(queue.length)schedule();}
    function schedule(){if(pump)return;pump=true;nativeRaf(function(ts){if(last>0&&ts-last<minMs){pump=false;schedule();return;}last=ts;drain(ts);});}
    window.requestAnimationFrame=function(cb){var id=nextId++;live[id]=1;queue.push({id:id,cb:cb});schedule();return id;};
    window.cancelAnimationFrame=function(id){delete live[id];};
  }catch(e){}
})();`;
}
