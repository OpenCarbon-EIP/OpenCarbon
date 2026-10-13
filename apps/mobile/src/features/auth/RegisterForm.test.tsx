import { render, screen, userEvent } from '@testing-library/react-native';
import { useRegister } from '@opencarbon/api/react';
import { RegisterForm } from './RegisterForm';

jest.mock('@opencarbon/api/react', () => ({ useRegister: jest.fn() }));

const mutate = jest.fn();

beforeEach(() => {
  mutate.mockReset();
  jest.mocked(useRegister).mockReturnValue({ mutate, isPending: false, isError: false } as never);
});

const submit = () => screen.getByRole('button', { name: 'Créer mon compte' });

describe('RegisterForm', () => {
  it('coche les règles du mot de passe au fil de la saisie', async () => {
    const user = userEvent.setup();
    await render(<RegisterForm />);

    await user.type(screen.getByLabelText('Mot de passe'), 'secret');

    expect(screen.getByLabelText('Une minuscule : respecté')).toBeOnTheScreen();
    expect(screen.getByLabelText('Une majuscule : non respecté')).toBeOnTheScreen();
    expect(screen.getByLabelText('Un symbole : non respecté')).toBeOnTheScreen();
  });

  it('refuse un mot de passe trop faible', async () => {
    const user = userEvent.setup();
    await render(<RegisterForm />);

    await user.type(screen.getByLabelText('Mot de passe'), 'secret12');
    await user.press(submit());

    expect(await screen.findByText('Mot de passe trop faible')).toBeOnTheScreen();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('inscrit un consultant', async () => {
    const user = userEvent.setup();
    await render(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'Consultant' })).toBeSelected();
    await user.type(screen.getByLabelText('Email'), 'ada@opencarbon.dev');
    await user.type(screen.getByLabelText('Mot de passe'), 'Secret12!');
    await user.type(screen.getByLabelText('Prénom'), 'Ada');
    await user.type(screen.getByLabelText('Nom'), 'Lovelace');
    await user.type(screen.getByLabelText('Titre professionnel'), 'Consultante bilan carbone');
    await user.press(submit());

    expect(mutate).toHaveBeenCalledWith({
      role: 'CONSULTANT',
      email: 'ada@opencarbon.dev',
      password: 'Secret12!',
      first_name: 'Ada',
      last_name: 'Lovelace',
      professional_title: 'Consultante bilan carbone',
    });
  });

  it('inscrit une entreprise sans les champs consultant, taille convertie en nombre', async () => {
    const user = userEvent.setup();
    await render(<RegisterForm />);

    await user.press(screen.getByRole('button', { name: 'Entreprise' }));
    expect(screen.getByRole('button', { name: 'Entreprise' })).toBeSelected();
    expect(screen.queryByLabelText('Prénom')).not.toBeOnTheScreen();

    await user.type(screen.getByLabelText('Email'), 'contact@acme.dev');
    await user.type(screen.getByLabelText('Mot de passe'), 'Secret12!');
    await user.type(screen.getByLabelText("Nom de l'entreprise"), 'Acme');
    await user.type(screen.getByLabelText("Taille de l'entreprise (optionnel)"), '42');
    await user.press(submit());

    expect(mutate).toHaveBeenCalledWith({
      role: 'COMPANY',
      email: 'contact@acme.dev',
      password: 'Secret12!',
      company_name: 'Acme',
      company_size: 42,
    });
  });
});
