import * as signalR from '@microsoft/signalr';
import { useEffect, useRef } from 'react';
import { battleHubEvents } from '../battleHubEvents';
import { config } from '../config';
import type { BattleSnapshot, CampaignScene } from '../types';

export function useBattleHub(
  publicToken: string | null | undefined,
  onUpdate: (snapshot: BattleSnapshot) => void,
  accessToken?: string | null,
  onScenesUpdated?: (scenes: CampaignScene[]) => void,
  onHubFailed?: () => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onScenesUpdatedRef = useRef(onScenesUpdated);
  onScenesUpdatedRef.current = onScenesUpdated;
  const onHubFailedRef = useRef(onHubFailed);
  onHubFailedRef.current = onHubFailed;
  const listenScenes = onScenesUpdated != null;

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

    connection.on(battleHubEvents.battle, (snapshot: BattleSnapshot) => {
      onUpdateRef.current(snapshot);
    });

    if (listenScenes) {
      connection.on(battleHubEvents.scenes, (scenes: CampaignScene[]) => {
        onScenesUpdatedRef.current?.(scenes);
      });
    }

    let cancelled = false;
    const joinMethod = accessToken ? 'JoinBattleMaster' : 'JoinBattle';

    connection.onclose((err) => {
      if (!cancelled && err) {
        onHubFailedRef.current?.();
      }
    });

    (async () => {
      try {
        await connection.start();
        if (!cancelled) {
          await connection.invoke(joinMethod, publicToken);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Falha ao conectar no hub de batalha', err);
          onHubFailedRef.current?.();
        }
      }
    })();

    return () => {
      cancelled = true;
      connection.off(battleHubEvents.battle);
      if (listenScenes) {
        connection.off(battleHubEvents.scenes);
      }
      void connection.stop();
    };
  }, [publicToken, accessToken, listenScenes]);
}
