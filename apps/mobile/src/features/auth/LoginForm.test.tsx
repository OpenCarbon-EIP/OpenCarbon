import { render, screen, userEvent } from '@testing-library/react-native';
import { useLogin } from '@opencarbon/api/react';
import { LoginForm } from './LoginForm';

jest.mock('@opencarbon/api/react', () => ({ useLogin: jest.fn() }));

const mutate = jest.fn();

beforeEach(() => {
  mutate.mockReset();
  jest.mocked(useLogin).mockReturnValue({ mutate, isPending: false, isError: false } as never);
});

describe('LoginForm', () => {
  it('affiche les erreurs de validation sans appeler le backend', async () => {
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'pas-un-email');
    await user.press(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Email invalide')).toBeOnTheScreen();
    expect(screen.getByText('Mot de passe requis')).toBeOnTheScreen();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('envoie les identifiants valides', async () => {
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'ada@opencarbon.dev');
    await user.type(screen.getByLabelText('Mot de passe'), 'Secret12!');
    await user.press(screen.getByRole('button', { name: 'Se connecter' }));

    expect(mutate).toHaveBeenCalledWith({ email: 'ada@opencarbon.dev', password: 'Secret12!' });
  });

  it("affiche l'erreur renvoyée par le backend", async () => {
    jest.mocked(useLogin).mockReturnValue({
      mutate,
      isPending: false,
      isError: true,
      error: new Error('Identifiants invalides'),
    } as never);
    await render(<LoginForm />);

    expect(screen.getByText('Identifiants invalides')).toBeOnTheScreen();
  });
});
