'use client'

import React from 'react'

export function TooltipProvider({ children, ...props }: { children: React.ReactNode } & any) {
  // Filter out props that shouldn't be passed to DOM
  const { openDelay, ...domProps } = props
  return <div>{children}</div>
}

export function Tooltip({ children, ...props }: { children: React.ReactNode } & any) {
  return <div {...props}>{children}</div>
}

export function TooltipTrigger({ children, asChild }: any) {
  return <>{children}</>
}

export function TooltipContent({ children, ...props }: any) {
  // Only forward safe DOM props like `className` and `hidden` if provided.
  const { className, hidden } = props || {}
  return (
    <div className={className} hidden={hidden}>
      {children}
    </div>
  )
}

