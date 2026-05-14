import { useState, useCallback, useEffect } from 'react';

export function useNfcScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setSupported(true);
    }
  }, []);

  const scan = useCallback(async (onRead: (serialNumber: string) => void) => {
    if (!('NDEFReader' in window)) {
      setError('Web NFC is not supported on this device.');
      return;
    }

    try {
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setIsScanning(true);
      setError(null);

      ndef.onreadingerror = () => {
        setError('Error reading NFC tag. Try again.');
      };

      ndef.onreading = (event: any) => {
        if (event.serialNumber) {
          onRead(event.serialNumber);
          // Stop scanning after successful read if desired, but there's no native stop method yet, 
          // usually we just ignore further reads or use an AbortController in ndef.scan({ signal })
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NFC Scan Failed');
      setIsScanning(false);
    }
  }, []);

  return { scan, isScanning, error, supported };
}
