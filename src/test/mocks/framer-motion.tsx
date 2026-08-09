import type { ComponentProps, ReactNode } from 'react'

export const AnimatePresence = ({ children }: { children: ReactNode }) => <>{children}</>

function createMotionComponent(tag: keyof JSX.IntrinsicElements) {
  return ({ children, ...props }: ComponentProps<typeof tag>) => {
    const Element = tag
    return <Element {...props}>{children}</Element>
  }
}

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  article: createMotionComponent('article'),
  button: createMotionComponent('button'),
}

export const useReducedMotion = () => true
