import { useEffect, useId, useMemo, useRef, useState, type KeyboardEventHandler } from 'react'

import { Input } from '@/components/ui/input'
import { useBusNumbersQuery } from '@/features/buses/hooks/use-bus-numbers-query'
import { cn } from '@/lib/utils'

type BusNumberAutocompleteProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

export function BusNumberAutocomplete({
  id,
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  'aria-invalid': ariaInvalid,
}: BusNumberAutocompleteProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: busNumbers = [] } = useBusNumbersQuery()
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const filteredBusNumbers = useMemo(() => {
    const query = value.trim()
    if (!query) return []
    const normalizedQuery = query.toLowerCase()
    return busNumbers.filter((busNumber) => busNumber.toLowerCase().includes(normalizedQuery))
  }, [busNumbers, value])

  const showDropdown = isOpen && value.trim().length > 0 && filteredBusNumbers.length > 0

  useEffect(() => {
    setHighlightedIndex(filteredBusNumbers.length > 0 ? 0 : -1)
  }, [filteredBusNumbers])

  useEffect(() => {
    if (!showDropdown) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showDropdown])

  const selectBusNumber = (busNumber: string) => {
    onChange(busNumber)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!showDropdown) {
      if (event.key === 'ArrowDown' && value.trim().length > 0 && filteredBusNumbers.length > 0) {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % filteredBusNumbers.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((prev) => (prev <= 0 ? filteredBusNumbers.length - 1 : prev - 1))
        break
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredBusNumbers.length) {
          event.preventDefault()
          selectBusNumber(filteredBusNumbers[highlightedIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        role="combobox"
        className={className}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (value.trim().length > 0) {
            setIsOpen(true)
          }
        }}
        onKeyDown={handleKeyDown}
      />

      {showDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {filteredBusNumbers.map((busNumber, index) => (
            <li
              key={busNumber}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm',
                index === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/70',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectBusNumber(busNumber)}
            >
              {busNumber}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
