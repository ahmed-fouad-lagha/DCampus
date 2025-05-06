import React, { useEffect, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as serviceWorkerRegistration from '../../serviceWorkerRegistration';

const ServiceWorkerUpdater: React.FC = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { t } = useTranslation();

  const onSWUpdate = (registration: ServiceWorkerRegistration) => {
    setShowReload(true);
    setWaitingWorker(registration.waiting);
  };

  useEffect(() => {
    // Register service worker
    serviceWorkerRegistration.register({
      onUpdate: onSWUpdate,
    });
  }, []);

  const handleReload = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    window.location.reload();
  };

  return (
    <Snackbar 
      open={showReload} 
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        severity="info" 
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleReload}
          >
            {t('pwa.reload')}
          </Button>
        }
      >
        {t('pwa.newVersionAvailable')}
      </Alert>
    </Snackbar>
  );
};

export default ServiceWorkerUpdater;