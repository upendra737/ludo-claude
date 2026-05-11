import { RoomPage } from '@/components/Game/RoomPage'

interface Props {
  params: Promise<{ code: string }>
}

export default async function Page({ params }: Props) {
  const { code } = await params
  return <RoomPage code={code.toUpperCase()} />
}
