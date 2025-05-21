import React, { useContext } from 'react';
import { EFileContext } from '@/context/EFileContext';
import Typography from '../ui/Typography';
import EFileStatusItem from './EFileStatusItem';

const EFileStatusList: React.FC = () => {
  const { state } = useContext(EFileContext);

  return (
    <div className="mt-8">
      <Typography variant="h2">Filing Status</Typography>
      <ul>
        {Object.keys(state.envelopes).map(id => (
          <EFileStatusItem key={id} envelopeId={id} />
        ))}
      </ul>
    </div>
  );
};

export default EFileStatusList;
