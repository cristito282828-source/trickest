import SkateGameWorkspace from '@/components/SkateGameWorkspace';

interface PageProps {
  params: { gameId: string };
}

export default function SkateGamePage({ params }: PageProps) {
  return <SkateGameWorkspace gameId={params.gameId} />;
}
