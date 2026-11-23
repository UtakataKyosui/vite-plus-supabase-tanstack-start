import { createFileRoute } from '@tanstack/react-router'
import { Heading } from '~/components/ui/heading'
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <Heading level={3}>Welcome Home!!!</Heading>
    </div>
  )
}
