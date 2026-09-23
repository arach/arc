import { renderToString } from '../src/iso/vanilla'
import type { DiagramConfig } from '../src/iso/types'
const config: DiagramConfig = {id:'action-retro',title:'Action system map',theme:'light',material:'retro-print',canvas:{width:760,height:620},origin:{x:390,y:520},cornerRadius:2,floorSize:{width:240,depth:164},tiers:['EVIDENCE','NATIVE MACOS','LOCAL RUNTIME','REQUEST'].map((name,i)=>({name,elevation:i*92,floorColor:['#e8efe5','#e5efef','#ece7dc','#f4e5dc'][i],floorOpacity:i===0?.96:.45,borderColor:'#8b9182'})),nodes:['emerald','cyan','slate','rose'].flatMap((color,tier)=>['VIDEO + TRACE|SNAPSHOTS','ACTIONAGENT|ACTION.APP','RUNTIME|SESSION','AGENT + MCP|LAUNCHER'][tier].split('|').map((label,i)=>({tier,color,label,x:25+i*108,y:35,width:96,depth:56,height:15})))}
await Bun.write('/tmp/arc-retro.svg',renderToString(config))
await Bun.write('/tmp/arc-standard.svg',renderToString({...config,material:'standard'}))
