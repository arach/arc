import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import ArcDiagram from '../src/iso/ArcDiagram'
import { config } from './retro-config'
function App() {
 const [material,setMaterial]=useState<'retro-print'|'standard'>('retro-print')
 const [reset,setReset]=useState(0)
 const [status,setStatus]=useState('Hover to separate layers. Click a node or layer to hold its selection.')
 return <main><header><div><h1>Action system map</h1><p>One local path from intent to evidence.</p></div><div className="controls"><label>Material <select value={material} onChange={e=>setMaterial(e.target.value as typeof material)}><option value="retro-print">Retro print</option><option value="standard">Standard</option></select></label><button onClick={()=>{setReset(reset+1);setStatus('Selection cleared.')}}>Reset view</button></div></header><div className="viewport"><ArcDiagram key={reset} config={{...config,material}} options={{interactive:true,animate:false,expandOnHover:true,showLabels:true}} onNodeClick={node=>setStatus(node.label)} onLayerClick={tier=>setStatus(config.tiers[tier].name)}/></div><footer aria-live="polite">{status}</footer></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
