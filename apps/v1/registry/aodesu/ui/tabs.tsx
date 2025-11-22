"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component")
  }
  return context
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
  defaultValue?: string
}

function Tabs({
  value,
  onValueChange,
  className,
  children,
  defaultValue,
  ...props
}: TabsProps) {
  // Si no se controla externamente, manejar estado interno
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  const contextValue = React.useMemo(() => ({
    value: currentValue,
    onValueChange: handleValueChange,
  }), [currentValue, handleValueChange])

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

function TabsList({
  className,
  children,
  ...props
}: TabsListProps) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

function TabsTrigger({
  value,
  className,
  children,
  disabled = false,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs()
  const isSelected = selectedValue === value

  const handleClick = () => {
    if (!disabled) {
      onValueChange(value)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!disabled) {
        onValueChange(value)
      }
    }
  }

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tab-content-${value}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        isSelected && "data-[state=active]:bg-background dark:data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabs()
  const isSelected = selectedValue === value

  if (!isSelected) {
    return null
  }

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      id={`tab-content-${value}`}
      aria-labelledby={`tab-trigger-${value}`}
      className={cn("flex-1 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Versión con estado interno automático (opcional)
interface SimpleTabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

function SimpleTabs({ defaultValue, className, children, ...props }: SimpleTabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <Tabs value={value} onValueChange={setValue} className={className} {...props}>
      {children}
    </Tabs>
  )
}

export { SimpleTabs, Tabs, TabsContent, TabsList, TabsTrigger }
