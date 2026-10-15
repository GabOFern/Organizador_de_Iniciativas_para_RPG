import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CampaignsHomePage } from '../pages/CampaignsHomePage';
import { ApiError } from '../api';
import {
  campaignsLoadingMessage,
  requestFailedMessage,
} from '../config';
import { ThemeProvider } from '../theme';

function renderHome() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <CampaignsHomePage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const listCampaigns = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      listCampaigns: (...args: unknown[]) => listCampaigns(...args),
    },
  };
});

vi.mock('../auth', () => ({
  useAuth: () => ({
    loginCampaign: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    token: null,
    campaignId: null,
    campaignName: null,
    campaignPublicToken: null,
  }),
}));

describe('CampaignsHomePage load UX', () => {
  beforeEach(() => {
    listCampaigns.mockReset();
  });

  it('durante falha transitória mostra Carregando dados e não Falha na requisição', async () => {
    listCampaigns.mockRejectedValue(new ApiError(requestFailedMessage, 502));

    renderHome();

    await waitFor(() => {
      expect(listCampaigns).toHaveBeenCalled();
    });

    expect(screen.getByText(campaignsLoadingMessage)).toBeTruthy();
    expect(screen.queryByText(requestFailedMessage)).toBeNull();
  });

  it('após sucesso mostra a campanha sem banner de erro', async () => {
    listCampaigns.mockResolvedValue([
      {
        id: 'c1',
        name: 'Desaparecidos',
        imageUrl: null,
        description: null,
        publicToken: 'tok',
        createdAtUtc: '2026-01-01T00:00:00Z',
      },
    ]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Desaparecidos')).toBeTruthy();
    });
    expect(screen.queryByText(requestFailedMessage)).toBeNull();
  });
});
