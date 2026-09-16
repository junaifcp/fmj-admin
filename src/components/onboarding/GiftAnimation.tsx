import React, { Suspense, lazy } from "react";
import { Gift } from "lucide-react";

// Lazy load Lottie to reduce bundle size
const Lottie = lazy(() => import("lottie-react"));

// Fallback animation using CSS
const FallbackGiftAnimation: React.FC = () => {
  return (
    <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto">
      <div className="absolute inset-0 animate-pulse">
        <Gift className="w-full h-full text-primary" />
      </div>
      <div className="absolute inset-0 animate-ping opacity-20">
        <Gift className="w-full h-full text-primary" />
      </div>
    </div>
  );
};

// Lottie gift animation data (simplified inline)
const giftAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Gift Box",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Gift",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [360] },
            { t: 60, s: [360] },
          ],
        },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0], e: [100, 100] },
            { t: 20, s: [100, 100], e: [110, 110] },
            { t: 30, s: [110, 110], e: [100, 100] },
            { t: 60, s: [100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

export const GiftAnimation: React.FC = () => {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return <FallbackGiftAnimation />;
  }

  return (
    <Suspense fallback={<FallbackGiftAnimation />}>
      <div className="relative inline-block w-24 h-24 mx-auto">
        <Lottie
          animationData={giftAnimationData}
          loop
          className="w-full h-full"
          onError={() => setUseFallback(true)}
        />
        {/* Confetti effect overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-ping opacity-40"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      </div>
    </Suspense>
  );
};
