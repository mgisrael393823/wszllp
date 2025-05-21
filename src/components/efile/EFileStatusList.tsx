import React, { useContext } from 'react';
import { EFileContext } from '@/context/EFileContext';
import Typography from '../ui/Typography';

const EFileStatusList: React.FC = () => {
  const { state } = useContext(EFileContext);

  return (
    <div className="mt-8">
      <Typography variant="h2">Filing Status</Typography>
      <ul>
        {Object.entries(state.envelopes).map(([caseId, envId]) => (
          <li key={envId} className="mt-2 text-sm text-gray-700">
            {caseId} – Envelope {envId}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EFileStatusList;
