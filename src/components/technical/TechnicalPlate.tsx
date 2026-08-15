// The drafting plate drawn over the paper: frame, registration ticks, the
// component index, and the title block. Lives in canvas space (it pans and
// zooms with the drawing) and never intercepts pointer events.

import { useId } from 'react'
import TechnicalDefs, { hatchPatternIds } from './TechnicalDefs'
import { componentTag } from '../../utils/isoWire'
import type { Bounds, IndexRow } from '../../utils/isoWire'
import { materialFor, MATERIAL_LABELS, d } from '../../utils/isoStyles'
import type { IsoStyleSpec } from '../../utils/isoStyles'

const FRAME_INSET = d(10)
const INDEX_ROWS = 9

interface TechnicalPlateProps {
  style: IsoStyleSpec
  /** Framed rect, in canvas coordinates. */
  plate: Bounds
  rows: IndexRow[]
  /** Drawing title for the title block. */
  title?: string
  /** Right-hand title-block tally, e.g. "07 CMP / 06 LNK". */
  tally?: string
  className?: string
}

const clip = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

export default function TechnicalPlate({
  style,
  plate,
  rows,
  title,
  tally,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
}: TechnicalPlateProps) {
  const uid = useId().replace(/:/g, '')

  const visibleRows = rows.slice(0, INDEX_ROWS)
  const overflow = rows.length - visibleRows.length

  const frame = {
    x: plate.minX + FRAME_INSET,
    y: plate.minY + FRAME_INSET,
    width: plate.maxX - plate.minX - FRAME_INSET * 2,
    height: plate.maxY - plate.minY - FRAME_INSET * 2,
  }

  const text = {
    fontFamily: style.font,
    letterSpacing: '0.08em',
  } as const

  // --- Component index (top-left) ---
  const idxW = d(236)
  const idxRowH = d(13)
  const idxHeadH = d(16)
  const idxH = idxHeadH + Math.max(visibleRows.length, 1) * idxRowH + (overflow > 0 ? idxRowH : 0)
  const idxX = frame.x + d(14)
  const idxY = frame.y + d(14)

  // --- Title block (bottom-right) ---
  const tbW = d(264)
  const tbH = d(74)
  // Column split: the right column carries the longest value (the tally), so
  // it gets the wider half.
  const tbSplit = d(126)
  const tbX = frame.x + frame.width - tbW - d(14)
  const tbY = frame.y + frame.height - tbH - d(14)

  return (
    <svg className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      <TechnicalDefs uid={uid} style={style} />

      {/* Drafting frame */}
      <rect
        x={plate.minX}
        y={plate.minY}
        width={plate.maxX - plate.minX}
        height={plate.maxY - plate.minY}
        fill="none"
        stroke={style.paper.edge}
        strokeWidth={1.4}
      />
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        fill="none"
        stroke={style.paper.edge}
        strokeWidth={0.6}
        opacity={0.75}
      />

      {/* Corner registration ticks */}
      {[
        [frame.x, frame.y, 1, 1],
        [frame.x + frame.width, frame.y, -1, 1],
        [frame.x, frame.y + frame.height, 1, -1],
        [frame.x + frame.width, frame.y + frame.height, -1, -1],
      ].map(([cx, cy, sx, sy], i) => (
        <path
          key={i}
          d={`M ${cx + sx * d(16)} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * d(16)}`}
          fill="none"
          stroke={style.ink.line}
          strokeWidth={1.2}
        />
      ))}

      {/* Component index */}
      {visibleRows.length > 0 && (
        <g>
          <rect
            x={idxX}
            y={idxY}
            width={idxW}
            height={idxH}
            fill={style.paper.from}
            fillOpacity={0.55}
            stroke={style.ink.line}
            strokeWidth={0.8}
          />
          <line
            x1={idxX}
            y1={idxY + idxHeadH}
            x2={idxX + idxW}
            y2={idxY + idxHeadH}
            stroke={style.ink.line}
            strokeWidth={0.8}
          />
          <text x={idxX + d(8)} y={idxY + d(11)} fill={style.ink.text} fontSize={d(8)} fontWeight={600} style={text}>
            COMPONENT INDEX
          </text>
          <text
            x={idxX + idxW - d(8)}
            y={idxY + d(11)}
            textAnchor="end"
            fill={style.ink.muted}
            fontSize={d(8)}
            style={text}
          >
            {componentTag(rows.length)} ITEMS
          </text>

          {visibleRows.map((row, i) => {
            const y = idxY + idxHeadH + i * idxRowH
            const kind = materialFor(row.color)
            const swatchIds = hatchPatternIds(uid, kind, 'top')
            return (
              <g key={row.n}>
                <text x={idxX + d(8)} y={y + d(9.5)} fill={style.ink.muted} fontSize={d(7.5)} style={text}>
                  {componentTag(row.n)}
                </text>
                <rect
                  x={idxX + d(28)}
                  y={y + d(3)}
                  width={d(14)}
                  height={d(7)}
                  fill={style.face.right}
                  stroke={style.ink.line}
                  strokeWidth={0.4}
                />
                {swatchIds.map((id) => (
                  <rect
                    key={id}
                    x={idxX + d(28)}
                    y={y + d(3)}
                    width={d(14)}
                    height={d(7)}
                    fill={`url(#${id})`}
                    opacity={0.85}
                  />
                ))}
                <text x={idxX + d(50)} y={y + d(9.5)} fill={style.ink.text} fontSize={d(7.5)} style={text}>
                  {clip((row.name || '').toUpperCase(), 18)}
                </text>
                <text
                  x={idxX + idxW - d(8)}
                  y={y + d(9.5)}
                  textAnchor="end"
                  fill={style.ink.muted}
                  fontSize={d(7)}
                  style={text}
                >
                  {MATERIAL_LABELS[kind]}
                </text>
              </g>
            )
          })}

          {overflow > 0 && (
            <text
              x={idxX + d(8)}
              y={idxY + idxHeadH + visibleRows.length * idxRowH + d(9.5)}
              fill={style.ink.muted}
              fontSize={d(7.5)}
              style={text}
            >
              {`+ ${overflow} NOT LISTED`}
            </text>
          )}
        </g>
      )}

      {/* Title block */}
      <g>
        <rect
          x={tbX}
          y={tbY}
          width={tbW}
          height={tbH}
          fill={style.paper.from}
          fillOpacity={0.55}
          stroke={style.ink.line}
          strokeWidth={0.8}
        />
        <line x1={tbX} y1={tbY + d(30)} x2={tbX + tbW} y2={tbY + d(30)} stroke={style.ink.line} strokeWidth={0.8} />
        <line x1={tbX} y1={tbY + d(52)} x2={tbX + tbW} y2={tbY + d(52)} stroke={style.ink.line} strokeWidth={0.5} />
        <line x1={tbX + tbSplit} y1={tbY + d(30)} x2={tbX + tbSplit} y2={tbY + tbH} stroke={style.ink.line} strokeWidth={0.5} />

        <text x={tbX + d(9)} y={tbY + d(12)} fill={style.ink.muted} fontSize={d(6.5)} style={text}>
          DRAWING TITLE
        </text>
        <text x={tbX + d(9)} y={tbY + d(24)} fill={style.ink.text} fontSize={d(10)} fontWeight={600} style={text}>
          {clip((title || 'UNTITLED ASSEMBLY').toUpperCase(), 26)}
        </text>

        <text x={tbX + d(9)} y={tbY + d(43)} fill={style.ink.muted} fontSize={d(6.5)} style={text}>
          PROJECTION
        </text>
        <text x={tbX + tbSplit - d(9)} y={tbY + d(43)} textAnchor="end" fill={style.ink.text} fontSize={d(7)} style={text}>
          ISOMETRIC 30°
        </text>
        <text x={tbX + d(9)} y={tbY + d(65)} fill={style.ink.muted} fontSize={d(6.5)} style={text}>
          SCALE
        </text>
        <text x={tbX + tbSplit - d(9)} y={tbY + d(65)} textAnchor="end" fill={style.ink.text} fontSize={d(7)} style={text}>
          1:1
        </text>

        <text x={tbX + tbSplit + d(9)} y={tbY + d(43)} fill={style.ink.muted} fontSize={d(6.5)} style={text}>
          QTY
        </text>
        <text x={tbX + tbW - d(9)} y={tbY + d(43)} textAnchor="end" fill={style.ink.text} fontSize={d(7)} style={text}>
          {tally || `${componentTag(rows.length)} CMP`}
        </text>
        <text x={tbX + tbSplit + d(9)} y={tbY + d(65)} fill={style.ink.muted} fontSize={d(6.5)} style={text}>
          SHEET
        </text>
        <text x={tbX + tbW - d(9)} y={tbY + d(65)} textAnchor="end" fill={style.ink.text} fontSize={d(7)} style={text}>
          1 OF 1
        </text>
      </g>
    </svg>
  )
}
