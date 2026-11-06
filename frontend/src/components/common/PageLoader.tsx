import React from 'react';
import { DashboardSkeleton } from './DashboardSkeleton';

export const PageLoader: React.FC = () => {
  return <DashboardSkeleton standalone={true} />;
};
