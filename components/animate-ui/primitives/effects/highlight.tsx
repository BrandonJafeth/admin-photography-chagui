'use client'

import React from 'react'

type HighlightProps = {
  children: React.ReactNode
  containerClassName?: string
  className?: string
  enabled?: boolean
  hover?: boolean
  controlledItems?: boolean
  mode?: string
  transition?: any
  forceUpdateBounds?: boolean
  [key: string]: any
}

export function Highlight({
  children,
  containerClassName,
  className,
  enabled,
  hover,
  controlledItems,
  mode,
  transition,
  forceUpdateBounds,
  ...props
}: HighlightProps) {
  // Filter out props that shouldn't be passed to DOM
  return (
    <div className={containerClassName}>{children}</div>
  )
}

type HighlightItemProps = {
  children: React.ReactNode
  activeClassName?: string
  className?: string
}

export function HighlightItem({ children, activeClassName, className }: HighlightItemProps) {
  // We avoid forwarding unknown props to the DOM to prevent React warnings.
  // Consumers can apply `activeClassName` by wrapping or cloning elements if needed.
  return (
    <div className={className} data-active-class={activeClassName || undefined}>
      {children}
    </div>
  )
}

