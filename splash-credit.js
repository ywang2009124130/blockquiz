/* 小积木 · 开场页署名注入 splash-credit.js  ——  独立外置、与主文件解耦
   用法：在 index.html 里加一行  <script src="splash-credit.js"></script>
        （放在 </body> 前，或紧跟 splash-assets.js 之后皆可）
   作用：页面加载后，把署名「Designed by Yuanyuan Wang」注入开场页(#cms-splash-overlay)右下角。
   特点：字体(Cormorant Garamond Medium 子集)、样式、DOM 全自包含；幂等；主文件改版不影响它，
        只要开场容器 #cms-splash-overlay / #stageWrap 仍在即可。 */
(function(){
  var FONT_B64 = "d09GMgABAAAAAAn0ABAAAAAAEqgAAAmXAAQAQgAAAAAAAAAAAAAAAAAAAAAAAAAAGjAbgwYcXAZgP1NUQVREAIEUEQgKlhiRdAE2AiQDQAsiAAQgBYQmByAMBxtMD1GUMNY8iI+E3ETrJZZQljCdlGaA4qvLCElmeajfj9/Z+953RTSJhybeSCQVnc4wncgQMpFQPIk3+Ds8bat/42BjkS3CEDLaYN4KZmAUdl0U7Db7f1tV6GZzFfH/r/2q76ESf0J0SsOk0UxKmXOxuVzEbDDVxiEkGnEOya35bttNiVDrrs6xELyWuRXqYRHPmXHTCwKBdj4eC4ShQ+iUi0ZBU5wSldWp8Zrkc1rNEwSzRBOTAmibn22oArTtDcWVgLZH11QDaDBwxdJzd3FDDbDBCZVaEYZmxZee/AsGO21k+KdKn8IbgihN7DX/zB8Q8OeSP5WtJ+TJ7MvtJV4p+Tu5Aei5mvN5P9/J9/JohtEHNC3X/m3lPyyAFBO4FjWasIaw6NCogaBgC7By2BwU35RTw2kAUwQbtgo4BmqkNTP4gR2hTiCCC5wg+NpTXqoDhCiW8b27VDucd0AEOL0uE+MHDZRbZS0AVmf7iXXAwycWjwH+lvO54NBkz1a9Y++oV0J0NFVcKgfrJoNFnkv/Dpve43hpWRNkz6eVUiGsUvHdpKYN8QeqzSU6xPJCFRsAE8PZhS8xyhms1WRhtDIUKFaqXI1GzZ7NJPVBp+jH83vu5UxOQ45nX3ZlW7bmf03dpRfBUtum1nBRKc3UpSR113wymy6oflA/y0aLZwKv4ssqPmoqkaCRFyJwYslI3yXJLDKbI7Tn8lVMdoArjYdxd3Z0cffJDi6wpzM+sTNeOsRgf3GjB4IN3euH0mVh5qrHj4H+EaS0UmyGDE9iT7gGLPR7pemtRlJu9/R4mTw2lixtOEn/NpuUZYRklR7k3JJmo2X27xeRhVpn6sI8ANestEi70J9rt7W/pUgp1a4MK0ITWb9r96QpPmlH+7RpV6/K7CFOTdECfddaP/mKLZ10xidKrd50vYLyojU8EpFm7hrVrKC1nTyzYLBoKNgmaTvIojaASc2Tn0AGszlUvi5OmX8wi4D+8W27jNmdOHnvUR5G32V/cYLc0UZIaaVz5iFLFhmjhDLWXvw2MxAEaA/0gwDop5RsvJplnIYMM3fFFNA70LCjqkdS0rFZE++js/Ull7BMNQVT57AUs/RzW65jW3NAv3jrUAlpb4fSDB3EPtNW8pVphvlt4fj2PGQ4vml/cc21Deh7gd4IMeI4YDLV+ASCDP2hkAv0JoNLDx9lWRTabsMgRzi6aJeR/uiLt7MJso4HZi0jc37aUxFFh1FqhjRrwO/pEzqWbLlmspfQOckj6+CmGXEm60BuVr5xv/dcuOmrJaa0jnZCsibI8fuMyVVHQXi10rfa2Y0cjexx7A5xt91HmSQtyDDitdMSRzdnQVSQ9mvW+pPtZedjFXFyEuinLhO5l6/vxXIpMwOPOIgkzNT58JHw4gFkWN7uPXeBfmlLy5656c2STlL7un+n1AvQXnKJcRZYfdzMGPekYHued8yz1hEMr/wf5g2ztJauvHepFlgLvv8e8y5zF+HBWJh6xOPFYRgVvfHaC2nRXs/kpDwri3WJbggN1WdrA401SbEBbtIjUTN4L/wlDYzH/8bYqZ4l5HZxSPwPnnvPxXGnIIoJeHgp7cXg2y6thlfhftMGN+d7Hq1oElrnIjrpbKYscZ58+Jn9HYVckfKAz+QtuIQtMDrZFlgLe5OCRMNRNspcskeMCaCMf751/yfZEHsxQn2P1BVJShD6/0+Xp//2PYNq6uzhzEiAcPUYgb310HdR1vE2XzHnqHz2sknAe5ey/p/gi/eYAMKKY2gyL53HzHWqtzIjKTssw0cYguy0aNghbLEkQiRLDIoJLipEna0VvujQpuhzwds4p11UxTkZzLHANGO6wT4W0ciRVJUKSQrzjKcKBJf/6xRetuiu1CSm+nMSn+dLQ93vnwtv0gg2zVn8v3C2pz9Go7gtfiiMdZdCgrs4W5+PFNGc08HOMNwMUBgLC55DNvlv42zUTxRR6LkgDgQXY2zp6DZS4QpjYRxEp38b9ht5kkyaIJPOkRTAj+w2FUiff7ucrxGdUp1L81f43lUdk+jgv02D2Fg/eMz5EmfXboUquc8pFRa2WeIPy78PlEdQTj6b3fvFqzzOL9/No/z+HxdvDJQMD0KLIZ/SGX86MEafyXz+9es8keEnHsHH95Q1jkiCsTDxx19GiZfBpo2nMkTZITS5OFDQaEWzj3MQvdOnyrOIQCM2RHWk+c1ewPO+xNmWWKFR3OeVzrCNFNkT3nd2EHEpfgd8BiwZYCzMKP+9RcXPC61RyxDyB0RcgiNepXKm7KBlnEzMUHiWEQdjYZdEFx6XGC0U7o6fxe3nOv/5KXrw70wZ4pFMQGWJWjrNIhtBH9Cprx3JcWISAY8lFh+EuNDEH3huctkEl2k0KpSFis6xKP+xldaLpZmCD//9kzPlL7Ktt3mUGeGeXw3etg9K9kG0HgF++Tq/AOWnfg5x1mpVtRvqkxzuz09Tu3twh6pcynCKSPq8tePbMA6sUNQJQQqJOilcPPN8TTlbaDnjFhQfFiBpUtu46zXWd3j8K7sT+UEE8tVrKP1Ih4gQt0i1XyaH1KcIE8TwhNej2DLPpwRUjutMJP/fjOc8pK//RWeJZbKvv9aNgx8nBLDcFpuFrvkTHZJXQBklLD4IRUKTToh7ohlpLNEv/xAGx4UFIqfV1jJEY73P51/dnchn4cgbV93pDxNVIkQUpfbPYH+oTkgVnkgKE89UBljY9Lopw81SQqzFeglycwX1FNe+v2vUU/6pbHwfqqmJ1PPEpdjCmQj+y/QKb1VghJRFlUveerfgKiOGkt1K0w8vULNi73okOgpgO5q1hkxx8YcbAoy9QSW65k+CbytcAefHBGqL3sT/OC3PKeCvDVzdWVS9u3aO+hqfD7UvzK6xTw1z1XM0KiBIkhoGA3T/Nw57F/Oo7vjRurJpUtWXf5UiZwo0PWVaOBopNppjDZDHtxriZb4RoxZGD111YGLVKAKfIUy7fQKNN+GsNrdUom7BCw5twjyjNkWntzaVJd6bXKPZNBgNoXWjORHSJhq0x76Ut2me4u2a157eoTUeWaxWnWc1KFeqTBMODwoob2DKIS8GxNwG1Tu5OjUpJqgIrAihwjQ7VPOSytCwsZDoji6McrMC8sCetaq5O0FXq+uw3KGGBLY7NXIXNrNYAQpnQTpAxxpFOGKMoKQ74LnNqtBqvMgpjJJV4sS7HdRU6fBMHcpYWpTCAJ7EYTuerHgsFgGbA1Cr0SCMdNk6VTO3UFJQgVqpsCW87LVA81eRV1/WdwEAAA==";
  var TEXT = "Designed by Yuanyuan Wang";
  var CSS =
    "@font-face{font-family:'BQCreditSerif';font-weight:500;font-display:swap;"
    +"src:url(data:font/woff2;base64,"+FONT_B64+") format('woff2');}"
    +"#splashCredit{position:absolute!important;right:16px!important;"
    +"bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;"
    +"left:auto!important;top:auto!important;transform:none!important;z-index:3!important;"
    +"color:#b9a6e0!important;font-size:14px!important;letter-spacing:1px!important;"
    +"opacity:.72!important;pointer-events:none!important;white-space:nowrap!important;"
    +"font-family:'BQCreditSerif','Cormorant Garamond',Georgia,'Times New Roman',serif!important;"
    +"font-weight:500!important;font-style:normal!important;}";

  function inject(){
    var wrap = document.getElementById('stageWrap')
            || document.getElementById('cms-splash-overlay');
    if(!wrap) return false;
    if(!document.getElementById('bqCreditStyle')){
      var st = document.createElement('style');
      st.id = 'bqCreditStyle';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    var old = document.getElementById('splashCredit');
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.id = 'splashCredit';
    el.textContent = TEXT;
    wrap.appendChild(el);
    return true;
  }

  function boot(){
    if(inject()) return;
    var n = 0;
    var t = setInterval(function(){
      if(inject() || ++n > 60) clearInterval(t);
    }, 100);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
