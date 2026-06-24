import {
  PWA_GIT_SHA_STORAGE_KEY,
  hasPwaAutoReloadAttempted,
  markPwaAutoReloadAttempted,
  markPwaGitShaStored,
  purgePwaServiceWorkersAndCaches,
} from "@/core/pwa/pwaBundleUpdate";

/** PWA installée ou WebView Capacitor — cibles du reload bundle. */
export function isPwaBootRecoveryHost(userAgent: string, win: Window): boolean {
  const standalone =
    win.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (win.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return true;

  const cap = (win as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;

  // Chrome Android avant install — évite les ChunkLoadError après deploy.
  if (/Android/i.test(userAgent) && /Chrome\//i.test(userAgent) && !/wv\)/i.test(userAgent)) {
    return true;
  }

  return false;
}

export function isRecoverableClientBootError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("cannot read properties of undefined (reading 'call')")
  );
}

/** Script synchrone avant React — purge SW si nouveau SHA (évite global-error PWA). */
export function buildPwaBootRecoveryInlineScript(deployedSha: string): string {
  const safeSha = deployedSha.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `(function(){
  try {
    var deployedSha='${safeSha}';
    if(!deployedSha)return;
    var host=(function(){
      try{
        if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return true;
        if(window.navigator.standalone)return true;
        if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())return true;
        var ua=navigator.userAgent||'';
        if(/Android/i.test(ua)&&/Chrome\\//i.test(ua)&&!/wv\\)/i.test(ua))return true;
      }catch(e){}
      return false;
    })();
    if(!host)return;
    var storageKey='${PWA_GIT_SHA_STORAGE_KEY}';
    var stored=null;
    try{stored=localStorage.getItem(storageKey);}catch(e){}
    if(stored===deployedSha)return;
    var reloadKey=storageKey+':reload:'+deployedSha;
    try{
      if(sessionStorage.getItem(reloadKey)==='1'){
        try{localStorage.setItem(storageKey,deployedSha);}catch(e){}
        return;
      }
      sessionStorage.setItem(reloadKey,'1');
    }catch(e){}
    var done=function(){try{location.reload();}catch(e){}};
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){
        return Promise.all(regs.map(function(r){return r.unregister();}));
      }).then(function(){
        if('caches' in window){
          return caches.keys().then(function(keys){
            return Promise.all(keys.map(function(k){return caches.delete(k);}));
          });
        }
      }).catch(function(){}).finally(done);
      return;
    }
    done();
  }catch(e){}
})();`;
}

/** Recovery React — chunk error ou SHA mismatch après hydratation. */
export async function runPwaBootRecovery(deployedSha: string | null): Promise<boolean> {
  if (typeof window === "undefined" || !deployedSha) return false;
  if (!isPwaBootRecoveryHost(navigator.userAgent, window)) return false;

  const storedSha = (() => {
    try {
      return localStorage.getItem(PWA_GIT_SHA_STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  if (storedSha === deployedSha) return false;

  if (hasPwaAutoReloadAttempted(deployedSha)) {
    markPwaGitShaStored(deployedSha);
    return false;
  }

  markPwaAutoReloadAttempted(deployedSha);
  try {
    await purgePwaServiceWorkersAndCaches();
  } catch {
    /* best-effort */
  }
  markPwaGitShaStored(deployedSha);
  window.location.reload();
  return true;
}
