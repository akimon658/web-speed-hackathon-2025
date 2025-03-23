import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { ReactElement, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrayValues } from 'type-fest';

import { Dialog } from '@wsh-2025/client/src/features/dialog/components/Dialog';
import { useSelectedProgramId } from '@wsh-2025/client/src/pages/timetable/hooks/useSelectedProgramId';

interface Props {
  isOpen: boolean;
  program: ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>;
}

export const ProgramDetailDialog = ({ isOpen, program }: Props): ReactElement => {
  const [, setProgram] = useSelectedProgramId();

  const onClose = () => {
    setProgram(null);
  };
  const [programDescription, setProgramDescription] = useState('読み込み中');
  useEffect(() => {
    if (isOpen === false) {
      return;
    }

    const fetchProgramDescription = async () => {
      const response = await fetch(`/api/programs/${program.id}`);
      const data = await response.json();
      setProgramDescription(data.description);
    }
    fetchProgramDescription();
  }, [isOpen, program.id]);
  const [episodeTitle, setEpisodeTitle] = useState('読み込み中');
  const [episodeDescription, setEpisodeDescription] = useState('読み込み中');
  const [episodeThumbnailUrl, setEpisodeThumbnailUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (isOpen === false) {
      return;
    }

    const fetchEpisodeDescription = async () => {
      const response = await fetch(`/api/episodes/${program.episodeId}`);
      const data = await response.json();
      setEpisodeTitle(data.title);
      setEpisodeDescription(data.description);
      setEpisodeThumbnailUrl(data.thumbnailUrl);
    }
    fetchEpisodeDescription();
  }, [isOpen, program.episodeId]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="h-75vh size-full overflow-auto">
        <h2 className="mb-[24px] text-center text-[24px] font-bold">番組詳細</h2>

        <p className="mb-[8px] text-[14px] font-bold text-[#ffffff]">{program.title}</p>
        <div className="mb-[16px] text-[14px] text-[#999999]">
          <div className="line-clamp-5">{programDescription}</div>
        </div>
        <img
          alt=""
          className="mb-[24px] w-full rounded-[8px] border-[2px] border-solid border-[#FFFFFF1F]"
          src={program.thumbnailUrl}
        />

        <h3 className="mb-[24px] text-center text-[24px] font-bold">番組で放送するエピソード</h3>

        <p className="mb-[8px] text-[14px] font-bold text-[#ffffff]">{episodeTitle}</p>
        <div className="mb-[16px] text-[14px] text-[#999999]">
          <div className="line-clamp-5">{episodeDescription}</div>
        </div>
        <img
          alt=""
          className="mb-[24px] w-full rounded-[8px] border-[2px] border-solid border-[#FFFFFF1F]"
          src={episodeThumbnailUrl}
        />

        <div className="flex flex-row justify-center">
          <Link
            className="block flex w-[160px] flex-row items-center justify-center rounded-[4px] bg-[#1c43d1] p-[12px] text-[14px] font-bold text-[#ffffff] disabled:opacity-50"
            to={`/programs/${program.id}`}
            onClick={onClose}
          >
            番組をみる
          </Link>
        </div>
      </div>
    </Dialog>
  );
};
