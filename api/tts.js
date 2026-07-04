/* 小积木 · 神经语音转发接口 v2（ws 库版：可发送微软要求的身份头——标准 WebSocket 发不了所以 v1 被拒）
   需要仓库根目录有 package.json（依赖 ws），Vercel 会自动安装。
   浏览器访问 /api/tts?text=你好&g=f 或 &voice=zh-CN-XiaoxiaoNeural → 返回 MP3（CDN 缓存） */
import WebSocket from 'ws';
import { createHash, randomUUID } from 'crypto';

const TOKEN='6A5AA1D4EAFF4E9FB37E23D68491D6F4';

function gec(){
  const ticks=Math.floor(Date.now()/1000)+11644473600;
  const win=(ticks-(ticks%300))*10000000;
  return createHash('sha256').update(String(win)+TOKEN).digest('hex').toUpperCase();
}
const uuid=()=>randomUUID().replace(/-/g,'');

export default async function handler(req, res){
  try{
    const q=req.query||{};
    const text=String(q.text||'').slice(0,400).trim();
    if(!text){ res.status(400).send('missing text'); return; }
    const voice=String(q.voice||'')||((q.g==='m')?'zh-CN-YunxiNeural':'zh-CN-XiaoxiaoNeural');

    const url='wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
      +'?TrustedClientToken='+TOKEN+'&Sec-MS-GEC='+gec()+'&Sec-MS-GEC-Version=1-131.0.2903.99&ConnectionId='+uuid();
    const ws=new WebSocket(url, {
      headers:{
        'Origin':'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.99',
        'Pragma':'no-cache',
        'Cache-Control':'no-cache',
        'Accept-Language':'zh-CN,zh;q=0.9'
      }
    });

    const chunks=[];
    const audio=await new Promise((resolve,reject)=>{
      const to=setTimeout(()=>{ try{ws.terminate();}catch(e){} reject(new Error('timeout')); }, 8000);
      ws.on('error',(e)=>{ clearTimeout(to); reject(new Error('ws-error:'+(e&&e.message||''))); });
      ws.on('close',(code)=>{ clearTimeout(to); if(!chunks.length) reject(new Error('closed-'+code)); });
      ws.on('open',()=>{
        ws.send('X-Timestamp:'+new Date().toISOString()+'\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n'
          +JSON.stringify({context:{synthesis:{audio:{metadataoptions:{sentenceBoundaryEnabled:false,wordBoundaryEnabled:false},outputFormat:'audio-24khz-48kbitrate-mono-mp3'}}}}));
        const short=[...text].length<=4;
        const esc=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const ssml="<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>"
          +"<voice name='"+voice+"'><prosody rate='"+(short?'-28%':'-8%')+"'>"
          +(short?("<break time='120ms'/>"+esc+"<break time='150ms'/>"):esc)
          +"</prosody></voice></speak>";
        ws.send('X-RequestId:'+uuid()+'\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:'+new Date().toISOString()+'\r\nPath:ssml\r\n\r\n'+ssml);
      });
      ws.on('message',(data,isBinary)=>{
        if(!isBinary){
          const s=data.toString('utf8');
          if(s.indexOf('Path:turn.end')>=0){
            clearTimeout(to); try{ws.close();}catch(e){}
            if(!chunks.length) return reject(new Error('empty'));
            resolve(Buffer.concat(chunks));
          }
          return;
        }
        try{
          const hl=data.readUInt16BE(0);
          const head=data.slice(2,2+hl).toString('utf8');
          if(head.indexOf('Path:audio')>=0 && data.length>2+hl) chunks.push(data.slice(2+hl));
        }catch(e){}
      });
    });

    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=2592000, immutable');
    res.status(200).send(audio);
  }catch(e){
    res.status(502).send('tts-failed: '+(e&&e.message||e));
  }
}
