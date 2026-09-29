// Sparkles for an active exercise card. Each star is its own element with its own timing, so they twinkle and
// float independently. A star only "restarts" while fully faded out, so nothing ever visibly jumps.
// Motion lives in styles.css; the drift direction comes from <html data-dust="...">.
//
// [x %, y %, size px, cycle seconds, start offset seconds, tone, natural drift x px, natural drift y px]
const STARS = [
  [6, 22, 2.5, 7, -1, 'a', -6, -9],
  [14, 70, 2, 5.5, -3, 'w', 8, -7],
  [22, 38, 3, 8.5, -5, 'a', -4, -11],
  [31, 84, 2, 6, -2, 'w', 7, -8],
  [38, 16, 2, 9, -6.5, 'w', -9, -6],
  [46, 58, 3, 7.5, -4, 'a', 5, -10],
  [54, 30, 2, 5, -0.5, 'w', -7, -8],
  [61, 78, 2.5, 8, -7, 'a', 9, -9],
  [68, 12, 2, 6.5, -3.5, 'w', -5, -12],
  [74, 48, 3, 9.5, -8, 'a', 6, -7],
  [81, 86, 2, 5.8, -1.5, 'w', -8, -9],
  [86, 28, 2.5, 7.2, -5.5, 'a', 7, -10],
  [92, 62, 2, 6.2, -2.5, 'w', -6, -8],
  [96, 14, 2.5, 8.8, -6, 'a', -9, -9],
  [27, 52, 2, 10, -9, 'w', 8, -6],
  [76, 70, 2, 4.8, -4.5, 'w', -7, -11],
]

export default function Dust() {
  return (
    <span className="dust" aria-hidden="true">
      {STARS.map(([x, y, size, t, d, tone, nx, ny], i) => (
        <i
          key={i}
          className="star"
          style={{
            '--x': `${x}%`,
            '--y': `${y}%`,
            '--s': `${size}px`,
            '--t': `${t}s`,
            '--d': `${d}s`,
            '--c': tone === 'a' ? 'var(--accent)' : '#fff',
            '--nx': `${nx}px`,
            '--ny': `${ny}px`,
          }}
        />
      ))}
    </span>
  )
}
