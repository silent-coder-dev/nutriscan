import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#2e6b46',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderTopLeftRadius: 16,
          borderBottomRightRadius: 16,
          borderTopRightRadius: 4,
          borderBottomLeftRadius: 4,
          padding: '8px 8px',
        }}
      >
        {[3, 1.5, 3, 1.5, 3].map((w, i) => (
          <div key={i} style={{ width: w, height: '100%', background: '#f4efe3', borderRadius: 1 }} />
        ))}
      </div>
    ),
    {
      ...size,
    }
  );
}
