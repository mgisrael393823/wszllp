import React, { useContext } from 'react';
import { EFileContext } from '@/context/EFileContext';
import EFileStatusItem from './EFileStatusItem';

const EFileStatusList: React.FC = () => {
  const { state } = useContext(EFileContext);

  return (
    <div>
      <ul>
        {Object.keys(state.envelopes).map(id => (
          <EFileStatusItem key={id} envelopeId={id} />
        ))}
      </ul>
    </div>
  );
};

export default EFileStatusList;
