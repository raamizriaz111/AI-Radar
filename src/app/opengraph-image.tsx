import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Radar — Real-Time AI Intelligence & Horizon';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #090B0F 0%, #0F172A 60%, #020617 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar with live badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              ✦
            </div>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              AI Radar
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ● LIVE STREAM VERIFIED
          </div>
        </div>

        {/* Hero headline & description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '950px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            The Signal Layer for the Rapidly Changing AI World.
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#94A3B8',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            We track papers, model weights, and verified developer tooling — synthesized into plain English before the news hits the public.
          </p>
        </div>

        {/* Bottom meta strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '32px',
            width: '100%',
            color: '#64748B',
            fontSize: '18px',
          }}
        >
          <span>219+ Primary Sources</span>
          <span>•</span>
          <span>Zero Hallucinations</span>
          <span>•</span>
          <span>Plain-English Synthesis</span>
          <span>•</span>
          <span>Forward-Looking Horizon</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
