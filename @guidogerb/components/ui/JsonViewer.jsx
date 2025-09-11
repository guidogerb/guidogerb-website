import ReactJson from 'react-json-view'

// Custom Base16 Monokai theme
const monokaiTheme = {
  scheme: 'Monokai',
  author: 'Wimer Hazenberg',
  base00: '#272822', // background
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2', // default text
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672', // red
  base09: '#fd971f', // orange
  base0A: '#f4bf75', // yellow
  base0B: '#a6e22e', // green
  base0C: '#a1efe4', // cyan
  base0D: '#66d9ef', // blue
  base0E: '#ae81ff', // purple
  base0F: '#cc6633', // brown
}

export function JsonViewer({ data }) {
  return (
    <ReactJson
      src={data}
      name={false}
      collapsed={true}
      displayDataTypes={false}
      enableClipboard={true}
      displayObjectSize={true}
      theme={monokaiTheme}
    />
  )
}
