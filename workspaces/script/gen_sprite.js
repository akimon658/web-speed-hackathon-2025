import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * MPEG-2 Transport Stream segmentsからサムネイルスプライトを生成する
 * @param {string} segmentsDir - TS segmentsが格納されているディレクトリパス
 * @param {Object} options - オプション
 * @param {number} options.interval - サムネイル間の秒数 (デフォルト: 1)
 * @param {number} options.thumbnailWidth - サムネイルの幅 (デフォルト: 160)
 * @param {number} options.thumbnailHeight - サムネイルの高さ (デフォルト: 90)
 * @param {number} options.columns - スプライト画像の列数 (デフォルト: 10)
 */
async function generateThumbnailSprite(segmentsDir, options = {}) {
  const {
    interval = 1,
    thumbnailWidth = 160,
    thumbnailHeight = 90,
    columns = 10,
    useJpegFallback = false,
    maxThumbnails = 300,
  } = options;

  // TS segmentsファイルのリストを取得
  const segmentFiles = fs.readdirSync(segmentsDir)
    .filter(file => file.endsWith('.ts'))
    .sort();

  if (segmentFiles.length === 0) {
    console.error(`No TS segments found in ${segmentsDir}`);
    return null;
  }

  // 一時ファイルパス
  const tempDir = path.join(segmentsDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const concatListPath = path.join(tempDir, 'concat_list.txt');
  // エンコーダが利用可能かによって出力フォーマットを決定
  const outputFormat = useJpegFallback ? 'jpg' : 'avif';
  const spriteOutputPath = path.join(segmentsDir, `sprite.${outputFormat}`);
  const metadataOutputPath = path.join(segmentsDir, 'sprite.json');

  try {
    // 全てのTS segmentの時間を合計して正確な総時間を取得
    console.log('Getting total video duration...');
    let totalDuration = 0;

    for (const segmentFile of segmentFiles) {
      const segmentPath = path.join(segmentsDir, segmentFile);
      const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${segmentPath}"`).toString();
      const segmentDuration = parseFloat(durationOutput.trim());

      if (!isNaN(segmentDuration)) {
        totalDuration += segmentDuration;
      }
    }


    console.log(`Total video duration calculated: ${totalDuration.toFixed(2)} seconds`);

    // 全セグメントの連結リストを作成
    console.log('Creating concat list...');
    const segmentPaths = segmentFiles.map(file => path.join(segmentsDir, file));
    const concatList = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatListPath, concatList);

    // サムネイル数を計算（間隔に基づく）
    const thumbnailCount = Math.min(Math.ceil(totalDuration / interval), maxThumbnails);

    // サムネイルスプライトの生成
    console.log(`Generating thumbnail sprite in ${outputFormat.toUpperCase()} format...`);
    const rows = Math.ceil(thumbnailCount / columns);
    //
    // 出力フォーマットに応じてFFmpegコマンドを変更
    // AVIF形式の場合、エンコード速度と品質のバランスを調整
    let ffmpegCmd;

    if (useJpegFallback) {
      ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i ${concatListPath} -vf "select='not(mod(n,${interval}*30))',setpts=N/FRAME_RATE/TB,scale=${thumbnailWidth}:${thumbnailHeight},tile=${columns}x${rows}" -frames:v 1 -q:v 5 ${spriteOutputPath}`;
    } else {
      // AVIFエンコードの設定を調整：
      // - speed=6: エンコード速度を上げる（0-8の範囲、高いほど速い）
      // - tile-columns=2: タイル列数を設定
      // - tile-rows=2: タイル行数を設定
      // - cpu-used=4: CPU使用量を調整（0-8の範囲、高いほど速く品質は低下）
      ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i ${concatListPath} -vf "select='not(mod(n,${interval}*30))',setpts=N/FRAME_RATE/TB,scale=${thumbnailWidth}:${thumbnailHeight},tile=${columns}x${rows}" -frames:v 1 -c:v libaom-av1 -crf 30 -b:v 0 -cpu-used 4 -row-mt 1 -tile-columns 2 -tile-rows 2 ${spriteOutputPath}`;
    }

    console.log(`Executing FFmpeg command: ${ffmpegCmd}`);
    execSync(ffmpegCmd);

    // メタデータの生成
    const metadata = {
      version: 1,
      thumbnailWidth,
      thumbnailHeight,
      columns,
      rows,
      count: thumbnailCount,
      interval,
      duration: totalDuration,
    };

    fs.writeFileSync(metadataOutputPath, JSON.stringify(metadata, null, 2));
    console.log(`Thumbnail sprite generated at ${spriteOutputPath}`);

    // 一時ファイルの削除
    fs.unlinkSync(concatListPath);

    return {
      spritePath: spriteOutputPath,
      metadataPath: metadataOutputPath
    };
  } catch (error) {
    console.error('Error generating thumbnail sprite:', error);
    return null;
  }
}

const streamsDir = path.resolve(import.meta.dirname, '../../workspaces/server/streams/');
const streamIds = ['caminandes2', 'dailydweebs', 'glasshalf', 'wing-it'];

for (const streamId of streamIds) {
  const segmentsDir = path.join(streamsDir, streamId);
  generateThumbnailSprite(segmentsDir);
}
