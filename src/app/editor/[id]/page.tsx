import { EditorClient } from '@/components/editor/EditorClient';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default function EditorPage({ params }: PageProps) {
  return <EditorClient templateId={params.id} />;
}

