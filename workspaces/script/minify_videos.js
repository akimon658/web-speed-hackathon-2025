import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * TS segmentファイルのサイズを小さくする
 * @param {string} segmentsDir - TS segmentsが格納されているディレクトリパス
 * @param {Object} options - オプション
 * @param {number} options.crf - 圧縮品質 (10-51, 低いほど高品質, デフォルト: 23)
 * @param {number} options.preset - 圧縮速度 (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow, デフォルト: medium)
 * @param {boolean} options.backupOriginals - 元のファイルをバックアップするかどうか (デフォルト: true)
 * @param {string} options.scale - 解像度のスケール (例: "640:-1" で幅640px, 高さはアスペクト比維持)
 * @param {string} options.maxBitrate - 最大ビットレート (例: "800k")
 * @param {string} options.audioBitrate - 音声ビットレート (例: "64k")
 */
async function optimizeTsSegments(segmentsDir, options = {}) {
  const {
    crf = 23,
    preset = 'medium',
    backupOriginals = true,
    scale = null,
    maxBitrate = null,
    audioBitrate = '128k',
  } = options;

  // TS segmentsファイルのリストを取得
  const segmentFiles = fs.readdirSync(segmentsDir)
    .filter(file => file.endsWith('.ts'))
    .sort();

  if (segmentFiles.length === 0) {
    console.error(`No TS segments found in ${segmentsDir}`);
    return null;
  }

  // バックアップディレクトリの作成
  const backupDir = path.join(segmentsDir, 'originals');
  if (backupOriginals && !fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 一時ディレクトリの作成
  const tempDir = path.join(segmentsDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  console.log(`Optimizing ${segmentFiles.length} TS segment files in ${segmentsDir}...`);
  console.log(`Settings: CRF=${crf}, Preset=${preset}, Scale=${scale || 'original'}, MaxBitrate=${maxBitrate || 'unlimited'}, AudioBitrate=${audioBitrate}`);

  for (let i = 0; i < segmentFiles.length; i++) {
    const segmentFile = segmentFiles[i];
    const segmentPath = path.join(segmentsDir, segmentFile);
    const tempOutputPath = path.join(tempDir, segmentFile);

    // 元のファイルサイズを取得
    const originalSize = fs.statSync(segmentPath).size;
    totalOriginalSize += originalSize;

    console.log(`[${i + 1}/${segmentFiles.length}] Optimizing ${segmentFile}...`);

    try {
      // FFmpegコマンドの構築
      let ffmpegCmd = `ffmpeg -y -i "${segmentPath}" `;

      // スケールフィルターの追加（指定されている場合）
      if (scale) {
        ffmpegCmd += `-vf "scale=${scale}" `;
      }

      // ビデオコーデックとパラメーター
      ffmpegCmd += `-c:v libx264 -crf ${crf} -preset ${preset} `;

      // 最大ビットレートの制限（指定されている場合）
      if (maxBitrate) {
        ffmpegCmd += `-maxrate ${maxBitrate} -bufsize ${maxBitrate} `;
      }

      // オーディオコーデックとビットレート
      ffmpegCmd += `-c:a aac -b:a ${audioBitrate} `;

      // 出力ファイル
      ffmpegCmd += `"${tempOutputPath}"`;

      execSync(ffmpegCmd, { stdio: 'ignore' });

      // 最適化後のファイルサイズを取得
      const optimizedSize = fs.statSync(tempOutputPath).size;

      const reductionPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
      console.log(`  ${segmentFile}: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(optimizedSize / 1024 / 1024).toFixed(2)} MB (${reductionPercent}% 削減)`);

      // バックアップを作成
      if (backupOriginals) {
        fs.copyFileSync(segmentPath, path.join(backupDir, segmentFile));
      }

      // 最適化されたファイルで上書き
      if (optimizedSize < originalSize) {
        totalOptimizedSize += optimizedSize;
        fs.copyFileSync(tempOutputPath, segmentPath);
      } else {
        console.log(`  Skipping ${segmentFile}: Optimized size is not smaller than original`);
      }
      fs.unlinkSync(tempOutputPath);
    } catch (error) {
      console.error(`  Error optimizing ${segmentFile}:`, error);
    }
  }

  // 一時ディレクトリの削除
  try {
    fs.rmdirSync(tempDir);
  } catch (error) {
    console.error(`Error removing temp directory: ${error.message}`);
  }

  const totalReductionPercent = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2);
  console.log('\nOptimization completed:');
  console.log(`  Original total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Optimized total size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total size reduction: ${totalReductionPercent}%`);
}

const streamsDir = path.resolve(import.meta.dirname, '../../workspaces/server/streams/');
const streamIds = ['caminandes2', 'dailydweebs', 'glasshalf', 'wing-it'];

// 各ストリームのセグメントを最適化
for (const streamId of streamIds) {
  const segmentsDir = path.join(streamsDir, streamId);
  console.log(`\nProcessing stream: ${streamId}`);

  optimizeTsSegments(segmentsDir, {
    crf: 28,              // 品質設定 (10-51、低いほど高品質、28は標準より少し低品質)
    preset: 'fast',       // エンコード速度と圧縮率のバランス
    backupOriginals: true,
    scale: '1280:-1',      // 幅を640pxに制限、高さはアスペクト比を維持
    maxBitrate: '800k',   // ビットレートを800kbpsに制限
    audioBitrate: '96k'   // 音声品質も下げる
  });
}
