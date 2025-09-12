import React, { Suspense } from 'react';

const TelegramApp = React.lazy(() => import('@/components/TelegramApp'));

const Index = () => {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading…</div>}>
      <TelegramApp />
    </Suspense>
  );
};

export default Index;
