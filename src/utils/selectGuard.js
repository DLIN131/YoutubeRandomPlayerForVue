// 歌曲列表的整列都可以點來播放。拖曳選取歌名時，放開滑鼠也會觸發 click，
// 這裡在捕獲階段攔下「拖曳後留下選取文字」的那次 click，選字複製時不會順便切歌。

const DRAG_THRESHOLD = 5

export const installSelectGuard = () => {
  let downX = 0
  let downY = 0

  document.addEventListener('mousedown', (e) => {
    downX = e.clientX
    downY = e.clientY
  }, true)

  document.addEventListener('click', (e) => {
    const moved = Math.abs(e.clientX - downX) > DRAG_THRESHOLD || Math.abs(e.clientY - downY) > DRAG_THRESHOLD
    const selection = window.getSelection()
    if (moved && selection && !selection.isCollapsed && selection.toString().trim()) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, true)
}
