const DefaultFallback = () => <h1>TODO App component implementation</h1>

export const AppBasic = ({ children }) => {
  const content = children ?? <DefaultFallback />
  return (
    <div data-app-variant="basic" className="gg-app gg-app--basic">
      {content}
    </div>
  )
}

export const App = AppBasic

export default App
