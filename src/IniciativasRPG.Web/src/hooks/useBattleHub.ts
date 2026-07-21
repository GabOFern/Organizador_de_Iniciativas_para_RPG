import * as signalR from '@microsoft/signalr';
import { useEffect, useRef } from 'react';
import { config } from '../config';
import type { BattleSnapshot } from '../types';

const BATTLE_UPDATED = 'BattleUpdated';

export function useBattleHub(
  publicToken: string | null | undefined,
  onUpdate: (snapshot: BattleSnapshot) => void,
  accessToken?: string | null,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!publicToken) {
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(config.hubUrl, {
        accessTokenFactory: accessToken ? () => accessToken : undefined,
      })
      .withAutomaticReconnect()
      .build();

    connection.on(BATTLE_UPDATED, (snapshot: BattleSnapshot) => {
      onUpdateRef.current(snapshot);
    });

    let cancelled = false;

    (async () => {
      try {
        await connection.start();
        if (!cancelled) {
          await connection.invoke('JoinBattle', publicToken);
        }
      } catch (err) {
        console.error('Falha ao conectar no hub de batalha', err);
      }
    })();

    return () => {
      cancelled = true;
      connection.off(BATTLE_UPDATED);
      void connection.stop();
    };
  }, [publicToken, accessToken]);
}
