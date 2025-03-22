import { useEffect, useState } from 'react';

interface ThumbnailSpriteMetadata {
  version: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
  columns: number;
  rows: number;
  count: number;
  interval: number;
  duration: number;
}

async function loadSeekThumbnailData(streamId: string): Promise<{
  spriteUrl: string;
  metadata: ThumbnailSpriteMetadata;
}> {
  try {
    // サムネイルスプライトのメタデータを取得
    const metadataUrl = `/streams/${streamId}/sprite.json`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      throw new Error(`Failed to load thumbnail metadata: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json() as ThumbnailSpriteMetadata;

    // メタデータのフォーマットに基づいてスプライトURLを生成
    const spriteUrl = `/streams/${streamId}/sprite.avif`;

    // スプライト画像が存在するか確認
    const spriteResponse = await fetch(spriteUrl, { method: 'HEAD' });
    if (!spriteResponse.ok) {
      throw new Error(`Thumbnail sprite not found: ${spriteUrl}`);
    }

    return { spriteUrl, metadata };
  } catch (error) {
    console.error('Error loading seek thumbnail data:', error);
    throw error;
  }
}

/**
 * サムネイルスプライトを利用してシークバーのサムネイルを表示するためのフック
 */
export const useSeekThumbnail = (streamId: string) => {
  const [thumbnailData, setThumbnailData] = useState<{
    spriteUrl: string;
    metadata: ThumbnailSpriteMetadata;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    loadSeekThumbnailData(streamId)
      .then(data => {
        setThumbnailData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load seek thumbnail:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [streamId]);

  /**
   * 指定した時間位置（秒）に対応するサムネイルのスタイルを返す
   * @param timeInSeconds 動画内の時間位置（秒）
   */
  const getThumbnailStyle = (timeInSeconds: number) => {
    if (!thumbnailData) return {};

    const { metadata, spriteUrl } = thumbnailData;
    const frameIndex = Math.min(
      Math.round(timeInSeconds / metadata.interval),
      metadata.count - 1
    );

    const row = Math.floor(frameIndex / metadata.columns);
    const col = frameIndex % metadata.columns;

    // スプライト全体のサイズを計算（全幅 = サムネイル幅 × 列数）
    const fullSpriteWidth = metadata.thumbnailWidth * metadata.columns;
    const fullSpriteHeight = metadata.thumbnailHeight * metadata.rows;

    return {
      backgroundImage: `url(${spriteUrl})`,
      backgroundPosition: `-${col * metadata.thumbnailWidth}px -${row * metadata.thumbnailHeight}px`,// スプライト全体のサイズを基準としたbackgroundSizeを計算
      backgroundSize: `${fullSpriteWidth}px ${fullSpriteHeight}px`,
      // 個別サムネイルの表示サイズを指定
      width: `${metadata.thumbnailWidth}px`,
      height: `${metadata.thumbnailHeight}px`,
    };
  };

  return {
    getThumbnailStyle,
    isLoading,
    error,
    thumbnailData
  };
};
