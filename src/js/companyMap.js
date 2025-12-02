// Company map initializer
// Behavior:
// - Reads API key from <meta name="nc-maps-api-key" content="..."> in the page <head>.
// - If a key is present, loads Google Maps JS API and creates an interactive map centered on a fictitious company location with a marker and infowindow.
// - If no key is present, falls back to an iframe embed using the company address so a map is visible without an API key.

(function(){
  const COMPANY = {
    name: 'NovaCiencia academy (Centro Comercial La Boyera)',
    address: 'Centro Comercial La Boyera, Caracas, Venezuela',
    // Coordinates taken from the provided Google Maps link
    lat: 10.4270096,
    lng: -66.8377343
  };

  function getApiKeyFromMeta(){
    try{
      const m = document.querySelector('meta[name="nc-maps-api-key"]');
      return m ? (m.getAttribute('content') || '').trim() : '';
    }catch(e){ return ''; }
  }

  function renderIframe(address){
    const container = document.getElementById('company-map');
    if (!container) return;
    // Use the place search URL for a cleaner embed when possible
    const q = encodeURIComponent(address + ' Caracas Venezuela');
    const src = `https://www.google.com/maps?q=${q}&output=embed`;
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.loading = 'lazy';
    container.innerHTML = '';
    container.appendChild(iframe);
    // Add a small link under the iframe to open the full Google Maps place
    const link = document.createElement('div');
    link.style.marginTop = '6px';
    link.style.fontSize = '13px';
    link.innerHTML = `<a href="https://www.google.com/maps/place/Centro+Comercial+La+Boyera/@10.4267748,-66.8380556,17.25z" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>`;
    container.appendChild(link);
  }

  function loadScript(src, callback){
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => callback && callback();
    s.onerror = () => callback && callback(new Error('Failed to load script'));
    document.head.appendChild(s);
  }

  function initMapsApi(key){
    if (!key) return renderIframe(COMPANY.address);
    // create a callback name unique to this init
    window.__nc_init_map = function(){
      try{
        const container = document.getElementById('company-map');
        if (!container) return;
        const center = { lat: COMPANY.lat, lng: COMPANY.lng };
        const map = new google.maps.Map(container, {
          center,
          zoom: 15,
          disableDefaultUI: false,
        });
        const marker = new google.maps.Marker({ position: center, map, title: COMPANY.name });
        const mapsHref = 'https://www.google.com/maps/place/Centro+Comercial+La+Boyera/@10.4267748,-66.8380556,17.25z';
        const info = new google.maps.InfoWindow({ content: `<div style="font-weight:700">${COMPANY.name}</div><div style="font-size:13px">${COMPANY.address}</div><div style="margin-top:6px"><a href="${mapsHref}" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a></div>` });
        marker.addListener('click', ()=> info.open(map, marker));
        // add action button to search/mark NovaCiencia academy in the iframe fallback
        const action = document.createElement('div');
        action.style.marginTop = '6px';
        action.style.fontSize = '13px';
        action.innerHTML = `<button id="nc-mark-nova" style="padding:6px 10px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;cursor:pointer">Marcar NovaCiencia academy</button>`;
        container.appendChild(action);
        const btn = container.querySelector('#nc-mark-nova');
        if (btn) btn.addEventListener('click', ()=>{
          try{
            const q = encodeURIComponent('NovaCiencia academy Caracas');
            const src2 = `https://www.google.com/maps?q=${q}&output=embed`;
            // replace iframe if present
            const ifr = container.querySelector('iframe');
            if (ifr) { ifr.src = src2; }
          }catch(e){ console.warn('mark nova iframe failed', e); }
        });
              // add a small control/button to mark "NovaCiencia academy" on the map
              try{
                const controlDiv = document.createElement('div');
                controlDiv.style.margin = '8px';
                const btn = document.createElement('button');
                btn.textContent = 'Marcar NovaCiencia academy';
                btn.style.background = '#fff'; btn.style.border = '1px solid rgba(0,0,0,0.1)'; btn.style.padding = '6px 10px'; btn.style.borderRadius = '6px'; btn.style.cursor = 'pointer';
                controlDiv.appendChild(btn);
                map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
                const geocoder = new google.maps.Geocoder();
                let novaMarker = null; let novaInfo = null;
                btn.addEventListener('click', ()=>{
                  try{
                    const query = 'NovaCiencia academy, Caracas, Venezuela';
                    geocoder.geocode({ address: query }, (results, status) => {
                      if (status === 'OK' && results && results[0]){
                        const loc = results[0].geometry.location;
                        map.panTo(loc);
                        map.setZoom(16);
                        if (novaMarker) novaMarker.setMap(null);
                        novaMarker = new google.maps.Marker({ position: loc, map, title: 'NovaCiencia academy' });
                        if (novaInfo) novaInfo.close();
                        novaInfo = new google.maps.InfoWindow({ content: `<div style="font-weight:700">NovaCiencia academy</div><div style="font-size:13px">${results[0].formatted_address}</div><div style="margin-top:6px"><a href=\"https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(results[0].formatted_address)}\" target=\"_blank\">Ver en Google Maps</a></div>` });
                        novaInfo.open(map, novaMarker);
                      } else {
                        console.warn('Geocode failed for NovaCiencia academy', status);
                        alert('No se pudo localizar "NovaCiencia academy" con la geocodificación.');
                      }
                    });
                  }catch(e){ console.warn('mark nova failed', e); }
                });
              }catch(e){ console.warn('nova control setup failed', e); }
      }catch(e){
        console.warn('initMapsApi error', e);
        renderIframe(COMPANY.address);
      }
    };
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__nc_init_map`;
    loadScript(src, (err)=>{ if (err){ console.warn('Could not load Google Maps API, falling back to iframe', err); renderIframe(COMPANY.address); } });
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();

  function main(){
    const key = getApiKeyFromMeta();
    if (key) initMapsApi(key);
    else renderIframe(COMPANY.address);
  }
})();
