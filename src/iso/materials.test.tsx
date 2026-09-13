import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ArcDiagram from './ArcDiagram'
import { renderToString } from './vanilla'
import type { DiagramConfig } from './types'
const config: DiagramConfig = {id:'test',title:'Test',theme:'light',canvas:{width:400,height:400},origin:{x:200,y:300},tiers:[{name:'Runtime',elevation:0}],floorSize:{width:120,depth:80},nodes:[{tier:0,x:10,y:10,width:90,depth:40,height:12,color:'rose',label:'Runtime'}]}
describe('print material across renderers',()=>{
 for (const render of [renderToString,(c:DiagramConfig)=>renderToStaticMarkup(createElement(ArcDiagram, {config:c, options:{animate:false}}))] ) {
  test('opt-in palette and grain leave standard rendering unchanged',()=>{
   const standard=render(config)
   expect(standard).toBe(render({...config,material:'standard'}))
   expect(standard).toContain('#fda4af')
   const print=render({...config,material:'retro-print'})
   expect(print).toContain('#c58a70')
   expect(print).toContain('r="0.48"')
   expect(print).toContain('#f4efe6')
   expect(print).toBe(render({...config,material:'retro-print'}))
  })
 }
})

test('technical React styles retain their rendering when a print material is supplied', () => {
 const render = (c: DiagramConfig) => renderToStaticMarkup(createElement(ArcDiagram, { config: c, options: { animate: false } }))
 for (const style of ['blueprint', 'cyanotype'] as const) {
  expect(render({ ...config, style, material: 'retro-print' })).toBe(render({ ...config, style }))
 }
})
