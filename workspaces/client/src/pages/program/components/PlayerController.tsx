import { Hoverable } from '@wsh-2025/client/src/features/layout/components/Hoverable';
import { useMuted } from '@wsh-2025/client/src/pages/program/hooks/useMuted';

export const PlayerController = () => {
  const [muted, toggleMuted] = useMuted();

  return (
    <div className="relative h-[120px]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#212121] to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-[12px]">
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-row items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#fff" d="M5.453 4.167a.726.726 0 0 0-1.027-.01A8.23 8.23 0 0 0 2 10a8.23 8.23 0 0 0 2.604 6.015a.725.725 0 0 0 1.01-.025c.316-.316.277-.819-.027-1.11A6.73 6.73 0 0 1 3.5 10c0-1.846.741-3.52 1.943-4.738c.29-.295.32-.785.01-1.095M7.214 5.93a.714.714 0 0 0-1.008-.016A5.73 5.73 0 0 0 4.5 10c0 1.692.73 3.213 1.893 4.265a.713.713 0 0 0 .983-.038c.328-.328.267-.844-.041-1.134A4.24 4.24 0 0 1 6 10c0-1.15.457-2.194 1.2-2.96c.286-.294.333-.793.014-1.111m5.572 0a.714.714 0 0 1 1.008-.016A5.73 5.73 0 0 1 15.5 10c0 1.692-.73 3.213-1.893 4.265a.713.713 0 0 1-.983-.038c-.328-.328-.267-.844.041-1.134A4.24 4.24 0 0 0 14 10c0-1.15-.457-2.194-1.2-2.96c-.286-.294-.333-.793-.014-1.111m1.761-1.762a.726.726 0 0 1 1.027-.01A8.23 8.23 0 0 1 18 10a8.23 8.23 0 0 1-2.604 6.015a.725.725 0 0 1-1.01-.025c-.316-.316-.277-.819.028-1.11A6.73 6.73 0 0 0 16.5 10c0-1.846-.741-3.52-1.943-4.738c-.29-.295-.32-.785-.01-1.095M10 8.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3"/></svg>
            <span className="ml-[4px] block shrink-0 grow-0 text-[12px] font-bold text-[#FFFFFF]">ライブ配信</span>
          </div>

          <div className="flex flex-row items-center">
            <Hoverable classNames={{ default: 'bg-transparent', hovered: 'bg-[#FFFFFF1F]' }}>
              <button
                aria-label={muted ? 'ミュート解除する' : 'ミュートする'}
                className="block rounded-[4px]"
                type="button"
                onClick={() => {
                  toggleMuted();
                }}
              >
                <span
                  className={`i-material-symbols:${muted ? 'volume-off-rounded' : 'volume-up-rounded'} m-[14px] block size-[20px] shrink-0 grow-0 text-[#FFFFFF]`}
                />
              </button>
            </Hoverable>
          </div>
        </div>
      </div>
    </div>
  );
};
