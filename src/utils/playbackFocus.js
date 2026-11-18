// 同一時間只讓一個播放器出聲。
// 播放頁的播放器切到其他頁時會繼續播，動畫 OP/ED、VTuber 頁也各有自己的播放器；
// 任何一個開始播放時，先暫停上一個在播的。

let currentPause = null

export const claimPlayback = (pause) => {
  if (currentPause && currentPause !== pause) currentPause()
  currentPause = pause
}

export const releasePlayback = (pause) => {
  if (currentPause === pause) currentPause = null
}
