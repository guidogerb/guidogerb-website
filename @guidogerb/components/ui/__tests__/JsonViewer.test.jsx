import { render, screen } from '@testing-library/react'

import { JsonViewer } from '../src/JsonViewer/JsonViewer.jsx'

const ReactJsonMock = vi.hoisted(() => vi.fn(() => <div data-testid="json-viewer" />))

vi.mock('react-json-view', () => ({
  __esModule: true,
  default: ReactJsonMock,
}))

describe('JsonViewer', () => {
  beforeEach(() => {
    ReactJsonMock.mockClear()
  })

  it('renders react-json-view with the configured presentation defaults', () => {
    const data = { hello: 'world', nested: { value: 1 } }

    render(<JsonViewer data={data} />)

    expect(screen.getByTestId('json-viewer')).toBeInTheDocument()
    expect(ReactJsonMock).toHaveBeenCalledTimes(1)

    const [props] = ReactJsonMock.mock.calls[0]
    expect(props).toMatchObject({
      src: data,
      name: false,
      collapsed: true,
      displayDataTypes: false,
      enableClipboard: true,
      displayObjectSize: true,
    })
    expect(props.theme).toMatchObject({
      scheme: 'Monokai',
      base00: '#272822',
      base05: '#f8f8f2',
      base0B: '#a6e22e',
      base0D: '#66d9ef',
    })
  })
})
