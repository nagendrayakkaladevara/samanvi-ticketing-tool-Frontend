import { steeringWheel } from '@lucide/lab'
import { Icon, type LucideProps } from 'lucide-react'

export function SteeringWheelIcon({ className, ...props }: LucideProps) {
  return <Icon iconNode={steeringWheel} className={className} {...props} />
}
