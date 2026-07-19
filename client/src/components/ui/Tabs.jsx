import { useState, createContext, useContext } from 'react'

const TabsContext = createContext(null)

export function Tabs({ children, defaultValue, value, onChange, className = '' }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value !== undefined ? value : internalValue

  const handleChange = (val) => {
    if (onChange) onChange(val)
    else setInternalValue(val)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex border-b border-line ${className}`}
    >
      {children}
    </div>
  )
}

export function Tab({ value, disabled = false, children, className = '' }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab must be used within Tabs')
  const isActive = ctx.value === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => ctx.onChange(value)}
      className={`relative px-4 py-2.5 text-body font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-[-2px] rounded-t-card ${
        isActive
          ? 'text-indigo'
          : 'text-ink/50 hover:text-ink/70'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo" />
      )}
    </button>
  )
}

export function TabPanel({ value, children, className = '' }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabPanel must be used within Tabs')
  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}
