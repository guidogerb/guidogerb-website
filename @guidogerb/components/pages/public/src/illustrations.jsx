import { forwardRef, useId } from 'react'
import { joinClassNames } from './utils.js'

const VIEWBOX = '0 0 320 240'

const BaseIllustration = forwardRef(function BaseIllustration(
  {
    title,
    description,
    className,
    defaultPalette,
    palette,
    viewBox = VIEWBOX,
    role = 'img',
    children,
    ...rest
  },
  ref,
) {
  const titleId = useId()
  const descriptionId = useId()
  const labelledBy = title ? titleId : undefined
  const describedBy = description ? descriptionId : undefined
  const colors = { ...(defaultPalette ?? {}), ...(palette ?? {}) }
  const content = typeof children === 'function' ? children(colors) : children

  return (
    <svg
      ref={ref}
      role={role}
      focusable="false"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      viewBox={viewBox}
      className={joinClassNames('public-illustration', className)}
      {...rest}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {description ? <desc id={descriptionId}>{description}</desc> : null}
      {content}
    </svg>
  )
})

BaseIllustration.displayName = 'PublicIllustrationBase'

const STORYTELLING_PALETTE = {
  background: '#f4f0ff',
  shadow: '#dcd6ff',
  primary: '#4338ca',
  accent: '#f97316',
  highlight: '#34d399',
  audience: '#6366f1',
  outline: '#312e81',
}

export const StorytellingIllustration = forwardRef(function StorytellingIllustration(
  { title, description, palette, className, ...rest },
  ref,
) {
  const finalTitle = title ?? 'Performer under stage lights'
  const finalDescription =
    description ??
    'An abstract stage with a presenter framed by two warm spotlights and an audience.'

  return (
    <BaseIllustration
      ref={ref}
      title={finalTitle}
      description={finalDescription}
      defaultPalette={STORYTELLING_PALETTE}
      palette={palette}
      className={joinClassNames('public-illustration--storytelling', className)}
      {...rest}
    >
      {({ background, shadow, primary, accent, highlight, audience, outline }) => (
        <>
          <rect
            data-part="canvas"
            x="12"
            y="12"
            width="296"
            height="216"
            rx="28"
            fill={background}
          />
          <ellipse data-part="stage-shadow" cx="160" cy="196" rx="96" ry="20" fill={shadow} />
          <path
            data-part="stage"
            d="M64 176h192v24c0 11-9 20-20 20H84c-11 0-20-9-20-20v-24z"
            fill={primary}
          />
          <path
            data-part="left-light"
            d="M92 48c-18 24-28 56-28 88l60-6z"
            fill={accent}
            opacity="0.35"
          />
          <path
            data-part="right-light"
            d="M228 48c18 24 28 56 28 88l-60-6z"
            fill={accent}
            opacity="0.35"
          />
          <circle data-part="presenter-head" cx="160" cy="108" r="18" fill={highlight} />
          <path
            data-part="presenter-body"
            d="M144 132h32c13 0 24 11 24 24v26h-80v-26c0-13 11-24 24-24z"
            fill={highlight}
            opacity="0.9"
          />
          <path
            data-part="presenter-outline"
            d="M124 180h72v12c0 4-3 7-7 7h-58c-4 0-7-3-7-7z"
            fill={primary}
          />
          <circle data-part="audience-left" cx="112" cy="196" r="10" fill={audience} />
          <circle data-part="audience-center" cx="160" cy="204" r="12" fill={audience} />
          <circle data-part="audience-right" cx="208" cy="196" r="10" fill={audience} />
          <path
            data-part="curtain"
            d="M36 102V76C36 51 56 32 80 32h56c8 0 16 3 24 8 8-5 16-8 24-8h56c24 0 44 19 44 44v26z"
            fill={primary}
            opacity="0.18"
          />
          <path
            data-part="outline"
            d="M60 174v24c0 15 13 28 28 28h144c15 0 28-13 28-28v-24"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </BaseIllustration>
  )
})

StorytellingIllustration.displayName = 'StorytellingIllustration'

const CONNECTIONS_PALETTE = {
  background: '#ecfeff',
  network: '#0891b2',
  nodePrimary: '#0ea5e9',
  nodeAccent: '#22d3ee',
  nodeHighlight: '#2563eb',
  outline: '#155e75',
  signal: '#99f6e4',
  hub: '#f97316',
}

export const ConnectionsIllustration = forwardRef(function ConnectionsIllustration(
  { title, description, palette, className, ...rest },
  ref,
) {
  const finalTitle = title ?? 'Connected publishing network'
  const finalDescription =
    description ??
    'Interlinked nodes represent collaborators sharing content across the Guidogerb platform.'

  return (
    <BaseIllustration
      ref={ref}
      title={finalTitle}
      description={finalDescription}
      defaultPalette={CONNECTIONS_PALETTE}
      palette={palette}
      className={joinClassNames('public-illustration--connections', className)}
      {...rest}
    >
      {({ background, network, nodePrimary, nodeAccent, nodeHighlight, outline, signal, hub }) => (
        <>
          <rect
            data-part="canvas"
            x="8"
            y="20"
            width="304"
            height="200"
            rx="32"
            fill={background}
          />
          <path
            data-part="signal-ring"
            d="M160 58 C 210 58 250 100 250 148 C 250 162 247 176 241.2 188.8"
            stroke={signal}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
          <path
            data-part="network"
            d="M84 94 C 132 44 206 50 240 88 S 292 196 258 220"
            stroke={network}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="108"
            y1="132"
            x2="196"
            y2="94"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            data-part="link-primary"
          />
          <line
            x1="108"
            y1="132"
            x2="76"
            y2="180"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            data-part="link-secondary"
          />
          <line
            x1="216"
            y1="140"
            x2="196"
            y2="94"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            data-part="link-tertiary"
          />
          <line
            x1="216"
            y1="140"
            x2="248"
            y2="184"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            data-part="link-quaternary"
          />
          <circle
            data-part="hub"
            cx="160"
            cy="124"
            r="20"
            fill={hub}
            stroke={outline}
            strokeWidth="4"
          />
          <circle
            data-part="node-primary"
            cx="108"
            cy="132"
            r="18"
            fill={nodePrimary}
            stroke={outline}
            strokeWidth="4"
          />
          <circle
            data-part="node-accent"
            cx="196"
            cy="94"
            r="16"
            fill={nodeAccent}
            stroke={outline}
            strokeWidth="4"
          />
          <circle
            data-part="node-highlight"
            cx="216"
            cy="140"
            r="14"
            fill={nodeHighlight}
            stroke={outline}
            strokeWidth="4"
          />
          <circle
            data-part="node-supporting"
            cx="76"
            cy="180"
            r="12"
            fill={nodeAccent}
            stroke={outline}
            strokeWidth="4"
            opacity="0.9"
          />
          <circle
            data-part="node-ally"
            cx="248"
            cy="184"
            r="12"
            fill={nodePrimary}
            stroke={outline}
            strokeWidth="4"
            opacity="0.9"
          />
          <circle data-part="background-node" cx="128" cy="66" r="10" fill={signal} opacity="0.7" />
          <circle
            data-part="background-node-secondary"
            cx="240"
            cy="72"
            r="8"
            fill={signal}
            opacity="0.5"
          />
          <circle
            data-part="background-node-tertiary"
            cx="188"
            cy="192"
            r="9"
            fill={signal}
            opacity="0.4"
          />
        </>
      )}
    </BaseIllustration>
  )
})

ConnectionsIllustration.displayName = 'ConnectionsIllustration'

const ANALYTICS_PALETTE = {
  background: '#eef2ff',
  chartBackground: '#dbeafe',
  axis: '#312e81',
  bar: '#6366f1',
  barAccent: '#f59e0b',
  barHighlight: '#34d399',
  outline: '#1e1b4b',
  piePrimary: '#4f46e5',
  pieSecondary: '#f97316',
  pieTertiary: '#0ea5e9',
  spark: '#c4b5fd',
}

export const AnalyticsIllustration = forwardRef(function AnalyticsIllustration(
  { title, description, palette, className, ...rest },
  ref,
) {
  const finalTitle = title ?? 'Analytics dashboard preview'
  const finalDescription =
    description ??
    'Charts and graphs show performance metrics available in the Guidogerb dashboard.'

  return (
    <BaseIllustration
      ref={ref}
      title={finalTitle}
      description={finalDescription}
      defaultPalette={ANALYTICS_PALETTE}
      palette={palette}
      className={joinClassNames('public-illustration--analytics', className)}
      {...rest}
    >
      {({
        background,
        chartBackground,
        axis,
        bar,
        barAccent,
        barHighlight,
        outline,
        piePrimary,
        pieSecondary,
        pieTertiary,
        spark,
      }) => (
        <>
          <rect
            data-part="canvas"
            x="14"
            y="16"
            width="292"
            height="208"
            rx="24"
            fill={background}
          />
          <rect
            data-part="chart-area"
            x="40"
            y="60"
            width="168"
            height="128"
            rx="18"
            fill={chartBackground}
          />
          <line
            data-part="axis-x"
            x1="56"
            y1="172"
            x2="192"
            y2="172"
            stroke={axis}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            data-part="axis-y"
            x1="56"
            y1="88"
            x2="56"
            y2="172"
            stroke={axis}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect data-part="bar" x="72" y="140" width="24" height="32" rx="6" fill={bar} />
          <rect data-part="bar" x="112" y="120" width="24" height="52" rx="6" fill={barAccent} />
          <rect data-part="bar" x="152" y="104" width="24" height="68" rx="6" fill={barHighlight} />
          <polyline
            data-part="sparkline"
            points="72,124 96,132 120,110 144,128 168,104"
            fill="none"
            stroke={spark}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g data-part="pie" transform="translate(234 128)">
            <circle data-part="pie-ring" r="44" fill={chartBackground} />
            <path data-part="pie-primary" d="M0 -36A36 36 0 0 1 32 18L0 0Z" fill={piePrimary} />
            <path
              data-part="pie-secondary"
              d="M32 18A36 36 0 0 1 -18 34L0 0Z"
              fill={pieSecondary}
            />
            <path data-part="pie-tertiary" d="M-18 34A36 36 0 0 1 0 -36L0 0Z" fill={pieTertiary} />
            <circle
              data-part="pie-center"
              r="14"
              fill={background}
              stroke={outline}
              strokeWidth="4"
            />
          </g>
          <rect
            data-part="legend-card"
            x="214"
            y="60"
            width="80"
            height="40"
            rx="10"
            fill={chartBackground}
          />
          <circle data-part="legend-dot-primary" cx="230" cy="80" r="6" fill={piePrimary} />
          <circle data-part="legend-dot-secondary" cx="230" cy="96" r="6" fill={pieSecondary} />
          <circle data-part="legend-dot-tertiary" cx="230" cy="112" r="6" fill={pieTertiary} />
          <path
            data-part="outline"
            d="M40 60h168c6 0 12 2.4 16.8 6.8L248 94"
            stroke={outline}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.45"
          />
        </>
      )}
    </BaseIllustration>
  )
})

AnalyticsIllustration.displayName = 'AnalyticsIllustration'

export default StorytellingIllustration
